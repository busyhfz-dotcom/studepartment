import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required for this resource.",
        },
      },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, data: user });
}
