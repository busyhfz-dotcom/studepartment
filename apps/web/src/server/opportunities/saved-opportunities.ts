import { getDb } from "@studepartment/db";
import type { SavedOpportunityListResponse, SavedOpportunityRecord, SaveOpportunityInput } from "@/lib/api-contracts";
import { requireCurrentUser } from "@/server/auth/current-user";

export class SavedOpportunityError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) {
    super(message);
    this.name = "SavedOpportunityError";
  }
}

function typeValue(value: string): SavedOpportunityRecord["opportunity"]["type"] {
  return value.toLowerCase().replaceAll("_", "-") as SavedOpportunityRecord["opportunity"]["type"];
}

function deadlinePrecision(value: string): SavedOpportunityRecord["opportunity"]["deadlinePrecision"] {
  return value.toLowerCase().replaceAll("_", "-") as SavedOpportunityRecord["opportunity"]["deadlinePrecision"];
}

function freshness(lastVerifiedAt: Date | null, lastSeenAt: Date) {
  const observed = lastVerifiedAt ?? lastSeenAt;
  const ageDays = Math.max(0, (Date.now() - observed.getTime()) / 86_400_000);
  if (ageDays <= 7) return "fresh" as const;
  if (ageDays <= 30) return "aging" as const;
  return "stale" as const;
}

function statusValue(value: string): SavedOpportunityRecord["opportunity"]["status"] {
  return value.toLowerCase() as SavedOpportunityRecord["opportunity"]["status"];
}

export async function saveOpportunity(input: SaveOpportunityInput) {
  const user = await requireCurrentUser();
  const db = getDb();
  const opportunityId = input.opportunityId?.trim();
  if (!opportunityId) throw new SavedOpportunityError("OPPORTUNITY_REQUIRED", "Opportunity id is required.");
  const alertLeadDays = input.alertLeadDays ?? 7;
  if (!Number.isInteger(alertLeadDays) || alertLeadDays < 1 || alertLeadDays > 90) {
    throw new SavedOpportunityError("INVALID_ALERT_WINDOW", "Deadline alert lead time must be between 1 and 90 days.");
  }
  const notes = input.notes?.trim() || null;
  if (notes && notes.length > 1000) {
    throw new SavedOpportunityError("NOTES_TOO_LONG", "Opportunity notes must be 1000 characters or fewer.");
  }

  const opportunity = await db.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } });
  if (!opportunity) throw new SavedOpportunityError("OPPORTUNITY_NOT_FOUND", "Opportunity not found.", 404);

  return db.savedOpportunity.upsert({
    where: { userId_opportunityId: { userId: user.id, opportunityId } },
    create: {
      userId: user.id,
      opportunityId,
      deadlineAlert: input.deadlineAlert ?? true,
      alertLeadDays,
      notes,
    },
    update: {
      deadlineAlert: input.deadlineAlert ?? true,
      alertLeadDays,
      notes,
    },
    select: { id: true, opportunityId: true, deadlineAlert: true, alertLeadDays: true, savedAt: true },
  });
}

export async function removeSavedOpportunity(opportunityId: string) {
  const user = await requireCurrentUser();
  const db = getDb();
  await db.savedOpportunity.deleteMany({ where: { userId: user.id, opportunityId } });
}

export async function listSavedOpportunities(): Promise<SavedOpportunityListResponse> {
  const user = await requireCurrentUser();
  const db = getDb();
  const rows = await db.savedOpportunity.findMany({
    where: { userId: user.id },
    orderBy: { savedAt: "desc" },
    include: {
      opportunity: { include: { organization: { select: { name: true } } } },
    },
  });

  const now = Date.now();
  const saved = rows.map((row): SavedOpportunityRecord => {
    const opportunity = row.opportunity;
    return {
      id: row.id,
      opportunityId: opportunity.id,
      deadlineAlert: row.deadlineAlert,
      alertLeadDays: row.alertLeadDays,
      notes: row.notes ?? undefined,
      savedAt: row.savedAt.toISOString(),
      opportunity: {
        title: opportunity.title,
        type: typeValue(opportunity.type),
        organization: opportunity.organization.name,
        sourceUrl: opportunity.sourceUrl,
        applicationUrl: opportunity.applicationUrl ?? undefined,
        deadline: opportunity.deadline?.toISOString(),
        deadlinePrecision: deadlinePrecision(opportunity.deadlinePrecision),
        freshness: freshness(opportunity.lastVerifiedAt, opportunity.lastSeenAt),
        status: statusValue(opportunity.status),
      },
    };
  });

  const dueSoon = saved.filter((item) => {
    if (!item.deadlineAlert || !item.opportunity.deadline) return false;
    const remaining = new Date(item.opportunity.deadline).getTime() - now;
    return remaining >= 0 && remaining <= item.alertLeadDays * 86_400_000;
  }).length;

  return { saved, total: saved.length, dueSoon };
}
