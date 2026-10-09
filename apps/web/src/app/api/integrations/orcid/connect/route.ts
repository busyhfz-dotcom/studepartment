import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { buildOrcidAuthorizationUrl, getOrcidConfig, OrcidConfigurationError } from "@/server/integrations/orcid/client";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    if (user.accountKind !== "INDIVIDUAL") return NextResponse.redirect(new URL("/organization/profile", request.url));
    const config = getOrcidConfig();
    const state = randomBytes(32).toString("base64url");
    const response = NextResponse.redirect(buildOrcidAuthorizationUrl(config, state));
    response.cookies.set("studepartment_orcid_state", `${user.id}.${state}`, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600,
    });
    return response;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      const url = new URL("/auth/sign-in", request.url);
      url.searchParams.set("callbackUrl", "/api/integrations/orcid/connect");
      return NextResponse.redirect(url);
    }
    const url = new URL("/profile/orcid", request.url);
    url.searchParams.set("orcid", error instanceof OrcidConfigurationError ? "not-configured" : "error");
    return NextResponse.redirect(url);
  }
}
