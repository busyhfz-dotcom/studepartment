import { getDb } from "@studepartment/db";
import type { AccountActivitySummary } from "@/lib/api-contracts";
import { recordProductEvent } from "@/server/analytics/product-events";
import { lockFileOwner } from "@/server/files/repository";

export class AccountPrivacyError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) {
    super(message);
    this.name = "AccountPrivacyError";
  }
}

export async function exportAccountData(userId: string) {
  await recordProductEvent(userId, "DATA_EXPORTED");
  const data = await getDb().user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      sessions: {
        select: {
          id: true,
          expiresAt: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      accounts: {
        select: {
          id: true,
          providerId: true,
          accountId: true,
          scope: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      savedOpportunities: {
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              sourceUrl: true,
              deadline: true,
              deadlinePrecision: true,
              organization: { select: { id: true, name: true } },
            },
          },
        },
      },
      storedFiles: {
        select: { id: true, name: true, mediaType: true, size: true, category: true, scope: true, contextId: true, public: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      discoveryFeedback: true,
      productEvents: {
        orderBy: { occurredAt: "asc" },
      },
      researcher: {
        include: {
          affiliations: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  countryCode: true,
                  website: true,
                  verified: true,
                },
              },
            },
          },
          topics: {
            include: {
              topic: { select: { id: true, name: true, slug: true, meshId: true } },
            },
          },
          methods: {
            include: {
              method: { select: { id: true, name: true, slug: true } },
            },
          },
          publications: {
            include: {
              publication: {
                select: {
                  id: true,
                  title: true,
                  doi: true,
                  pmid: true,
                  pmcid: true,
                  journal: true,
                  publicationDate: true,
                  sourceUrl: true,
                  lastVerifiedAt: true,
                },
              },
            },
          },
          labMemberships: {
            include: {
              laboratory: {
                select: {
                  id: true,
                  name: true,
                  website: true,
                  organization: { select: { id: true, name: true } },
                },
              },
            },
          },
          introductionPolicy: true,
          sentRequests: {
            include: {
              attachments: { include: { file: { select: { id: true, name: true, size: true } } } },
              receiver: { select: { id: true, fullName: true } },
              events: true,
            },
          },
          receivedRequests: {
            include: {
              attachments: { include: { file: { select: { id: true, name: true, size: true } } } },
              sender: { select: { id: true, fullName: true } },
              events: true,
            },
          },
          evidence: {
            select: {
              id: true,
              sourceType: true,
              sourceRecordId: true,
              sourceUrl: true,
              fieldPath: true,
              confidence: true,
              status: true,
              observedAt: true,
              verifiedAt: true,
              metadata: true,
            },
          },
          publicationEvidence: {
            select: {
              id: true,
              publicationId: true,
              sourceType: true,
              sourceRecordId: true,
              sourceUrl: true,
              status: true,
              observedAt: true,
              verifiedAt: true,
              metadata: true,
            },
          },
        },
      },
    },
  });

  if (!data) throw new AccountPrivacyError("ACCOUNT_NOT_FOUND", "Account not found.", 404);
  return {
    format: "studepartment-account-export-v1",
    exportedAt: new Date().toISOString(),
    data,
    excludedSecrets: [
      "session tokens",
      "password hashes",
      "OAuth access tokens",
      "OAuth refresh tokens",
      "OAuth ID tokens",
      "application secrets",
    ],
  };
}

export async function deleteAccount(userId: string) {
  const db = getDb();
  await db.$transaction(async (tx) => {
    await lockFileOwner(tx, userId);
    const files = await tx.storedFile.findMany({ where: { ownerId: userId }, select: { storageKey: true } });
    if (files.length) await tx.fileDeletion.createMany({ data: files, skipDuplicates: true });
    const profile = await tx.researcherProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (profile) {
      await tx.researcherProfile.delete({ where: { id: profile.id } });
    }
    const deleted = await tx.user.deleteMany({ where: { id: userId } });
    if (!deleted.count) throw new AccountPrivacyError("ACCOUNT_NOT_FOUND", "Account not found.", 404);
  });
}

export async function accountActivitySummary(userId: string): Promise<AccountActivitySummary> {
  const db = getDb();
  const [events, feedbackSubmitted] = await Promise.all([
    db.productEvent.groupBy({
      by: ["eventType"],
      where: { userId },
      _count: { _all: true },
    }),
    db.discoveryFeedback.count({ where: { userId } }),
  ]);

  const counts = new Map(events.map((row) => [row.eventType, row._count._all]));
  const earliest = await db.productEvent.findFirst({
    where: { userId },
    orderBy: { occurredAt: "asc" },
    select: { occurredAt: true },
  });

  return {
    feedbackSubmitted,
    opportunitiesSaved: counts.get("OPPORTUNITY_SAVED") ?? 0,
    introductionsSent: counts.get("INTRODUCTION_SENT") ?? 0,
    assistantQueries: counts.get("ASSISTANT_USED") ?? 0,
    profileUpdates: counts.get("PROFILE_UPDATED") ?? 0,
    since: earliest?.occurredAt.toISOString(),
  };
}
