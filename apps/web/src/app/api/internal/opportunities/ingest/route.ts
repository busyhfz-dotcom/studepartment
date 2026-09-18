import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess } from "@/lib/api-contracts";
import {
  ingestOpportunityBatch,
  type OpportunityIngestionBatch,
  type OpportunityIngestionRecord,
  type OpportunityIngestionSource,
} from "@/server/opportunities/ingestion";

const sourceTypes = new Set<OpportunityIngestionSource["type"]>([
  "INSTITUTIONAL_CAREERS",
  "FUNDER",
  "LAB_WEBSITE",
  "RESEARCH_NETWORK",
  "MANUAL",
  "IMPORT",
]);

const opportunityTypes = new Set<OpportunityIngestionRecord["type"]>([
  "PHD",
  "POSTDOC",
  "FELLOWSHIP",
  "GRANT",
  "COLLABORATION",
  "RESEARCH_ASSISTANTSHIP",
]);

const organizationTypes = new Set<OpportunityIngestionRecord["organization"]["type"]>([
  "UNIVERSITY",
  "HOSPITAL",
  "RESEARCH_INSTITUTE",
  "COMPANY",
  "FOUNDATION",
]);

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(0, 32);
}

function parseRecord(value: unknown): OpportunityIngestionRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const organization = record.organization as Record<string, unknown> | undefined;

  if (
    typeof record.sourceRecordId !== "string" ||
    typeof record.sourceUrl !== "string" ||
    typeof record.type !== "string" ||
    !opportunityTypes.has(record.type as OpportunityIngestionRecord["type"]) ||
    typeof record.title !== "string" ||
    !organization ||
    typeof organization.name !== "string" ||
    typeof organization.type !== "string" ||
    !organizationTypes.has(organization.type as OpportunityIngestionRecord["organization"]["type"])
  ) return null;

  try {
    new URL(record.sourceUrl);
    if (typeof record.applicationUrl === "string") new URL(record.applicationUrl);
  } catch {
    return null;
  }

  return {
    sourceRecordId: record.sourceRecordId.slice(0, 240),
    sourceUrl: record.sourceUrl,
    applicationUrl: typeof record.applicationUrl === "string" ? record.applicationUrl : null,
    type: record.type as OpportunityIngestionRecord["type"],
    title: record.title.slice(0, 500),
    description: typeof record.description === "string" ? record.description.slice(0, 20_000) : null,
    organization: {
      name: organization.name.slice(0, 300),
      type: organization.type as OpportunityIngestionRecord["organization"]["type"],
      countryCode: typeof organization.countryCode === "string" ? organization.countryCode.slice(0, 2) : null,
      website: typeof organization.website === "string" ? organization.website : null,
    },
    city: typeof record.city === "string" ? record.city.slice(0, 180) : null,
    countryCode: typeof record.countryCode === "string" ? record.countryCode.slice(0, 2) : null,
    deadline: typeof record.deadline === "string" ? record.deadline.slice(0, 120) : null,
    deadlineTimezone: typeof record.deadlineTimezone === "string" ? record.deadlineTimezone.slice(0, 100) : null,
    publishedAt: typeof record.publishedAt === "string" ? record.publishedAt : null,
    topicSlugs: asStringArray(record.topicSlugs),
    methodSlugs: asStringArray(record.methodSlugs),
    eligibleCareerStages: asStringArray(record.eligibleCareerStages),
    eligibleCountryCodes: asStringArray(record.eligibleCountryCodes),
    status: record.status === "CLOSED" ? "CLOSED" : "ACTIVE",
    metadata: record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)
      ? record.metadata as Record<string, unknown>
      : undefined,
  };
}

function unauthorized(message = "Unauthorized.") {
  const body: ApiError = { success: false, error: { code: "UNAUTHORIZED", message } };
  return NextResponse.json(body, { status: 401 });
}

export async function POST(request: NextRequest) {
  const configuredToken = process.env.OPPORTUNITY_INGEST_TOKEN;
  if (!configuredToken) {
    const body: ApiError = {
      success: false,
      error: { code: "INGESTION_NOT_CONFIGURED", message: "Opportunity ingestion is not configured." },
    };
    return NextResponse.json(body, { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return unauthorized();
  if (!secureEqual(authorization.slice(7), configuredToken)) return unauthorized();

  try {
    const raw = await request.json() as Record<string, unknown>;
    const rawSource = raw.source as Record<string, unknown> | undefined;
    if (
      !rawSource ||
      typeof rawSource.type !== "string" ||
      !sourceTypes.has(rawSource.type as OpportunityIngestionSource["type"]) ||
      typeof rawSource.name !== "string" ||
      !Array.isArray(raw.records) ||
      raw.records.length > 100 ||
      (raw.completeSnapshot === true && raw.records.length === 0)
    ) {
      const body: ApiError = {
        success: false,
        error: { code: "INVALID_INGESTION_PAYLOAD", message: "Invalid opportunity ingestion payload." },
      };
      return NextResponse.json(body, { status: 400 });
    }

    const records = raw.records.map(parseRecord);
    if (records.some((record) => !record)) {
      const body: ApiError = {
        success: false,
        error: { code: "INVALID_OPPORTUNITY_RECORD", message: "One or more opportunity records are invalid." },
      };
      return NextResponse.json(body, { status: 400 });
    }

    const batch: OpportunityIngestionBatch = {
      source: {
        type: rawSource.type as OpportunityIngestionSource["type"],
        name: rawSource.name.slice(0, 240),
        verified: rawSource.verified === true,
      },
      completeSnapshot: raw.completeSnapshot === true,
      records: records as OpportunityIngestionRecord[],
    };

    const data = await ingestOpportunityBatch(batch);
    const body: ApiSuccess<typeof data> = { success: true, data };
    return NextResponse.json(body);
  } catch (error) {
    console.error("Opportunity ingestion failed", error);
    const body: ApiError = {
      success: false,
      error: { code: "OPPORTUNITY_INGESTION_FAILED", message: "Opportunity ingestion failed." },
    };
    return NextResponse.json(body, { status: 500 });
  }
}
