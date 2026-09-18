import { createHash } from "node:crypto";
import { getDb, type Prisma } from "@studepartment/db";

export type OpportunityIngestionSource = {
  type: "INSTITUTIONAL_CAREERS" | "FUNDER" | "LAB_WEBSITE" | "RESEARCH_NETWORK" | "MANUAL" | "IMPORT";
  name: string;
  verified: boolean;
};

export type OpportunityIngestionRecord = {
  sourceRecordId: string;
  sourceUrl: string;
  applicationUrl?: string | null;
  type: "PHD" | "POSTDOC" | "FELLOWSHIP" | "GRANT" | "COLLABORATION" | "RESEARCH_ASSISTANTSHIP";
  title: string;
  description?: string | null;
  organization: {
    name: string;
    type: "UNIVERSITY" | "HOSPITAL" | "RESEARCH_INSTITUTE" | "COMPANY" | "FOUNDATION";
    countryCode?: string | null;
    website?: string | null;
  };
  city?: string | null;
  countryCode?: string | null;
  deadline?: string | null;
  deadlineTimezone?: string | null;
  publishedAt?: string | null;
  topicSlugs?: string[];
  methodSlugs?: string[];
  eligibleCareerStages?: string[];
  eligibleCountryCodes?: string[];
  status?: "ACTIVE" | "CLOSED";
  metadata?: Record<string, unknown>;
};

export type OpportunityIngestionBatch = {
  source: OpportunityIngestionSource;
  completeSnapshot?: boolean;
  records: OpportunityIngestionRecord[];
};

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("en").normalize("NFKC").replace(/\s+/g, " ");
}

function normalizeSlug(value: string) {
  return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

function sourceKey(source: OpportunityIngestionSource, recordId: string) {
  return [source.type, normalizeSlug(source.name), recordId.trim()].join(":");
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDeadline(raw?: string | null) {
  const value = raw?.trim() ?? "";
  const lower = value.toLocaleLowerCase("en");

  if (!value) return { deadline: null as Date | null, raw: null as string | null, precision: "UNKNOWN" as const };
  if (/rolling|ongoing|open until filled|until filled/.test(lower)) {
    return { deadline: null, raw: value, precision: "ROLLING" as const };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { deadline: new Date(`${value}T23:59:59.999Z`), raw: value, precision: "DATE_ONLY" as const };
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return {
      deadline: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
      raw: value,
      precision: "MONTH_ONLY" as const,
    };
  }

  const parsed = parseDate(value);
  return parsed
    ? { deadline: parsed, raw: value, precision: "EXACT" as const }
    : { deadline: null, raw: value, precision: "UNKNOWN" as const };
}

function fingerprint(record: OpportunityIngestionRecord) {
  return createHash("sha256").update(JSON.stringify({
    sourceRecordId: record.sourceRecordId,
    sourceUrl: record.sourceUrl,
    applicationUrl: record.applicationUrl ?? null,
    type: record.type,
    title: record.title,
    description: record.description ?? null,
    organization: record.organization,
    city: record.city ?? null,
    countryCode: record.countryCode ?? null,
    deadline: record.deadline ?? null,
    deadlineTimezone: record.deadlineTimezone ?? null,
    publishedAt: record.publishedAt ?? null,
    topicSlugs: [...(record.topicSlugs ?? [])].sort(),
    methodSlugs: [...(record.methodSlugs ?? [])].sort(),
    eligibleCareerStages: [...(record.eligibleCareerStages ?? [])].sort(),
    eligibleCountryCodes: [...(record.eligibleCountryCodes ?? [])].sort(),
    status: record.status ?? "ACTIVE",
  })).digest("hex");
}

export async function ingestOpportunityBatch(batch: OpportunityIngestionBatch) {
  const db = getDb();
  const observedAt = new Date();
  const seenRecordIds = new Set<string>();
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const record of batch.records) {
    const recordId = record.sourceRecordId.trim();
    seenRecordIds.add(recordId);
    const key = sourceKey(batch.source, recordId);
    const contentFingerprint = fingerprint(record);
    const deadline = normalizeDeadline(record.deadline);
    const publishedAt = parseDate(record.publishedAt);
    const normalizedOrganizationName = normalizeText(record.organization.name);
    const countryCode = (record.countryCode ?? record.organization.countryCode ?? "").toUpperCase().slice(0, 2) || null;
    const eligibleCareerStages = Array.from(new Set((record.eligibleCareerStages ?? []).map(normalizeSlug).filter(Boolean))).slice(0, 16);
    const eligibleCountryCodes = Array.from(new Set((record.eligibleCountryCodes ?? []).map((value) => value.toUpperCase().slice(0, 2)).filter(Boolean))).slice(0, 32);

    await db.$transaction(async (tx) => {
      const organizationCountry = record.organization.countryCode?.toUpperCase().slice(0, 2) || null;
      let organization = await tx.organization.findFirst({
        where: {
          normalizedName: normalizedOrganizationName,
          ...(organizationCountry
            ? { OR: [{ countryCode: organizationCountry }, { countryCode: null }] }
            : {}),
        },
        orderBy: { verified: "desc" },
      });

      if (!organization) {
        organization = await tx.organization.create({
          data: {
            name: record.organization.name.trim(),
            normalizedName: normalizedOrganizationName,
            type: record.organization.type,
            countryCode: organizationCountry,
            website: record.organization.website ?? null,
          },
        });
      }

      const existing = await tx.opportunity.findUnique({
        where: { sourceKey: key },
        include: { provenance: { select: { contentFingerprint: true } } },
      });
      const changed = !existing?.provenance.some((item) => item.contentFingerprint === contentFingerprint);

      const derivedStatus = record.status === "CLOSED"
        ? "CLOSED"
        : deadline.deadline && deadline.deadline.getTime() < observedAt.getTime()
          ? "EXPIRED"
          : "ACTIVE";

      const opportunity = await tx.opportunity.upsert({
        where: { sourceKey: key },
        create: {
          organizationId: organization.id,
          type: record.type,
          status: derivedStatus,
          title: record.title.trim(),
          description: record.description?.trim() || null,
          city: record.city?.trim() || null,
          countryCode,
          applicationUrl: record.applicationUrl ?? null,
          deadline: deadline.deadline,
          deadlineRaw: deadline.raw,
          deadlinePrecision: deadline.precision,
          deadlineTimezone: record.deadlineTimezone?.trim() || null,
          sourceType: batch.source.type,
          sourceName: batch.source.name.trim(),
          sourceRecordId: recordId,
          sourceKey: key,
          sourceUrl: record.sourceUrl,
          publishedAt,
          lastVerifiedAt: batch.source.verified ? observedAt : null,
          eligibleCareerStages,
          eligibleCountryCodes,
        },
        update: {
          organizationId: organization.id,
          type: record.type,
          status: derivedStatus,
          title: record.title.trim(),
          description: record.description?.trim() || null,
          city: record.city?.trim() || null,
          countryCode,
          applicationUrl: record.applicationUrl ?? null,
          deadline: deadline.deadline,
          deadlineRaw: deadline.raw,
          deadlinePrecision: deadline.precision,
          deadlineTimezone: record.deadlineTimezone?.trim() || null,
          sourceUrl: record.sourceUrl,
          publishedAt,
          lastSeenAt: observedAt,
          lastVerifiedAt: batch.source.verified ? observedAt : undefined,
          eligibleCareerStages,
          eligibleCountryCodes,
        },
      });

      const topicSlugs = Array.from(new Set((record.topicSlugs ?? []).map(normalizeSlug).filter(Boolean)));
      const methodSlugs = Array.from(new Set((record.methodSlugs ?? []).map(normalizeSlug).filter(Boolean)));

      const [topics, methods] = await Promise.all([
        topicSlugs.length ? tx.researchTopic.findMany({ where: { slug: { in: topicSlugs } }, select: { id: true } }) : [],
        methodSlugs.length ? tx.researchMethod.findMany({ where: { slug: { in: methodSlugs } }, select: { id: true } }) : [],
      ]);

      await Promise.all([
        tx.opportunityTopic.deleteMany({ where: { opportunityId: opportunity.id } }),
        tx.opportunityMethod.deleteMany({ where: { opportunityId: opportunity.id } }),
      ]);
      if (topics.length) {
        await tx.opportunityTopic.createMany({
          data: topics.map((topic) => ({ opportunityId: opportunity.id, topicId: topic.id })),
          skipDuplicates: true,
        });
      }
      if (methods.length) {
        await tx.opportunityMethod.createMany({
          data: methods.map((method) => ({ opportunityId: opportunity.id, methodId: method.id })),
          skipDuplicates: true,
        });
      }

      await tx.opportunityProvenance.upsert({
        where: {
          opportunityId_contentFingerprint: {
            opportunityId: opportunity.id,
            contentFingerprint,
          },
        },
        create: {
          opportunityId: opportunity.id,
          sourceType: batch.source.type,
          sourceName: batch.source.name.trim(),
          sourceRecordId: recordId,
          sourceUrl: record.sourceUrl,
          contentFingerprint,
          status: batch.source.verified ? "VERIFIED" : "ASSERTED",
          observedAt,
          publishedAt,
          metadata: record.metadata ? record.metadata as Prisma.InputJsonValue : undefined,
        },
        update: {
          observedAt,
          sourceUrl: record.sourceUrl,
          status: batch.source.verified ? "VERIFIED" : "ASSERTED",
          metadata: record.metadata ? record.metadata as Prisma.InputJsonValue : undefined,
        },
      });

      if (!existing) created += 1;
      else if (changed) updated += 1;
      else unchanged += 1;
    });
  }

  let markedStale = 0;
  if (batch.completeSnapshot) {
    const result = await db.opportunity.updateMany({
      where: {
        sourceType: batch.source.type,
        sourceName: batch.source.name.trim(),
        sourceRecordId: { notIn: Array.from(seenRecordIds) },
        status: "ACTIVE",
      },
      data: { status: "STALE" },
    });
    markedStale = result.count;
  }

  return {
    observedAt: observedAt.toISOString(),
    received: batch.records.length,
    created,
    updated,
    unchanged,
    markedStale,
  };
}
