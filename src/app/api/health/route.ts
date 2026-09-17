import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "studepartment-web", timestamp: new Date().toISOString() });
}
