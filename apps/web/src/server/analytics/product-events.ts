import { getDb } from "@studepartment/db";
import type { FeedbackEntityTypeValue } from "@/lib/api-contracts";

type ProductEventName =
  | "PROFILE_UPDATED"
  | "FEEDBACK_SUBMITTED"
  | "OPPORTUNITY_SAVED"
  | "INTRODUCTION_SENT"
  | "ASSISTANT_USED"
  | "DATA_EXPORTED";

const entityTypeMap = {
  researcher: "RESEARCHER",
  laboratory: "LABORATORY",
  institution: "INSTITUTION",
  opportunity: "OPPORTUNITY",
} as const;

export async function recordProductEvent(
  userId: string,
  eventType: ProductEventName,
  entity?: { type: FeedbackEntityTypeValue; id: string },
) {
  try {
    await getDb().productEvent.create({
      data: {
        userId,
        eventType,
        entityType: entity ? entityTypeMap[entity.type] : undefined,
        entityId: entity?.id,
      },
      select: { id: true },
    });
  } catch (error) {
    console.warn("Product event recording failed", { eventType, error });
  }
}
