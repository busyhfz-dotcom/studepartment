import { NextResponse } from "next/server";
import { z } from "zod";
import { researchers } from "@/lib/demo-data";

const requestSchema = z.object({
  recipientSlug: z.string().min(1).max(160),
  message: z.string().trim().min(40).max(1200),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid introduction request", details: parsed.error.flatten() }, { status: 400 });

  const recipient = researchers.find((researcher) => researcher.slug === parsed.data.recipientSlug);
  if (!recipient) return NextResponse.json({ error: "Researcher not found" }, { status: 404 });

  return NextResponse.json({
    status: "validated",
    recipient: recipient.slug,
    persisted: false,
    note: "Demo mode validates the controlled-introduction contract without writing private communication data.",
  }, { status: 202 });
}
