import { getDb } from "@studepartment/db";
import type { ResearcherViewerRelation } from "@/lib/api-contracts";

/**
 * Maps researcher profile ids to the signed-in viewer's relationship with each one,
 * so Discovery can offer "Open private conversation" instead of a duplicate introduction.
 */
export async function loadViewerRelations(userId: string, researcherIds: string[]) {
  const relations = new Map<string, ResearcherViewerRelation>();
  if (!researcherIds.length) return relations;
  const db = getDb();
  const me = await db.researcherProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!me) return relations;
  if (researcherIds.includes(me.id)) relations.set(me.id, { kind: "self" });

  const requests = await db.connectionRequest.findMany({
    where: {
      status: { in: ["ACCEPTED", "PENDING"] },
      OR: [
        { senderId: me.id, receiverId: { in: researcherIds } },
        { receiverId: me.id, senderId: { in: researcherIds } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, senderId: true, receiverId: true, status: true },
  });

  for (const request of requests) {
    const other = request.senderId === me.id ? request.receiverId : request.senderId;
    const current = relations.get(other);
    if (request.status === "ACCEPTED" && current?.kind !== "connected") {
      relations.set(other, { kind: "connected", conversationId: request.id });
    } else if (request.status === "PENDING" && !current) {
      relations.set(other, { kind: "pending", direction: request.senderId === me.id ? "sent" : "received" });
    }
  }
  return relations;
}
