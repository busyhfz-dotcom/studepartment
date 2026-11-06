import { NextResponse } from "next/server";

export function GET() {
  const response = new NextResponse(null, { status: 307, headers: { Location: "/profile/edit#profile-link-orcid" } });
  response.cookies.delete("provenant_orcid_state");
  return response;
}
