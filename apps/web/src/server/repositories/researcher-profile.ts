import { db } from "@studepartment/db";

export async function getResearcherProfileByUserId(userId: string) {
  return db.researcherProfile.findUnique({
    where: { userId },
    include: {
      affiliations: {
        where: { current: true },
        include: { organization: true },
        orderBy: { startDate: "desc" },
      },
      topics: {
        include: { topic: true },
        orderBy: { weight: "desc" },
      },
      methods: {
        include: { method: true },
      },
      publications: {
        include: { publication: true },
        orderBy: { publication: { publicationDate: "desc" } },
        take: 20,
      },
    },
  });
}

export async function updateResearcherAvailability(
  userId: string,
  availabilityMode: "OPEN" | "SELECTIVE" | "QUIET" | "CLOSED",
) {
  return db.researcherProfile.update({
    where: { userId },
    data: { availabilityMode },
    select: { id: true, availabilityMode: true, updatedAt: true },
  });
}
