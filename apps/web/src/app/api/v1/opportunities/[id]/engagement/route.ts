import { getDb } from "@studepartment/db";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { consumeClientRateLimit, consumeRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";
import { activeOpportunityWhere } from "@/server/opportunities/countries";

type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "private, no-store" };

async function counts(id: string, userId?: string, existing = false) {
  const db = getDb();
  const row = await db.opportunity.findFirst({
    where: { id, ...(existing ? {} : activeOpportunityWhere()) },
    select: { viewCount: true, _count: { select: { likes: true } } },
  });
  if (!row) return NextResponse.json({ success: false }, { status: 404, headers });
  const liked = userId ? await db.opportunityLike.findUnique({
    where: { userId_opportunityId: { userId, opportunityId: id } },
    select: { userId: true },
  }) : null;
  return NextResponse.json({ success: true, data: { views: row.viewCount, likes: row._count.likes, liked: Boolean(liked) } }, { headers });
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    if (!/^[a-z0-9-]{1,128}$/i.test(id) || !request.headers.get("content-type")?.startsWith("application/json")
        || request.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ success: false }, { status: 400, headers });
    }
    const input = await request.json() as { action?: unknown; liked?: unknown } | null;
    const db = getDb();
    if (input?.action === "view") {
      await consumeClientRateLimit(request, "opportunities:view", { windowSeconds: 60, max: 45 });
      const updated = await db.opportunity.updateMany({
        where: { id, ...activeOpportunityWhere() }, data: { viewCount: { increment: 1 } },
      });
      if (!updated.count) return NextResponse.json({ success: false }, { status: 404, headers });
      return counts(id, (await getCurrentUser())?.id);
    }
    if (input?.action !== "like" || typeof input.liked !== "boolean") {
      return NextResponse.json({ success: false }, { status: 400, headers });
    }
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false }, { status: 401, headers });
    await consumeRateLimit("opportunities:like", "user:" + user.id, { windowSeconds: 300, max: 45 });
    const found = await db.opportunity.findFirst({ where: { id, ...(input.liked ? activeOpportunityWhere() : {}) }, select: { id: true } });
    if (!found) return NextResponse.json({ success: false }, { status: 404, headers });
    if (input.liked) {
      await db.opportunityLike.createMany({ data: [{ userId: user.id, opportunityId: id }], skipDuplicates: true });
    } else {
      await db.opportunityLike.deleteMany({ where: { userId: user.id, opportunityId: id } });
    }
    return counts(id, user.id, !input.liked);
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof SyntaxError) return NextResponse.json({ success: false }, { status: 400, headers });
    console.error("Opportunity engagement unavailable", error);
    return NextResponse.json({ success: false }, { status: 500, headers });
  }
}
