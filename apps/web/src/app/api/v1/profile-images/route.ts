import { getDb } from "@studepartment/db";
import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { consumeRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";
import { getCoreRuntimeConfig } from "@/server/config/environment";

export const runtime = "nodejs";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function failure(status: number, message: string) {
  return NextResponse.json({ success: false, error: { message } }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (request.headers.get("origin") !== new URL(getCoreRuntimeConfig().betterAuthUrl).origin) return failure(403, "Upload this photo from Studepartment.");
    await consumeRateLimit("profile-image:upload", user.id, { windowSeconds: 3600, max: 20 });
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) return failure(400, "Choose an image file.");
    const reader = request.body?.getReader();
    if (!reader) return failure(400, "Choose an image file.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_FILE_BYTES + 65536) {
        await reader.cancel();
        return failure(413, "Choose a photo smaller than 10 MB.");
      }
      chunks.push(chunk.value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES) return failure(400, "Choose a photo smaller than 10 MB.");
    const original = Buffer.from(await file.arrayBuffer());
    let data: Buffer;
    try {
      const image = sharp(original, { limitInputPixels: 32_000_000, animated: false });
      const metadata = await image.metadata();
      if (!["jpeg", "png", "webp", "heif", "avif", "gif"].includes(metadata.format ?? "")) return failure(400, "Choose a JPG, PNG, WebP or supported phone photo.");
      data = await image.rotate().resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      if (data.length > 256 * 1024) return failure(400, "This photo is too complex. Choose a smaller image.");
    } catch {
      return failure(400, "This image could not be read. Try a JPG, PNG or WebP photo.");
    }
    const db = getDb();
    const image = await db.$transaction(async (tx) => {
      const owner = await tx.user.findUniqueOrThrow({ where: { id: user.id }, select: { image: true, ownedOrganization: { select: { logoUrl: true } } } });
      const recent = await tx.profileImage.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 2, select: { id: true } });
      const keep = [...recent.map((item) => item.id), ...[owner.image, owner.ownedOrganization?.logoUrl].flatMap((url) => url?.match(/^\/api\/v1\/profile-images\/([a-zA-Z0-9-]+)$/)?.[1] ?? [])];
      await tx.profileImage.deleteMany({ where: { ownerId: user.id, id: { notIn: keep } } });
      return tx.profileImage.create({ data: { ownerId: user.id, data: new Uint8Array(data) }, select: { id: true } });
    });
    return NextResponse.json({ success: true, data: { url: `/api/v1/profile-images/${image.id}` } }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return failure(401, "Sign in to upload a photo.");
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    console.error("Profile image upload failed", error);
    return failure(500, "The photo could not be uploaded. Please try again.");
  }
}
