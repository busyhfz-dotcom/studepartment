import { getDb } from "@studepartment/db";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { consumeClientRateLimit, consumeRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";
import { activeOpportunityWhere } from "@/server/opportunities/countries";
import { removeSavedOpportunity, saveOpportunity, SavedOpportunityError } from "@/server/opportunities/saved-opportunities";

type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "private, no-store" };

async function counts(id: string, userId?: string, existing = false) {
  const db = getDb();
  const row = await db.opportunity.findFirst({
    where: { id, ...(existing ? {} : activeOpportunityWhere(new Date(), true)) },
    select: { viewCount: true, _count: { select: { savedBy: true } },
      ...(userId ? { savedBy: { where: { userId }, select: { userId: true }, take: 1 } } : {}) },
  });
  if (!row) return NextResponse.json({ success: false }, { status: 404, headers });
  return NextResponse.json({ success: true, data: {
    views: row.viewCount, saves: row._count.savedBy, saved: Boolean(userId && row.savedBy?.length),
  } }, { headers });
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    if (!/^[a-z0-9-]{1,128}$/i.test(id) || !request.headers.get("content-type")?.startsWith("application/json")
        || request.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ success: false }, { status: 400, headers });
    }
    const input = await request.json() as { action?: unknown; saved?: unknown } | null;
    const db = getDb();
    if (input?.action === "view") {
      await consumeClientRateLimit(request, "opportunities:view", { windowSeconds: 60, max: 45 });
      const updated = await db.opportunity.updateMany({
        where: { id, ...activeOpportunityWhere(new Date(), true) }, data: { viewCount: { increment: 1 } },
      });
      if (!updated.count) return NextResponse.json({ success: false }, { status: 404, headers });
      return counts(id, (await getCurrentUser())?.id);
    }
    if (input?.action !== "save" || typeof input.saved !== "boolean") {
      return NextResponse.json({ success: false }, { status: 400, headers });
    }
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false }, { status: 401, headers });
    await consumeRateLimit("saved-opportunities:write", "user:" + user.id, { windowSeconds: 3600, max: 300 });
    const found = await db.opportunity.findFirst({ where: { id, ...(input.saved ? activeOpportunityWhere(new Date(), true) : {}) }, select: { id: true } });
    if (!found) return NextResponse.json({ success: false }, { status: 404, headers });
    if (input.saved) {
      await saveOpportunity({ opportunityId: id }, false);
    } else {
      await removeSavedOpportunity(id);
    }
    return counts(id, user.id, true);
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof SavedOpportunityError) return NextResponse.json({ success: false }, { status: error.status, headers });
    if (error instanceof SyntaxError) return NextResponse.json({ success: false }, { status: 400, headers });
    console.error("Opportunity engagement unavailable", error);
    return NextResponse.json({ success: false }, { status: 500, headers });
  }
}
