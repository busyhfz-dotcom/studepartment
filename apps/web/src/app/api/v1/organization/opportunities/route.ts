import { createHash, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@studepartment/db";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { consumeClientRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";

const types = {
  phd: "PHD", postdoc: "POSTDOC", fellowship: "FELLOWSHIP", grant: "GRANT",
  collaboration: "COLLABORATION", "research-assistantship": "RESEARCH_ASSISTANTSHIP",
} as const;

function apiError(status: number, message: string) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

function requiredText(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error(`${label} is required and must be under ${max} characters.`);
  return value.trim();
}

function safeUrl(value: unknown, label: string) {
  const raw = requiredText(value, label, 2048);
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error(`${label} must use HTTPS.`);
  return url.toString();
}

async function ownedOrganization(userId: string) {
  return getDb().organization.findUnique({ where: { ownerUserId: userId }, select: { id: true, name: true, website: true, countryCode: true, verified: true } });
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const organization = await ownedOrganization(user.id);
    if (!organization) return apiError(404, "Institutional profile not found.");
    const db = getDb();
    const [rows, topics, methods] = await Promise.all([
      db.opportunity.findMany({ where: { organizationId: organization.id, sourceType: "MANUAL" }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, title: true, type: true, status: true, deadline: true, sourceUrl: true, createdAt: true } }),
      db.researchTopic.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" }, take: 100 }),
      db.researchMethod.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" }, take: 100 }),
    ]);
    return NextResponse.json({ success: true, data: { opportunities: rows, topics, methods, organizationVerified: organization.verified } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return apiError(401, error.message);
    return apiError(500, "Institutional opportunities could not be loaded.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "organization:opportunities:create", { windowSeconds: 3600, max: 20 });
    const user = await requireCurrentUser();
    const organization = await ownedOrganization(user.id);
    if (!organization) return apiError(403, "An institutional account is required.");
    const raw = await request.json() as Record<string, unknown>;
    const title = requiredText(raw.title, "Title", 220);
    const description = requiredText(raw.description, "Description", 6000);
    if (typeof raw.type !== "string" || !(raw.type in types)) return apiError(400, "Choose a valid opportunity type.");
    const type = types[raw.type as keyof typeof types];
    const sourceUrl = safeUrl(raw.sourceUrl, "Official source link");
    const applicationUrl = raw.applicationUrl ? safeUrl(raw.applicationUrl, "Application link") : sourceUrl;
    const websiteHost = organization.website ? new URL(organization.website).hostname.replace(/^www\./, "") : null;
    const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, "");
    if (websiteHost && sourceHost !== websiteHost && !sourceHost.endsWith("." + websiteHost)) return apiError(400, "The source link must be on your organization's website.");
    const deadline = raw.deadline ? new Date(String(raw.deadline) + "T23:59:59Z") : null;
    if (deadline && (Number.isNaN(deadline.getTime()) || deadline.getTime() < Date.now())) return apiError(400, "Deadline must be a future date.");
    const topicSlugs = Array.isArray(raw.topicSlugs) ? raw.topicSlugs.filter((value): value is string => typeof value === "string").slice(0, 20) : [];
    const methodSlugs = Array.isArray(raw.methodSlugs) ? raw.methodSlugs.filter((value): value is string => typeof value === "string").slice(0, 20) : [];
    const db = getDb();
    const duplicate = await db.opportunity.findFirst({ where: { organizationId: organization.id, title, sourceUrl, status: "ACTIVE" }, select: { id: true } });
    if (duplicate) return apiError(409, "This active opportunity is already published.");
    const [topics, methods] = await Promise.all([
      db.researchTopic.findMany({ where: { slug: { in: topicSlugs } }, select: { id: true } }),
      db.researchMethod.findMany({ where: { slug: { in: methodSlugs } }, select: { id: true } }),
    ]);
    const recordId = randomUUID();
    const now = new Date();
    const opportunity = await db.opportunity.create({
      data: {
        organizationId: organization.id,
        type, status: "ACTIVE", title, description,
        countryCode: organization.countryCode,
        city: typeof raw.city === "string" ? raw.city.trim().slice(0, 120) || null : null,
        sourceType: "MANUAL", sourceName: organization.name,
        sourceRecordId: recordId, sourceKey: `self:${organization.id}:${recordId}`,
        sourceUrl, applicationUrl, deadline,
        deadlinePrecision: deadline ? "DATE_ONLY" : "UNKNOWN",
        firstSeenAt: now, lastSeenAt: now, publishedAt: now,
        topics: { create: topics.map((topic) => ({ topicId: topic.id })) },
        methods: { create: methods.map((method) => ({ methodId: method.id })) },
        provenance: { create: {
          sourceType: "MANUAL", sourceName: organization.name, sourceRecordId: recordId, sourceUrl,
          contentFingerprint: createHash("sha256").update(JSON.stringify({ title, description, sourceUrl, deadline })).digest("hex"),
          status: "ASSERTED", observedAt: now, publishedAt: now,
          metadata: { submittedByOrganizationOwner: true, organizationVerified: organization.verified },
        } },
      },
      select: { id: true, title: true, status: true },
    });
    return NextResponse.json({ success: true, data: opportunity }, { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) return apiError(401, error.message);
    if (error instanceof SyntaxError || error instanceof TypeError) return apiError(400, "Invalid opportunity details.");
    if (error instanceof Error && /required|must be|HTTPS|Deadline/.test(error.message)) return apiError(400, error.message);
    console.error("Institutional opportunity creation failed", error);
    return apiError(500, "Opportunity could not be published.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "organization:opportunities:update", { windowSeconds: 3600, max: 60 });
    const user = await requireCurrentUser();
    const organization = await ownedOrganization(user.id);
    if (!organization) return apiError(403, "An institutional account is required.");
    const raw = await request.json() as Record<string, unknown>;
    if (typeof raw.id !== "string" || (raw.status !== "ACTIVE" && raw.status !== "CLOSED")) return apiError(400, "Choose an opportunity and a valid status.");
    const db = getDb();
    const result = await db.opportunity.updateMany({ where: { id: raw.id, organizationId: organization.id, sourceType: "MANUAL" }, data: { status: raw.status, lastSeenAt: new Date() } });
    if (!result.count) return apiError(404, "Opportunity not found.");
    return NextResponse.json({ success: true, data: { id: raw.id, status: raw.status } });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) return apiError(401, error.message);
    return apiError(500, "Opportunity status could not be updated.");
  }
}
