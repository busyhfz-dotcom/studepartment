import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/profile/edit#profile-link-orcid", request.url));
  response.cookies.delete("provenant_orcid_state");
  return response;
}
