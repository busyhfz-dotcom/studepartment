import { createHash } from "node:crypto";
import { getDb } from "@studepartment/db";

export class OrcidVerificationRepositoryError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "OrcidVerificationRepositoryError";
  }
}

export async function verifyOrcidForUser(
  userId: string,
  input: { orcid: string; environment: "sandbox" | "production"; scope?: string },
) {
  const db = getDb();

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      throw new OrcidVerificationRepositoryError("USER_NOT_FOUND", "Authenticated user no longer exists.");
    }

    const profile = await tx.researcherProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        fullName: user.name.trim() || user.email.split("@")[0] || "Researcher",
        collaborationGoals: [],
      },
      select: { id: true },
    });

    const owner = await tx.researcherProfile.findUnique({
      where: { orcid: input.orcid },
      select: { id: true },
    });
    if (owner && owner.id !== profile.id) {
      throw new OrcidVerificationRepositoryError(
        "ORCID_ALREADY_CONNECTED",
        "This authenticated ORCID iD is already connected to another scientific identity.",
      );
    }

    await tx.evidenceRecord.updateMany({
      where: { researcherId: profile.id, fieldPath: "orcid", status: "VERIFIED" },
      data: { status: "STALE" },
    });

    await tx.researcherProfile.update({
      where: { id: profile.id },
      data: { orcid: input.orcid },
    });

    const profileHost = input.environment === "production" ? "https://orcid.org" : "https://sandbox.orcid.org";
    await tx.evidenceRecord.create({
      data: {
        researcherId: profile.id,
        actorUserId: userId,
        sourceType: "ORCID",
        sourceRecordId: input.orcid,
        sourceUrl: `${profileHost}/${input.orcid}`,
        fieldPath: "orcid",
        valueFingerprint: createHash("sha256").update(input.orcid).digest("hex"),
        confidence: 1,
        status: "VERIFIED",
        verifiedAt: new Date(),
        metadata: {
          environment: input.environment,
          oauthScope: input.scope ?? "/authenticate",
          tokenStored: false,
        },
      },
    });

    return { profileId: profile.id, orcid: input.orcid };
  });
}
