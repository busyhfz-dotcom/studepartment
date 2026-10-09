import { createHash } from "node:crypto";
import { getDb, type Prisma } from "@studepartment/db";
import type { IndividualProfileDetails } from "@/lib/api-contracts";
import { requireCurrentUser } from "@/server/auth/current-user";
import { syncOwnedPublications } from "@/server/publications/enrichment";
import { fetchOrcidRecord } from "./client";
import { assertValidOrcid } from "./orcid-id";
import { mergeOrcidDetails, parseOrcidProfile } from "./profile-data";

export async function importOwnedOrcidProfile(orcidValue: string, accessToken?: string) {
  const user = await requireCurrentUser();
  if (user.accountKind !== "INDIVIDUAL") throw new Error("ORCID imports require an individual researcher account.");
  const orcid = assertValidOrcid(orcidValue);
  const imported = parseOrcidProfile(await fetchOrcidRecord(orcid, accessToken), orcid);
  const db = getDb();
  const fields = await db.$transaction(async (tx) => {
    const current = await tx.researcherProfile.findUnique({ where: { userId: user.id }, include: { user: { select: { name: true } } } });
    if (!current || current.orcid !== orcid) throw new Error("Save this ORCID iD to your profile before importing its public information.");
    const details = current.profileDetails && typeof current.profileDetails === "object" && !Array.isArray(current.profileDetails) ? current.profileDetails as IndividualProfileDetails : {};
    const nextDetails = mergeOrcidDetails(details, imported);
    const protectedName = await tx.evidenceRecord.findFirst({ where: { researcherId: current.id, sourceType: "USER_ENTRY", fieldPath: "fullName" }, select: { id: true } });
    const changes = {
      ...(!protectedName && imported.fullName && (!current.fullName || current.fullName === current.user?.name || current.fullName === "Researcher") ? { fullName: imported.fullName } : {}),
      ...(!current.bio && imported.bio ? { bio: imported.bio } : {}),
      ...(!current.countryCode && imported.countryCode ? { countryCode: imported.countryCode } : {}),
      ...(JSON.stringify(details) !== JSON.stringify(nextDetails) ? { profileDetails: nextDetails as Prisma.InputJsonValue } : {}),
    };
    await tx.researcherProfile.update({ where: { id: current.id, orcid }, data: changes });
    for (const [fieldPath, value] of Object.entries(changes)) {
      await tx.evidenceRecord.create({ data: {
        researcherId: current.id, actorUserId: user.id, fieldPath, sourceType: "ORCID", sourceRecordId: orcid,
        sourceUrl: `https://orcid.org/${orcid}`, status: "ASSERTED",
        valueFingerprint: createHash("sha256").update(JSON.stringify(value)).digest("hex"),
        metadata: { origin: "orcid-profile-import", publicDataOnly: true },
      } });
    }
    return Object.keys(changes);
  });
  // Works remain ORCID assertions unless separately corroborated with PubMed.
  try {
    const publications = await syncOwnedPublications(imported.works, true, orcid);
    return { fields, publications, partial: false };
  } catch {
    return { fields, publications: null, partial: true };
  }
}
