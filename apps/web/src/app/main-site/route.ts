import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("studepartment_entry_seen", "1", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
