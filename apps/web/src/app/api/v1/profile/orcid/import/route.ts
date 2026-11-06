import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json({
    success: false,
    error: { code: "ORCID_IMPORT_RETIRED", message: "You can save your ORCID profile link in your profile settings." },
  }, { status: 410 });
}
