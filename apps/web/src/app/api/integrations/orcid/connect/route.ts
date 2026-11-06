import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/profile/edit#profile-link-orcid", request.url));
}
