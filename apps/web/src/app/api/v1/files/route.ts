import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { requireCurrentUser } from "@/server/auth/current-user";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { listFiles, uploadFile, drainFileDeletions } from "@/server/files/repository";
import { assertFileOrigin, fileFailure } from "@/server/files/http";
import { readUpload, FileError } from "@/server/files/validation";
import type { FileScope } from "@/lib/files";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const scope = request.nextUrl.searchParams.get("scope") || undefined;
    if (scope && !["profile", "organization", "application", "library"].includes(scope)) throw new FileError("Invalid file section.");
    const data = await listFiles(user.id, scope as FileScope | undefined, request.nextUrl.searchParams.get("contextId") || undefined);
    after(() => drainFileDeletions().catch(() => undefined));
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return fileFailure(error); }
}
export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    assertFileOrigin(request);
    await consumeRateLimit("files:upload", user.id, { windowSeconds: 3600, max: 40 });
    const data = await uploadFile(user.id, await readUpload(request));
    after(() => drainFileDeletions().catch(() => undefined));
    return NextResponse.json({ success: true, data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return fileFailure(error); }
}
