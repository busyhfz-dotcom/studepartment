import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import {
  buildOrcidAuthorizationUrl,
  getOrcidConfig,
  OrcidConfigurationError,
} from "@/server/integrations/orcid/client";

const STATE_COOKIE = "studepartment_orcid_state";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const config = getOrcidConfig();
    const state = randomBytes(32).toString("base64url");
    const authorizationUrl = buildOrcidAuthorizationUrl(config, state);
    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set(STATE_COOKIE, `${user.id}.${state}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      const url = new URL("/auth/sign-in", request.url);
      url.searchParams.set("callbackUrl", "/api/integrations/orcid/connect");
      return NextResponse.redirect(url);
    }
    if (error instanceof OrcidConfigurationError) {
      const url = new URL("/profile/orcid", request.url);
      url.searchParams.set("orcid", "not-configured");
      return NextResponse.redirect(url);
    }
    console.error("Could not start ORCID OAuth", error);
    const url = new URL("/profile/orcid", request.url);
    url.searchParams.set("orcid", "error");
    return NextResponse.redirect(url);
  }
}
