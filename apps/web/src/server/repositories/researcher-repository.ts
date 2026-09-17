import { createHash } from "node:crypto";
import { getDb, type Prisma } from "@studepartment/db";
import type {
  CollaborationGoalValue,
  ProfileResponse,
  ProfileUpdateInput,
  ResearcherDiscoveryResult,
} from "@/lib/api-contracts";
import { currentResearcher, researcherPreviews } from "@/lib/scientific-data";
import { calculateProfileCompleteness } from "@/features/scientific-identity/completeness";

export type ResearcherRepository = {
  getProfileForUser(userId: string): Promise<ProfileResponse | null>;
  updateProfileForUser(userId: string, input: ProfileUpdateInput): Promise<ProfileResponse>;
  discoverResearchers(): Promise<ResearcherDiscoveryResult[]>;
};

export class ResearcherRepositoryError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ResearcherRepositoryError";
  }
}

const availabilityToDb = {
  open: "OPEN",
  selective: "SELECTIVE",
  quiet: "QUIET",
  closed: "CLOSED",
} as const;

const collaborationGoalToDb = {
  "research-collaboration": "RESEARCH_COLLABORATION",
  mentorship: "MENTORSHIP",
  "student-supervision": "STUDENT_SUPERVISION",
  "clinical-project": "CLINICAL_PROJECT",
  "grant-partnership": "GRANT_PARTNERSHIP",
  "position-opportunities": "POSITION_OPPORTUNITIES",
} as const;

function mapAlignment(level: "Strong" | "Good" | "Exploratory"): ResearcherDiscoveryResult["alignment"] {
  if (level === "Strong") return "strong";
  if (level === "Good") return "relevant";
  return "complementary";
}

function mapAvailability(value: "OPEN" | "SELECTIVE" | "QUIET" | "CLOSED"): ProfileResponse["availability"] {
  return value.toLowerCase() as ProfileResponse["availability"];
}

function formatCollaborationGoal(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const fixtureProfile: ProfileResponse = {
  id: "demo-researcher",
  fullName: currentResearcher.name,
  headline: `${currentResearcher.title} · Translational Oncology`,
  institution: currentResearcher.institution,
  organizationId: "org-oxford",
  careerStage: "Early-career researcher",
  availability: "selective",
  researchInterests: currentResearcher.topics,
  methods: currentResearcher.methods,
  collaborationGoals: currentResearcher.openTo,
  verification: [
    { label: "Institution", verified: currentResearcher.verification.includes("Institution") },
    { label: "ORCID", verified: currentResearcher.verification.includes("ORCID") },
    { label: "Publications", verified: currentResearcher.verification.includes("Publications") },
    { label: "Email", verified: false },
  ],
  bio: "Translational oncology researcher focused on immune-based therapies and clinically actionable evidence.",
  city: "Oxford",
  countryCode: "GB",
  location: "Oxford · GB",
  orcid: "0000-0002-1825-0097",
  profilePublic: true,
  topicSlugs: ["oncology", "cancer-immunotherapy", "biomarkers"],
  methodSlugs: ["translational-research", "biomarker-analysis"],
};
fixtureProfile.completeness = calculateProfileCompleteness(fixtureProfile);

const fixtureRepository: ResearcherRepository = {
  async getProfileForUser() {
    return fixtureProfile;
  },
  async updateProfileForUser(_userId, input) {
    const next: ProfileResponse = {
      ...fixtureProfile,
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.headline !== undefined ? { headline: input.headline ?? "Medical researcher" } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.countryCode !== undefined ? { countryCode: input.countryCode } : {}),
      ...(input.careerStage !== undefined ? { careerStage: input.careerStage ?? "Researcher" } : {}),
      ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
      ...(input.orcid !== undefined ? { orcid: input.orcid } : {}),
      ...(input.profilePublic !== undefined ? { profilePublic: input.profilePublic } : {}),
      ...(input.availability !== undefined ? { availability: input.availability } : {}),
      ...(input.collaborationGoals !== undefined
        ? { collaborationGoals: input.collaborationGoals.map((goal) => formatCollaborationGoal(collaborationGoalToDb[goal])) }
        : {}),
      ...(input.topicSlugs !== undefined ? { topicSlugs: input.topicSlugs } : {}),
      ...(input.methodSlugs !== undefined ? { methodSlugs: input.methodSlugs } : {}),
    };
    next.completeness = calculateProfileCompleteness(next);
    return next;
  },
  async discoverResearchers() {
    return researcherPreviews.map((researcher) => ({
      id: researcher.id,
      fullName: researcher.name,
      headline: researcher.title,
      institution: researcher.institution,
      alignment: mapAlignment(researcher.match.level),
      reasons: researcher.match.reasons,
      availability: researcher.openTo.length > 0 ? "open" : "selective",
      confidence: researcher.verified ? "high" : "medium",
    }));
  },
};

async function loadProfileByUserId(userId: string) {
  const db = getDb();
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
  if (!user) return null;

  await db.researcherProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      fullName: user.name.trim() || user.email.split("@")[0] || "Researcher",
      collaborationGoals: [],
    },
  });

  return db.researcherProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { emailVerified: true } },
      affiliations: {
        where: { current: true },
        include: { organization: true },
        orderBy: { startDate: "desc" },
        take: 1,
      },
      topics: { include: { topic: true }, orderBy: { weight: "desc" } },
      methods: { include: { method: true } },
      publications: { select: { publicationId: true }, take: 1 },
      evidence: { where: { status: "VERIFIED" }, select: { sourceType: true, fieldPath: true } },
    },
  });
}

type LoadedProfile = NonNullable<Awaited<ReturnType<typeof loadProfileByUserId>>>;

function mapLoadedProfile(profile: LoadedProfile): ProfileResponse {
  const affiliation = profile.affiliations[0];
  const orcidVerified = profile.evidence.some(
    (record) => record.fieldPath === "orcid" && record.sourceType === "ORCID",
  );

  const result: ProfileResponse = {
    id: profile.id,
    fullName: profile.fullName,
    headline: profile.headline ?? "Medical researcher",
    institution: affiliation?.organization.name ?? "Independent researcher",
    organizationId: affiliation?.organizationId ?? null,
    careerStage: profile.careerStage ?? "Researcher",
    availability: mapAvailability(profile.availabilityMode),
    researchInterests: profile.topics.map(({ topic }) => topic.name),
    methods: profile.methods.map(({ method }) => method.name),
    collaborationGoals: profile.collaborationGoals.map(formatCollaborationGoal),
    verification: [
      { label: "Institution", verified: Boolean(affiliation?.organization.verified) },
      { label: "ORCID", verified: orcidVerified },
      { label: "Publications", verified: profile.publications.length > 0 },
      { label: "Email", verified: Boolean(profile.user?.emailVerified) },
    ],
    bio: profile.bio,
    city: profile.city,
    countryCode: profile.countryCode,
    location: [profile.city, profile.countryCode].filter(Boolean).join(" · ") || "Location not shared",
    orcid: profile.orcid,
    profilePublic: profile.profilePublic,
    topicSlugs: profile.topics.map(({ topic }) => topic.slug),
    methodSlugs: profile.methods.map(({ method }) => method.slug),
  };
  result.completeness = calculateProfileCompleteness(result);
  return result;
}

async function replaceAffiliation(
  tx: Prisma.TransactionClient,
  researcherId: string,
  organizationId: string | null,
  title: string | null | undefined,
) {
  const current = await tx.researcherAffiliation.findFirst({
    where: { researcherId, current: true },
    orderBy: { startDate: "desc" },
  });
  if (current?.organizationId === organizationId) {
    if (current && title !== undefined) {
      await tx.researcherAffiliation.update({ where: { id: current.id }, data: { title } });
    }
    return;
  }
  await tx.researcherAffiliation.updateMany({
    where: { researcherId, current: true },
    data: { current: false, endDate: new Date() },
  });
  if (organizationId) {
    const organization = await tx.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
    if (!organization) throw new ResearcherRepositoryError("UNKNOWN_ORGANIZATION", "Selected organization does not exist.");
    await tx.researcherAffiliation.create({
      data: { researcherId, organizationId, title: title ?? undefined, current: true, startDate: new Date() },
    });
  }
}

const prismaRepository: ResearcherRepository = {
  async getProfileForUser(userId) {
    const profile = await loadProfileByUserId(userId);
    return profile ? mapLoadedProfile(profile) : null;
  },

  async updateProfileForUser(userId, input) {
    const db = getDb();
    const current = await loadProfileByUserId(userId);
    if (!current) throw new ResearcherRepositoryError("USER_NOT_FOUND", "Authenticated user no longer exists.");

    await db.$transaction(async (tx) => {
      if (input.orcid) {
        const existing = await tx.researcherProfile.findUnique({ where: { orcid: input.orcid }, select: { id: true } });
        if (existing && existing.id !== current.id) {
          throw new ResearcherRepositoryError("ORCID_ALREADY_CONNECTED", "That ORCID iD is already connected to another scientific identity.");
        }
      }

      if (input.organizationId !== undefined) {
        await replaceAffiliation(tx, current.id, input.organizationId, input.careerStage);
      }

      if (input.topicSlugs !== undefined) {
        const topics = await tx.researchTopic.findMany({ where: { slug: { in: input.topicSlugs } }, select: { id: true, slug: true } });
        const found = new Set(topics.map((topic) => topic.slug));
        const missing = input.topicSlugs.filter((slug) => !found.has(slug));
        if (missing.length) throw new ResearcherRepositoryError("UNKNOWN_RESEARCH_TOPIC", `Unknown research topic: ${missing.join(", ")}.`);
        await tx.researcherTopic.deleteMany({ where: { researcherId: current.id } });
        if (topics.length) {
          await tx.researcherTopic.createMany({
            data: topics.map((topic, index) => ({ researcherId: current.id, topicId: topic.id, weight: Math.max(0.5, 1 - index * 0.05) })),
          });
        }
      }

      if (input.methodSlugs !== undefined) {
        const methods = await tx.researchMethod.findMany({ where: { slug: { in: input.methodSlugs } }, select: { id: true, slug: true } });
        const found = new Set(methods.map((method) => method.slug));
        const missing = input.methodSlugs.filter((slug) => !found.has(slug));
        if (missing.length) throw new ResearcherRepositoryError("UNKNOWN_RESEARCH_METHOD", `Unknown research method: ${missing.join(", ")}.`);
        await tx.researcherMethod.deleteMany({ where: { researcherId: current.id } });
        if (methods.length) {
          await tx.researcherMethod.createMany({
            data: methods.map((method) => ({ researcherId: current.id, methodId: method.id, proficiency: "WORKING" })),
          });
        }
      }

      await tx.researcherProfile.update({
        where: { id: current.id },
        data: {
          ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
          ...(input.headline !== undefined ? { headline: input.headline } : {}),
          ...(input.bio !== undefined ? { bio: input.bio } : {}),
          ...(input.city !== undefined ? { city: input.city } : {}),
          ...(input.countryCode !== undefined ? { countryCode: input.countryCode } : {}),
          ...(input.careerStage !== undefined ? { careerStage: input.careerStage } : {}),
          ...(input.orcid !== undefined ? { orcid: input.orcid } : {}),
          ...(input.profilePublic !== undefined ? { profilePublic: input.profilePublic } : {}),
          ...(input.availability !== undefined ? { availabilityMode: availabilityToDb[input.availability] } : {}),
          ...(input.collaborationGoals !== undefined
            ? { collaborationGoals: input.collaborationGoals.map((goal) => collaborationGoalToDb[goal]) }
            : {}),
        },
      });

      if (input.orcid !== undefined) {
        await tx.evidenceRecord.updateMany({
          where: { researcherId: current.id, fieldPath: "orcid", status: "VERIFIED" },
          data: { status: "STALE" },
        });
      }

      const changedFields = Object.entries(input).filter(([, value]) => value !== undefined);
      if (changedFields.length) {
        await tx.evidenceRecord.createMany({
          data: changedFields.map(([fieldPath, value]) => ({
            researcherId: current.id,
            actorUserId: userId,
            sourceType: "USER_ENTRY",
            fieldPath,
            valueFingerprint: fingerprint(value),
            status: "ASSERTED",
            metadata: { origin: "scientific-profile-editor" },
          })),
        });
      }
    });

    const updated = await loadProfileByUserId(userId);
    if (!updated) throw new ResearcherRepositoryError("PROFILE_NOT_FOUND", "Scientific profile could not be reloaded.");
    return mapLoadedProfile(updated);
  },

  async discoverResearchers() {
    const db = getDb();
    const researchers = await db.researcherProfile.findMany({
      where: { profilePublic: true },
      orderBy: [{ verified: "desc" }, { updatedAt: "desc" }],
      take: 20,
      include: {
        affiliations: { where: { current: true }, include: { organization: true }, take: 1 },
        topics: { include: { topic: true }, orderBy: { weight: "desc" }, take: 3 },
      },
    });
    if (!researchers.length) return fixtureRepository.discoverResearchers();
    return researchers.map((researcher) => ({
      id: researcher.id,
      fullName: researcher.fullName,
      headline: researcher.headline ?? "Medical researcher",
      institution: researcher.affiliations[0]?.organization.name ?? "Independent researcher",
      alignment: "relevant" as const,
      reasons: [
        ...researcher.topics.map(({ topic }) => topic.name),
        researcher.availabilityMode === "OPEN" ? "Open to scientific introductions" : "Availability controlled by recipient",
      ].slice(0, 3),
      availability: mapAvailability(researcher.availabilityMode),
      confidence: researcher.verified ? "high" as const : "medium" as const,
    }));
  },
};

export const researcherRepository: ResearcherRepository = process.env.DATABASE_URL ? prismaRepository : fixtureRepository;

export function collaborationGoalValueFromLabel(label: string): CollaborationGoalValue | null {
  const normalized = label.trim().toLowerCase().replaceAll(" ", "-");
  return Object.prototype.hasOwnProperty.call(collaborationGoalToDb, normalized)
    ? (normalized as CollaborationGoalValue)
    : null;
}
