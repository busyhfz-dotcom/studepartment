import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth/auth";
import { isEmailDeliveryConfigured } from "@/server/notifications/email";

const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;
export async function POST(request: Request) {
  const path = new URL(request.url).pathname;
  if ((path.endsWith("/request-password-reset") || path.endsWith("/forget-password")) && !isEmailDeliveryConfigured()) {
    return Response.json({ code: "EMAIL_DELIVERY_NOT_CONFIGURED", message: "Password recovery is unavailable until email delivery is enabled." }, { status: 503 });
  }
  const response = await handlers.POST(request);
  if (response.status === 429 && !response.headers.has("retry-after")) {
    const retryAfter = response.headers.get("x-retry-after");
    if (retryAfter) response.headers.set("retry-after", retryAfter);
  }
  return response;
}
