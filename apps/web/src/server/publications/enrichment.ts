import { createHash } from "node:crypto";
import { getDb, type Prisma } from "@studepartment/db";
import type {
  PublicationEvidenceLevelValue,
  PublicationListResponse,
  PublicationRecord,
  PublicationSyncResult,
} from "@/lib/api-contracts";
import { requireCurrentUser } from "@/server/auth/current-user";
import { fetchPublicOrcidWorks, type OrcidWorkSummary } from "@/server/integrations/orcid/client";
import {
  fetchPubMedSummaries,
  getPubMedConfig,
  PubMedConfigurationError,
  searchPubMedPmidsByDois,
  type PubMedSummary,
} from "@/server/integrations/pubmed/client";

export class PublicationEnrichmentError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "PublicationEnrichmentError";
  }
}

const evidenceLevelFromDb = {
  MANUAL_ASSERTED: "manual-asserted",
  ORCID_ASSERTED: "orcid-asserted",
  PUBMED_CORROBORATED: "pubmed-corroborated",
} as const satisfies Record<string, PublicationEvidenceLevelValue>;

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function normalizeDoi(value?: string) {
  return value?.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").toLowerCase() || undefined;
}

function parseDate(value?: string) {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  const year = parts[0];
  if (!year) return null;
  const month = parts[1] || 1;
  const day = parts[2] || 1;
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function canonicalKey(orcid: string, work: OrcidWorkSummary, pubmed?: PubMedSummary) {
  const pmid = pubmed?.pmid ?? work.pmid;
  const doi = normalizeDoi(pubmed?.doi ?? work.doi);
  if (pmid) return `pmid:${pmid}`;
  if (doi) return `doi:${doi}`;
  return `orcid:${orcid}:${work.putCode}`;
}

function orcidWorkUrl(orcid: string, work: OrcidWorkSummary) {
  return work.url ?? `https://orcid.org/${orcid}`;
}

async function ownedVerifiedOrcidProfile(requireVerification = true) {
  const user = await requireCurrentUser();
  const profile = await getDb().researcherProfile.findUnique({
    where: { userId: user.id },
    include: {
      evidence: {
        where: { fieldPath: "orcid", sourceType: "ORCID", status: "VERIFIED" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!profile) {
    throw new PublicationEnrichmentError("PROFILE_NOT_FOUND", "Complete your Scientific Identity before syncing publications.");
  }
  if (!profile.orcid || (requireVerification && !profile.evidence.length)) {
    throw new PublicationEnrichmentError(
      "VERIFIED_ORCID_REQUIRED",
      "Verify ownership of your ORCID iD before importing publications.",
    );
  }
  return profile;
}

async function findExistingPublication(
  tx: Prisma.TransactionClient,
  key: string,
  pmid?: string,
  doi?: string,
) {
  return tx.publication.findFirst({
    where: {
      OR: [
        { canonicalKey: key },
        ...(pmid ? [{ pmid }] : []),
        ...(doi ? [{ doi }] : []),
      ],
    },
  });
}

function publicationData(work: OrcidWorkSummary, pubmed: PubMedSummary | undefined, observedAt: Date) {
  const doi = normalizeDoi(pubmed?.doi ?? work.doi);
  const pmid = pubmed?.pmid ?? work.pmid;
  const pmcid = pubmed?.pmcid ?? work.pmcid;
  return {
    title: pubmed?.title ?? work.title,
    doi: doi ?? null,
    pmid: pmid ?? null,
    pmcid: pmcid ?? null,
    journal: pubmed?.journal ?? work.journal ?? null,
    publicationDate: parseDate(pubmed?.publicationDate ?? work.publicationDate),
    publicationType: pubmed?.publicationType ?? work.type ?? null,
    volume: pubmed?.volume ?? null,
    issue: pubmed?.issue ?? null,
    pages: pubmed?.pages ?? null,
    sourceUrl: pubmed?.sourceUrl ?? work.url ?? null,
    authorNames: pubmed?.authorNames ?? [],
    lastVerifiedAt: pubmed ? observedAt : null,
  };
}

export async function syncOwnedPublications(importedWorks?: OrcidWorkSummary[], allowAssertedProfile = false, expectedOrcid?: string): Promise<PublicationSyncResult> {
  const profile = await ownedVerifiedOrcidProfile(!allowAssertedProfile);
  if (expectedOrcid && profile.orcid !== expectedOrcid) throw new PublicationEnrichmentError("ORCID_CHANGED", "Your ORCID iD changed during import. Please retry.");
  const observedAt = new Date();
  const works = importedWorks ?? await fetchPublicOrcidWorks(profile.orcid!);
  const warnings: string[] = [];

  const directPmids = works.map((work) => work.pmid).filter((value): value is string => Boolean(value));
  const doisNeedingLookup = works
    .filter((work) => !work.pmid && work.doi)
    .map((work) => work.doi!)
    .slice(0, 50);

  let pubmedSummaries: PubMedSummary[] = [];
  try {
    const config = getPubMedConfig();
    const searchedPmids = await searchPubMedPmidsByDois(doisNeedingLookup, config);
    pubmedSummaries = await fetchPubMedSummaries([...directPmids, ...searchedPmids], config);
  } catch (error) {
    if (error instanceof PubMedConfigurationError) {
      warnings.push("PubMed enrichment skipped because NCBI_EUTILS_EMAIL is not configured.");
    } else {
      warnings.push("PubMed enrichment was unavailable; ORCID works were still synchronized.");
      console.error("PubMed enrichment failed during publication sync", error);
    }
  }

  const pubmedByPmid = new Map(pubmedSummaries.map((summary) => [summary.pmid, summary]));
  const pubmedByDoi = new Map(
    pubmedSummaries
      .filter((summary) => summary.doi)
      .map((summary) => [normalizeDoi(summary.doi)!, summary]),
  );

  const db = getDb();
  let publicationsCreated = 0;
  let publicationsUpdated = 0;
  let relationshipsCreated = 0;
  let pubmedCorroborated = 0;
  let orcidOnly = 0;
  const activePublicationIds: string[] = [];
  const seenPutCodes: string[] = [];

  for (const work of works) {
    seenPutCodes.push(work.putCode);
    const normalizedWorkDoi = normalizeDoi(work.doi);
    const pubmed = (work.pmid ? pubmedByPmid.get(work.pmid) : undefined)
      ?? (normalizedWorkDoi ? pubmedByDoi.get(normalizedWorkDoi) : undefined);
    const evidenceLevel = pubmed ? "PUBMED_CORROBORATED" : "ORCID_ASSERTED";
    if (pubmed) pubmedCorroborated += 1;
    else orcidOnly += 1;

    await db.$transaction(async (tx) => {
      const key = canonicalKey(profile.orcid!, work, pubmed);
      const data = publicationData(work, pubmed, observedAt);
      const existing = await findExistingPublication(tx, key, data.pmid ?? undefined, data.doi ?? undefined);
      const updateData = !pubmed && existing
        ? {
            ...data,
            publicationType: existing.publicationType,
            volume: existing.volume,
            issue: existing.issue,
            pages: existing.pages,
            sourceUrl: existing.sourceUrl ?? data.sourceUrl,
            authorNames: existing.authorNames.length ? existing.authorNames : data.authorNames,
            lastVerifiedAt: existing.lastVerifiedAt,
          }
        : data;

      const publication = existing
        ? await tx.publication.update({
            where: { id: existing.id },
            data: { canonicalKey: key, ...updateData },
          })
        : await tx.publication.create({
            data: { canonicalKey: key, ...data },
          });

      if (existing) publicationsUpdated += 1;
      else publicationsCreated += 1;
      activePublicationIds.push(publication.id);

      const existingRelation = await tx.researcherPublication.findUnique({
        where: {
          researcherId_publicationId: {
            researcherId: profile.id,
            publicationId: publication.id,
          },
        },
      });
      await tx.researcherPublication.upsert({
        where: {
          researcherId_publicationId: {
            researcherId: profile.id,
            publicationId: publication.id,
          },
        },
        create: {
          researcherId: profile.id,
          publicationId: publication.id,
          sourceType: "ORCID",
          evidenceLevel,
          lastObservedAt: observedAt,
          active: true,
        },
        update: {
          sourceType: "ORCID",
          evidenceLevel,
          lastObservedAt: observedAt,
          active: true,
        },
      });
      if (!existingRelation) relationshipsCreated += 1;

      const orcidFingerprint = hash(work);
      const orcidEvidenceKey = hash({
        source: "ORCID",
        researcherId: profile.id,
        putCode: work.putCode,
        fingerprint: orcidFingerprint,
      });
      await tx.publicationProvenance.upsert({
        where: { evidenceKey: orcidEvidenceKey },
        create: {
          evidenceKey: orcidEvidenceKey,
          publicationId: publication.id,
          researcherId: profile.id,
          sourceType: "ORCID",
          sourceRecordId: work.putCode,
          sourceUrl: orcidWorkUrl(profile.orcid!, work),
          contentFingerprint: orcidFingerprint,
          status: "ASSERTED",
          observedAt,
          metadata: {
            orcid: profile.orcid,
            sourceName: work.sourceName ?? null,
            externalIds: { doi: work.doi ?? null, pmid: work.pmid ?? null, pmcid: work.pmcid ?? null },
          } as Prisma.InputJsonValue,
        },
        update: { observedAt },
      });

      if (pubmed) {
        const pubmedFingerprint = hash(pubmed);
        const pubmedEvidenceKey = hash({
          source: "PUBMED",
          researcherId: profile.id,
          pmid: pubmed.pmid,
          fingerprint: pubmedFingerprint,
        });
        await tx.publicationProvenance.upsert({
          where: { evidenceKey: pubmedEvidenceKey },
          create: {
            evidenceKey: pubmedEvidenceKey,
            publicationId: publication.id,
            researcherId: profile.id,
            sourceType: "PUBMED",
            sourceRecordId: pubmed.pmid,
            sourceUrl: pubmed.sourceUrl,
            contentFingerprint: pubmedFingerprint,
            status: "VERIFIED",
            observedAt,
            verifiedAt: observedAt,
            metadata: {
              matchedFromOrcidPutCode: work.putCode,
              matchedBy: work.pmid && work.pmid === pubmed.pmid ? "pmid" : "doi",
            } as Prisma.InputJsonValue,
          },
          update: { observedAt, verifiedAt: observedAt, status: "VERIFIED" },
        });
      }
    });
  }

  // A capped response is incomplete: do not retire works beyond the import window.
  const staleResult = works.length >= 100 ? { count: 0 } : await db.researcherPublication.updateMany({
    where: {
      researcherId: profile.id,
      sourceType: "ORCID",
      active: true,
      ...(activePublicationIds.length ? { publicationId: { notIn: activePublicationIds } } : {}),
    },
    data: { active: false },
  });

  if (works.length < 100) await db.publicationProvenance.updateMany({
    where: {
      researcherId: profile.id,
      sourceType: "ORCID",
      status: { in: ["ASSERTED", "VERIFIED"] },
      ...(seenPutCodes.length ? { sourceRecordId: { notIn: seenPutCodes } } : {}),
    },
    data: { status: "STALE" },
  });

  return {
    orcid: profile.orcid!,
    observedAt: observedAt.toISOString(),
    orcidWorksSeen: works.length,
    publicationsCreated,
    publicationsUpdated,
    relationshipsCreated,
    pubmedCorroborated,
    orcidOnly,
    staleRelationships: staleResult.count,
    warnings,
  };
}

export async function listOwnedPublications(): Promise<PublicationListResponse> {
  const user = await requireCurrentUser();
  const db = getDb();
  const profile = await db.researcherProfile.findUnique({
    where: { userId: user.id },
    include: {
      evidence: {
        where: { fieldPath: "orcid", sourceType: "ORCID", status: "VERIFIED" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!profile) throw new PublicationEnrichmentError("PROFILE_NOT_FOUND", "Scientific profile not found.");

  const relations = await db.researcherPublication.findMany({
    where: { researcherId: profile.id, active: true },
    orderBy: { publication: { publicationDate: "desc" } },
    include: {
      publication: {
        include: {
          provenance: {
            where: { researcherId: profile.id, status: { in: ["ASSERTED", "VERIFIED"] } },
            select: { sourceType: true },
          },
        },
      },
    },
  });

  const publications: PublicationRecord[] = relations.map((relation) => {
    const publication = relation.publication;
    const sources = new Set<"ORCID" | "PubMed" | "Manual">();
    for (const evidence of publication.provenance) {
      if (evidence.sourceType === "ORCID") sources.add("ORCID");
      if (evidence.sourceType === "PUBMED") sources.add("PubMed");
      if (evidence.sourceType === "MANUAL") sources.add("Manual");
    }
    return {
      id: publication.id,
      title: publication.title,
      journal: publication.journal ?? undefined,
      publicationDate: publication.publicationDate?.toISOString(),
      publicationType: publication.publicationType ?? undefined,
      doi: publication.doi ?? undefined,
      pmid: publication.pmid ?? undefined,
      pmcid: publication.pmcid ?? undefined,
      sourceUrl: publication.sourceUrl ?? undefined,
      authorNames: publication.authorNames,
      evidenceLevel: evidenceLevelFromDb[relation.evidenceLevel],
      evidenceSources: Array.from(sources),
      lastObservedAt: relation.lastObservedAt.toISOString(),
    };
  });

  return {
    publications,
    total: publications.length,
    orcid: profile.orcid ?? undefined,
    orcidVerified: Boolean(profile.orcid && profile.evidence.length),
  };
}
