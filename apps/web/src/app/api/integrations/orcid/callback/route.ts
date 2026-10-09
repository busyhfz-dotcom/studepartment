import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { assertValidOrcid } from "@/server/integrations/orcid/orcid-id";
import { importOwnedOrcidProfile } from "@/server/integrations/orcid/import-profile";
import {
  exchangeOrcidAuthorizationCode,
  getOrcidConfig,
} from "@/server/integrations/orcid/client";
import {
  OrcidVerificationRepositoryError,
  verifyOrcidForUser,
} from "@/server/repositories/orcid-verification-repository";

const STATE_COOKIE = "studepartment_orcid_state";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function redirectWithStatus(request: Request, status: string) {
  const url = new URL("/profile", request.url);
  url.searchParams.set("orcid", status);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (user.accountKind !== "INDIVIDUAL") return redirectWithStatus(request, "invalid-state");
    const providerError = request.nextUrl.searchParams.get("error");
    if (providerError) return redirectWithStatus(request, "denied");

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const stateCookie = request.cookies.get(STATE_COOKIE)?.value;
    if (!code || !state || !stateCookie) return redirectWithStatus(request, "invalid-state");

    const separator = stateCookie.indexOf(".");
    if (separator < 1) return redirectWithStatus(request, "invalid-state");
    const cookieUserId = stateCookie.slice(0, separator);
    const cookieState = stateCookie.slice(separator + 1);
    if (cookieUserId !== user.id || !safeEqual(cookieState, state)) {
      return redirectWithStatus(request, "invalid-state");
    }

    const config = getOrcidConfig();
    const identity = await exchangeOrcidAuthorizationCode(config, code);
    const orcid = assertValidOrcid(identity.orcid);
    await verifyOrcidForUser(user.id, {
      orcid,
      environment: config.environment,
      scope: identity.scope,
    });

    try {
      const imported = await importOwnedOrcidProfile(orcid, identity.accessToken);
      return redirectWithStatus(request, imported.partial ? "import-partial" : "imported");
    } catch {
      return redirectWithStatus(request, "import-failed");
    }
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      const url = new URL("/auth/sign-in", request.url);
      url.searchParams.set("callbackUrl", "/profile");
      return NextResponse.redirect(url);
    }
    if (error instanceof OrcidVerificationRepositoryError && error.code === "ORCID_ALREADY_CONNECTED") {
      return redirectWithStatus(request, "conflict");
    }
    console.error("ORCID verification callback failed", error);
    return redirectWithStatus(request, "error");
  }
}
