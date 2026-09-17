import { NextResponse } from "next/server";
import { z } from "zod";
import { researchIntelligence } from "@/lib/ai";
import { currentResearcher, opportunities } from "@/lib/demo-data";

const requestSchema = z.object({ opportunitySlug: z.string().min(1).max(160) });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

  const opportunity = opportunities.find((item) => item.slug === parsed.data.opportunitySlug);
  if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  const explanation = await researchIntelligence.explainOpportunityMatch({ researcher: currentResearcher, opportunity });
  return NextResponse.json({ opportunity: opportunity.slug, explanation, provider: process.env.AI_PROVIDER ?? "demo" });
}
