import { getDb } from "@studepartment/db";
import { getCurrentUser } from "@/server/auth/current-user";

function formatGoal(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getPublicResearcherProfile(researcherId: string) {
  const db = getDb();
  const currentUser = await getCurrentUser();
  const profile = await db.researcherProfile.findUnique({
    where: { id: researcherId },
    include: {
      affiliations: {
        where: { current: true },
        include: { organization: true },
        orderBy: { startDate: "desc" },
        take: 1,
      },
      topics: {
        orderBy: { weight: "desc" },
        include: { topic: true },
        take: 12,
      },
      methods: {
        include: { method: true },
        take: 12,
      },
      publications: {
        where: { active: true },
        orderBy: { publication: { publicationDate: "desc" } },
        take: 6,
        include: { publication: true },
      },
      evidence: {
        where: { status: "VERIFIED" },
        select: { sourceType: true, fieldPath: true },
      },
    },
  });

  if (!profile) return null;
  const isOwner = Boolean(currentUser && profile.userId === currentUser.id);
  if (!profile.profilePublic && !isOwner) return null;

  const affiliation = profile.affiliations[0];
  const orcidVerified = profile.evidence.some(
    (record) => record.sourceType === "ORCID" && record.fieldPath === "orcid",
  );
  const publicationVerified = profile.publications.some(
    (relation) => relation.evidenceLevel === "PUBMED_CORROBORATED",
  );

  return {
    id: profile.id,
    fullName: profile.fullName,
    headline: profile.headline ?? profile.careerStage ?? "Medical researcher",
    bio: profile.bio,
    institution: affiliation?.organization.name ?? "Independent researcher",
    institutionVerified: Boolean(affiliation?.organization.verified),
    location: [profile.city, profile.countryCode].filter(Boolean).join(" · ") || "Location not shared",
    careerStage: profile.careerStage ?? "Researcher",
    verified: profile.verified,
    availability: profile.availabilityMode.toLowerCase(),
    collaborationGoals: profile.collaborationGoals.map(formatGoal),
    topics: profile.topics.map(({ topic }) => topic.name),
    methods: profile.methods.map(({ method }) => method.name),
    trustSignals: [
      { label: "Scientific identity", verified: profile.verified },
      { label: "Institution", verified: Boolean(affiliation?.organization.verified) },
      { label: "ORCID", verified: orcidVerified },
      { label: "Publications", verified: publicationVerified },
    ],
    publications: profile.publications.map((relation) => ({
      id: relation.publication.id,
      title: relation.publication.title,
      journal: relation.publication.journal,
      year: relation.publication.publicationDate?.getUTCFullYear(),
      pmid: relation.publication.pmid,
      doi: relation.publication.doi,
      sourceUrl: relation.publication.sourceUrl,
      evidenceLevel: relation.evidenceLevel,
    })),
    ownerView: isOwner,
  };
}
