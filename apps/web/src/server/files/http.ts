import { NextResponse } from "next/server";
import { AuthenticationRequiredError } from "@/server/auth/current-user";
import { getCoreRuntimeConfig } from "@/server/config/environment";
import { RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";
import { FileError } from "./validation";

export function assertFileOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(getCoreRuntimeConfig().betterAuthUrl).origin) throw new FileError("Manage files from Studepartment.", 403);
}
export function fileFailure(error: unknown) {
  if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
  let status = 500, message = "The file operation could not be completed. Please try again.";
  if (error instanceof AuthenticationRequiredError) { status = 401; message = "Sign in to manage your files."; }
  else if (error instanceof FileError) { status = error.status; message = error.message; }
  else if (error instanceof SyntaxError) { status = 400; message = "Invalid file settings."; }
  else console.error("File operation failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ success: false, error: { code: "FILE_OPERATION_FAILED", message } }, { status, headers: { "Cache-Control": "private, no-store" } });
}
