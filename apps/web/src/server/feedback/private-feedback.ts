import { getDb } from "@studepartment/db";
import type {
  FeedbackEntityTypeValue,
  FeedbackInput,
  FeedbackListResponse,
  FeedbackRecord,
  FeedbackSignalValue,
} from "@/lib/api-contracts";
import { getCurrentUser } from "@/server/auth/current-user";
import { recordProductEvent } from "@/server/analytics/product-events";

export class FeedbackValidationError extends Error {
  readonly code = "INVALID_FEEDBACK";
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "FeedbackValidationError";
  }
}

const entityToDb = {
  researcher: "RESEARCHER",
  laboratory: "LABORATORY",
  institution: "INSTITUTION",
  opportunity: "OPPORTUNITY",
} as const;

const signalToDb = {
  relevant: "RELEVANT",
  "not-relevant": "NOT_RELEVANT",
  "already-know": "ALREADY_KNOW",
  "wrong-career-stage": "WRONG_CAREER_STAGE",
  "wrong-field": "WRONG_FIELD",
  "not-available": "NOT_AVAILABLE",
} as const;

const dbToEntity = {
  RESEARCHER: "researcher",
  LABORATORY: "laboratory",
  INSTITUTION: "institution",
  OPPORTUNITY: "opportunity",
} as const;

const dbToSignal = {
  RELEVANT: "relevant",
  NOT_RELEVANT: "not-relevant",
  ALREADY_KNOW: "already-know",
  WRONG_CAREER_STAGE: "wrong-career-stage",
  WRONG_FIELD: "wrong-field",
  NOT_AVAILABLE: "not-available",
} as const;

const suppressingSignals = [
  "NOT_RELEVANT",
  "ALREADY_KNOW",
  "WRONG_CAREER_STAGE",
  "WRONG_FIELD",
  "NOT_AVAILABLE",
] as const;

function parseEntityType(value: unknown): FeedbackEntityTypeValue {
  if (typeof value !== "string" || !(value in entityToDb)) {
    throw new FeedbackValidationError("Feedback entity type is invalid.");
  }
  return value as FeedbackEntityTypeValue;
}

function parseSignal(value: unknown): FeedbackSignalValue {
  if (typeof value !== "string" || !(value in signalToDb)) {
    throw new FeedbackValidationError("Feedback signal is invalid.");
  }
  return value as FeedbackSignalValue;
}

export function parseFeedbackInput(value: unknown): FeedbackInput {
  if (!value || typeof value !== "object") throw new FeedbackValidationError("Feedback body is required.");
  const record = value as Record<string, unknown>;
  const entityType = parseEntityType(record.entityType);
  const signal = parseSignal(record.signal);
  const entityId = typeof record.entityId === "string" ? record.entityId.trim() : "";
  if (!entityId || entityId.length > 128) throw new FeedbackValidationError("Feedback entity id is invalid.");
  return { entityType, entityId, signal };
}

async function assertEntityExists(input: FeedbackInput) {
  const db = getDb();
  if (input.entityType === "researcher") {
    const row = await db.researcherProfile.findFirst({
      where: { id: input.entityId, profilePublic: true },
      select: { id: true },
    });
    if (!row) throw new FeedbackValidationError("Researcher not found.", 404);
    return;
  }
  if (input.entityType === "laboratory") {
    const row = await db.laboratory.findUnique({ where: { id: input.entityId }, select: { id: true } });
    if (!row) throw new FeedbackValidationError("Laboratory not found.", 404);
    return;
  }
  if (input.entityType === "institution") {
    const row = await db.organization.findUnique({ where: { id: input.entityId }, select: { id: true } });
    if (!row) throw new FeedbackValidationError("Institution not found.", 404);
    return;
  }
  const row = await db.opportunity.findUnique({ where: { id: input.entityId }, select: { id: true } });
  if (!row) throw new FeedbackValidationError("Opportunity not found.", 404);
}

function recordToApi(row: {
  id: string;
  entityType: keyof typeof dbToEntity;
  entityId: string;
  signal: keyof typeof dbToSignal;
  createdAt: Date;
  updatedAt: Date;
}): FeedbackRecord {
  return {
    id: row.id,
    entityType: dbToEntity[row.entityType],
    entityId: row.entityId,
    signal: dbToSignal[row.signal],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function submitFeedback(userId: string, input: FeedbackInput): Promise<FeedbackRecord> {
  await assertEntityExists(input);
  const row = await getDb().discoveryFeedback.upsert({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType: entityToDb[input.entityType],
        entityId: input.entityId,
      },
    },
    create: {
      userId,
      entityType: entityToDb[input.entityType],
      entityId: input.entityId,
      signal: signalToDb[input.signal],
    },
    update: {
      signal: signalToDb[input.signal],
    },
  });
  await recordProductEvent(userId, "FEEDBACK_SUBMITTED", {
    type: input.entityType,
    id: input.entityId,
  });
  return recordToApi(row);
}

export async function listFeedback(userId: string): Promise<FeedbackListResponse> {
  const rows = await getDb().discoveryFeedback.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return { feedback: rows.map(recordToApi) };
}

export async function suppressPrivateFeedback<T>(
  entityType: FeedbackEntityTypeValue,
  items: T[],
  getId: (item: T) => string,
): Promise<T[]> {
  if (!items.length) return items;
  const user = await getCurrentUser();
  if (!user) return items;

  const ids = items.map(getId);
  const feedback = await getDb().discoveryFeedback.findMany({
    where: {
      userId: user.id,
      entityType: entityToDb[entityType],
      entityId: { in: ids },
      signal: { in: [...suppressingSignals] },
    },
    select: { entityId: true },
  });
  if (!feedback.length) return items;
  const suppressed = new Set(feedback.map((row) => row.entityId));
  return items.filter((item) => !suppressed.has(getId(item)));
}
