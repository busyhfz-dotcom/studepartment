import { getDb } from "@studepartment/db";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, requireCurrentUser } from "@/server/auth/current-user";
import { getFileObject } from "@/server/files/storage";
import { deleteStoredFile, updateFile } from "@/server/files/repository";
import { assertFileOrigin, fileFailure } from "@/server/files/http";
import { FileError } from "@/server/files/validation";
import { consumeRateLimit } from "@/server/security/rate-limit";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const notFound = () => new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    if (!/^[a-zA-Z0-9-]{20,80}$/.test(id)) return notFound();
    const db = getDb();
    const file = await db.storedFile.findFirst({ where: { id, status: "READY" }, include: { owner: { select: { researcher: { select: { profilePublic: true } }, ownedOrganization: { select: { id: true } } } } } });
    if (!file) return notFound();
    const isPublic = file.public && (file.scope === "profile" ? file.owner.researcher?.profilePublic === true : file.scope === "organization" && Boolean(file.owner.ownedOrganization));
    if (!isPublic) {
      const user = await getCurrentUser();
      if (!user) return notFound();
      if (user.id !== file.ownerId) {
        const shared = await db.connectionRequestAttachment.findFirst({ where: { fileId: id, request: { receiver: { userId: user.id }, OR: [{ status: "ACCEPTED" }, { status: "PENDING", expiresAt: { gt: new Date() } }] } }, select: { fileId: true } });
        if (!shared) return notFound();
      }
    }
    let range: string | undefined;
    const rawRange = request.headers.get("range");
    if (rawRange) {
      if (!/^bytes=(\d+-\d*|-\d+)$/.test(rawRange)) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + file.size } });
      range = rawRange;
    }
    const object = await getFileObject(file.storageKey, range);
    if (!object.Body) return notFound();
    const headers = new Headers({
      "Content-Type": file.mediaType,
      "Content-Disposition": "attachment; filename=\"document." + (file.name.split(".").at(-1) || "bin") + "\"; filename*=UTF-8''" + encodeURIComponent(file.name).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16)),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
      "Content-Length": String(object.ContentLength ?? file.size),
    });
    if (object.ContentRange) headers.set("Content-Range", object.ContentRange);
    return new Response(object.Body.transformToWebStream() as ReadableStream<Uint8Array>, { status: range ? 206 : 200, headers });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "InvalidRange") return new Response(null, { status: 416 });
    return fileFailure(error);
  }
}
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const user = await requireCurrentUser();
    assertFileOrigin(request);
    await consumeRateLimit("files:manage", user.id, { windowSeconds: 3600, max: 200 });
    const input = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new FileError("Invalid file settings.");
    const data = await updateFile(user.id, (await params).id, input);
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return fileFailure(error); }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const user = await requireCurrentUser();
    assertFileOrigin(request);
    await consumeRateLimit("files:manage", user.id, { windowSeconds: 3600, max: 200 });
    await deleteStoredFile(user.id, (await params).id);
    return NextResponse.json({ success: true, data: { deleted: true } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return fileFailure(error); }
}
