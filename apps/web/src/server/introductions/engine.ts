import { createHash } from "node:crypto";
import { getDb } from "@studepartment/db";
import type {
  CreateIntroductionInput,
  DiscoveryAvailability,
  IntroductionAction,
  IntroductionListResponse,
  IntroductionPolicyResponse,
  IntroductionPurpose,
  IntroductionRequestRecord,
  IntroductionRequestStatus,
  ScientificIntroductionPreview,
} from "@/lib/api-contracts";
import { requireCurrentUser } from "@/server/auth/current-user";

const purposeToDb = {
  "research-discussion": "RESEARCH_DISCUSSION",
  collaboration: "COLLABORATION",
  mentorship: "MENTORSHIP",
  "position-inquiry": "POSITION_INQUIRY",
  "grant-partnership": "GRANT_PARTNERSHIP",
  "clinical-project": "CLINICAL_PROJECT",
} as const;

const purposeFromDb = {
  RESEARCH_DISCUSSION: "research-discussion",
  COLLABORATION: "collaboration",
  MENTORSHIP: "mentorship",
  POSITION_INQUIRY: "position-inquiry",
  GRANT_PARTNERSHIP: "grant-partnership",
  CLINICAL_PROJECT: "clinical-project",
} as const satisfies Record<string, IntroductionPurpose>;

const statusFromDb = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  WITHDRAWN: "withdrawn",
  EXPIRED: "expired",
  ARCHIVED: "archived",
} as const satisfies Record<string, IntroductionRequestStatus>;

const availabilityFromDb = {
  OPEN: "open",
  SELECTIVE: "selective",
  QUIET: "quiet",
  CLOSED: "closed",
} as const satisfies Record<string, DiscoveryAvailability>;

const allPurposes = Object.keys(purposeToDb) as IntroductionPurpose[];

const purposeGoal = {
  "research-discussion": "RESEARCH_COLLABORATION",
  collaboration: "RESEARCH_COLLABORATION",
  mentorship: "MENTORSHIP",
  "position-inquiry": "POSITION_OPPORTUNITIES",
  "grant-partnership": "GRANT_PARTNERSHIP",
  "clinical-project": "CLINICAL_PROJECT",
} as const;

export class IntroductionBlockedError extends Error {
  readonly code = "INTRODUCTION_BLOCKED";
  constructor(message: string) {
    super(message);
    this.name = "IntroductionBlockedError";
  }
}

export class IntroductionNotFoundError extends Error {
  readonly code = "INTRODUCTION_NOT_FOUND";
  constructor(message = "Introduction request not found.") {
    super(message);
    this.name = "IntroductionNotFoundError";
  }
}

export class IntroductionForbiddenError extends Error {
  readonly code = "INTRODUCTION_FORBIDDEN";
  constructor(message = "You cannot perform this introduction action.") {
    super(message);
    this.name = "IntroductionForbiddenError";
  }
}

export class InvalidIntroductionError extends Error {
  readonly code = "INVALID_INTRODUCTION";
  constructor(message: string) {
    super(message);
    this.name = "InvalidIntroductionError";
  }
}

function normalize(value: string) {
  return value.toLocaleLowerCase("en").normalize("NFKC");
}

function currentInstitution(profile: {
  affiliations: Array<{ organization: { name: string } }>;
}) {
  return profile.affiliations[0]?.organization.name ?? "Independent researcher";
}

function defaultPolicy(): IntroductionPolicyResponse {
  return {
    allowIntroductions: true,
    requireVerifiedSender: false,
    allowedPurposes: allPurposes,
    cooldownDays: 30,
    maxInboundPerDay: 10,
  };
}

function policyFromRow(row: {
  allowIntroductions: boolean;
  requireVerifiedSender: boolean;
  allowedPurposes: Array<keyof typeof purposeFromDb>;
  cooldownDays: number;
  maxInboundPerDay: number;
} | null): IntroductionPolicyResponse {
  if (!row) return defaultPolicy();
  return {
    allowIntroductions: row.allowIntroductions,
    requireVerifiedSender: row.requireVerifiedSender,
    allowedPurposes: row.allowedPurposes.length
      ? row.allowedPurposes.map((purpose) => purposeFromDb[purpose])
      : allPurposes,
    cooldownDays: row.cooldownDays,
    maxInboundPerDay: row.maxInboundPerDay,
  };
}

async function expirePendingRequests() {
  const db = getDb();
  const expired = await db.connectionRequest.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    select: { id: true },
    take: 100,
  });

  for (const request of expired) {
    await db.$transaction(async (tx) => {
      const changed = await tx.connectionRequest.updateMany({
        where: { id: request.id, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
      if (changed.count) {
        await tx.connectionRequestEvent.create({
          data: { requestId: request.id, type: "EXPIRED" },
        });
      }
    });
  }
}

async function ownedProfile() {
  const user = await requireCurrentUser();
  const profile = await getDb().researcherProfile.findUnique({
    where: { userId: user.id },
    include: {
      affiliations: {
        where: { current: true },
        include: { organization: true },
        orderBy: { startDate: "desc" },
        take: 1,
      },
      topics: { include: { topic: true } },
      methods: { include: { method: true } },
    },
  });
  if (!profile) {
    throw new IntroductionBlockedError("Complete your Scientific Identity before sending or managing introductions.");
  }
  return profile;
}

function relevanceBetween(
  sender: {
    topics: Array<{ topic: { name: string; slug: string } }>;
    methods: Array<{ method: { name: string; slug: string } }>;
  },
  receiver: {
    topics: Array<{ topic: { name: string; slug: string } }>;
    methods: Array<{ method: { name: string; slug: string } }>;
  },
) {
  const senderTopics = new Set(sender.topics.map(({ topic }) => topic.slug));
  const senderMethods = new Set(sender.methods.map(({ method }) => method.slug));
  const sharedTopics = receiver.topics
    .filter(({ topic }) => senderTopics.has(topic.slug))
    .map(({ topic }) => topic.name);
  const sharedMethods = receiver.methods
    .filter(({ method }) => senderMethods.has(method.slug))
    .map(({ method }) => method.name);

  const relevance: ScientificIntroductionPreview["relevance"] =
    sharedTopics.length >= 2 || (sharedTopics.length >= 1 && sharedMethods.length >= 1)
      ? "strong"
      : sharedTopics.length || sharedMethods.length
        ? "relevant"
        : "weak";

  const reasons: string[] = [];
  if (sharedTopics.length) reasons.push(`Shared research topics: ${sharedTopics.slice(0, 3).join(", ")}`);
  if (sharedMethods.length) reasons.push(`Shared or complementary methods: ${sharedMethods.slice(0, 3).join(", ")}`);
  if (!reasons.length) reasons.push("No explicit topic or method overlap is recorded in the current scientific profiles.");

  return { relevance, reasons };
}

export async function previewIntroduction(
  receiverId: string,
  purpose: IntroductionPurpose,
): Promise<ScientificIntroductionPreview> {
  await expirePendingRequests();
  const db = getDb();
  const sender = await ownedProfile();
  const receiver = await db.researcherProfile.findUnique({
    where: { id: receiverId },
    include: {
      affiliations: {
        where: { current: true },
        include: { organization: true },
        orderBy: { startDate: "desc" },
        take: 1,
      },
      topics: { include: { topic: true } },
      methods: { include: { method: true } },
      introductionPolicy: true,
    },
  });

  if (!receiver || !receiver.profilePublic) throw new IntroductionNotFoundError("Researcher is not available for introductions.");
  const { relevance, reasons } = relevanceBetween(sender, receiver);
  const policy = policyFromRow(receiver.introductionPolicy);
  const guardrails = [
    "Maximum 5 new outgoing requests per 24 hours.",
    `Recipient cooldown: ${policy.cooldownDays} days between requests from the same researcher.`,
    "Pending requests expire after 14 days.",
  ];

  let blockReason: string | undefined;
  if (sender.id === receiver.id) {
    blockReason = "You cannot send an introduction request to yourself.";
  } else if (!policy.allowIntroductions) {
    blockReason = "This researcher has disabled scientific introduction requests.";
  } else if (receiver.availabilityMode === "CLOSED" || receiver.availabilityMode === "QUIET") {
    blockReason = "This researcher is not accepting new scientific introductions right now.";
  } else if (policy.requireVerifiedSender && !sender.verified) {
    blockReason = "This researcher accepts introductions only from verified scientific identities.";
  } else if (!policy.allowedPurposes.includes(purpose)) {
    blockReason = "This researcher does not accept introductions for the selected purpose.";
  } else if (
    receiver.availabilityMode === "SELECTIVE" &&
    !receiver.collaborationGoals.includes(purposeGoal[purpose])
  ) {
    blockReason = "The selected purpose is outside the recipient's current collaboration goals.";
  } else if (receiver.availabilityMode === "SELECTIVE" && relevance === "weak") {
    blockReason = "The recipient is selective and the current profiles do not show enough scientific overlap.";
  }

  const now = new Date();
  if (!blockReason) {
    const [pendingPair, recentPair, dailyOutgoing, pendingOutgoing, todayInbound] = await Promise.all([
      db.connectionRequest.findFirst({
        where: { senderId: sender.id, receiverId: receiver.id, status: "PENDING" },
        select: { id: true },
      }),
      db.connectionRequest.findFirst({
        where: {
          senderId: sender.id,
          receiverId: receiver.id,
          createdAt: { gte: new Date(now.getTime() - policy.cooldownDays * 86_400_000) },
        },
        select: { id: true },
      }),
      db.connectionRequest.count({
        where: { senderId: sender.id, createdAt: { gte: new Date(now.getTime() - 86_400_000) } },
      }),
      db.connectionRequest.count({
        where: { senderId: sender.id, status: "PENDING" },
      }),
      db.connectionRequest.count({
        where: { receiverId: receiver.id, createdAt: { gte: new Date(now.getTime() - 86_400_000) } },
      }),
    ]);

    if (pendingPair) blockReason = "A pending introduction request to this researcher already exists.";
    else if (recentPair) blockReason = `A ${policy.cooldownDays}-day cooldown applies between requests to this researcher.`;
    else if (dailyOutgoing >= 5) blockReason = "Daily introduction limit reached. New requests are limited to five per 24 hours.";
    else if (pendingOutgoing >= 10) blockReason = "Resolve existing pending introductions before sending more requests.";
    else if (todayInbound >= policy.maxInboundPerDay) blockReason = "The recipient has reached their daily inbound introduction limit.";
  }

  if (receiver.availabilityMode === "OPEN") reasons.push("Recipient is currently open to scientific introductions.");
  else if (receiver.availabilityMode === "SELECTIVE") reasons.push("Recipient is selectively available for relevant scientific introductions.");

  return {
    sender: {
      id: sender.id,
      fullName: sender.fullName,
      headline: sender.headline ?? "Medical researcher",
      institution: currentInstitution(sender),
      verified: sender.verified,
    },
    receiver: {
      id: receiver.id,
      fullName: receiver.fullName,
      headline: receiver.headline ?? "Medical researcher",
      institution: currentInstitution(receiver),
      availability: availabilityFromDb[receiver.availabilityMode],
    },
    purpose,
    relevance,
    reasons: reasons.slice(0, 4),
    requestAllowed: !blockReason,
    blockReason,
    guardrails,
  };
}

export async function createIntroduction(input: CreateIntroductionInput) {
  const context = input.context.trim();
  if (context.length < 80) throw new InvalidIntroductionError("Provide at least 80 characters of specific scientific context.");
  if (context.length > 1200) throw new InvalidIntroductionError("Introduction context must be 1200 characters or fewer.");

  const preview = await previewIntroduction(input.receiverId, input.purpose);
  if (!preview.requestAllowed) throw new IntroductionBlockedError(preview.blockReason ?? "Introduction request is blocked.");

  const db = getDb();
  const sender = await ownedProfile();
  const contextFingerprint = createHash("sha256").update(normalize(context)).digest("hex");
  const reused = await db.connectionRequest.count({
    where: {
      senderId: sender.id,
      contextFingerprint,
      createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
    },
  });
  if (reused >= 2) {
    throw new IntroductionBlockedError("This exact context has been reused in multiple recent requests. Personalize the introduction before sending.");
  }

  const expiresAt = new Date(Date.now() + 14 * 86_400_000);
  try {
    return await db.$transaction(async (tx) => {
      const duplicate = await tx.connectionRequest.findFirst({
        where: { senderId: sender.id, receiverId: input.receiverId, status: "PENDING" },
        select: { id: true },
      });
      if (duplicate) throw new IntroductionBlockedError("A pending introduction request already exists.");

      const request = await tx.connectionRequest.create({
        data: {
          senderId: sender.id,
          receiverId: input.receiverId,
          purpose: purposeToDb[input.purpose],
          context,
          contextFingerprint,
          expiresAt,
        },
      });
      await tx.connectionRequestEvent.create({
        data: {
          requestId: request.id,
          type: "CREATED",
          actorResearcherId: sender.id,
        },
      });
      return {
        id: request.id,
        status: "pending" as const,
        expiresAt: expiresAt.toISOString(),
      };
    });
  } catch (error) {
    if (error instanceof IntroductionBlockedError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (message.includes("ConnectionRequest_active_pair_key") || message.includes("Unique constraint")) {
      throw new IntroductionBlockedError("A pending introduction request already exists.");
    }
    throw error;
  }
}

function mapRequest(
  request: {
    id: string;
    purpose: keyof typeof purposeFromDb;
    context: string | null;
    status: keyof typeof statusFromDb;
    createdAt: Date;
    expiresAt: Date | null;
    respondedAt: Date | null;
    sender: {
      id: string;
      fullName: string;
      headline: string | null;
      verified: boolean;
      affiliations: Array<{ organization: { name: string } }>;
    };
    receiver: {
      id: string;
      fullName: string;
      headline: string | null;
      verified: boolean;
      affiliations: Array<{ organization: { name: string } }>;
    };
  },
  ownerId: string,
): IntroductionRequestRecord {
  const direction = request.sender.id === ownerId ? "outgoing" : "incoming";
  const counterpart = direction === "outgoing" ? request.receiver : request.sender;
  return {
    id: request.id,
    direction,
    status: statusFromDb[request.status],
    purpose: purposeFromDb[request.purpose],
    context: request.context ?? "",
    createdAt: request.createdAt.toISOString(),
    expiresAt: request.expiresAt?.toISOString(),
    respondedAt: request.respondedAt?.toISOString(),
    counterpart: {
      id: counterpart.id,
      fullName: counterpart.fullName,
      headline: counterpart.headline ?? "Medical researcher",
      institution: currentInstitution(counterpart),
      verified: counterpart.verified,
    },
  };
}

export async function listIntroductions(box: "inbox" | "outbox"): Promise<IntroductionListResponse> {
  await expirePendingRequests();
  const profile = await ownedProfile();
  const rows = await getDb().connectionRequest.findMany({
    where: box === "inbox" ? { receiverId: profile.id } : { senderId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      sender: {
        include: {
          affiliations: {
            where: { current: true },
            include: { organization: true },
            orderBy: { startDate: "desc" },
            take: 1,
          },
        },
      },
      receiver: {
        include: {
          affiliations: {
            where: { current: true },
            include: { organization: true },
            orderBy: { startDate: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  return {
    box,
    requests: rows.map((request) => mapRequest(request, profile.id)),
  };
}

export async function actOnIntroduction(requestId: string, action: IntroductionAction) {
  await expirePendingRequests();
  const profile = await ownedProfile();
  const db = getDb();
  const request = await db.connectionRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new IntroductionNotFoundError();
  if (request.status !== "PENDING") throw new IntroductionBlockedError("Only pending introduction requests can be changed.");

  const receiverAction = action === "accept" || action === "decline";
  if (receiverAction && request.receiverId !== profile.id) throw new IntroductionForbiddenError();
  if (action === "withdraw" && request.senderId !== profile.id) throw new IntroductionForbiddenError();

  const status = action === "accept" ? "ACCEPTED" : action === "decline" ? "DECLINED" : "WITHDRAWN";
  const eventType = action === "accept" ? "ACCEPTED" : action === "decline" ? "DECLINED" : "WITHDRAWN";
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.connectionRequest.update({
      where: { id: request.id },
      data: {
        status,
        respondedAt: receiverAction ? now : undefined,
        withdrawnAt: action === "withdraw" ? now : undefined,
      },
    });
    await tx.connectionRequestEvent.create({
      data: {
        requestId: request.id,
        type: eventType,
        actorResearcherId: profile.id,
      },
    });
  });

  return { id: request.id, status: statusFromDb[status] };
}

export async function getIntroductionPolicy(): Promise<IntroductionPolicyResponse> {
  const profile = await ownedProfile();
  const policy = await getDb().introductionPolicy.findUnique({ where: { researcherId: profile.id } });
  return policyFromRow(policy);
}

export async function updateIntroductionPolicy(input: IntroductionPolicyResponse): Promise<IntroductionPolicyResponse> {
  const profile = await ownedProfile();
  const allowedPurposes = Array.from(new Set(input.allowedPurposes.filter((purpose) => purpose in purposeToDb)));
  const cooldownDays = Math.max(1, Math.min(180, Math.trunc(input.cooldownDays)));
  const maxInboundPerDay = Math.max(1, Math.min(50, Math.trunc(input.maxInboundPerDay)));

  const row = await getDb().introductionPolicy.upsert({
    where: { researcherId: profile.id },
    create: {
      researcherId: profile.id,
      allowIntroductions: input.allowIntroductions,
      requireVerifiedSender: input.requireVerifiedSender,
      allowedPurposes: allowedPurposes.length ? allowedPurposes.map((purpose) => purposeToDb[purpose]) : [],
      cooldownDays,
      maxInboundPerDay,
    },
    update: {
      allowIntroductions: input.allowIntroductions,
      requireVerifiedSender: input.requireVerifiedSender,
      allowedPurposes: allowedPurposes.length ? allowedPurposes.map((purpose) => purposeToDb[purpose]) : [],
      cooldownDays,
      maxInboundPerDay,
    },
  });
  return policyFromRow(row);
}
