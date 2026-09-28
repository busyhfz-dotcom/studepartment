import { getDb } from "@studepartment/db";

const MAX_WEIGHT = 25;
const SEARCH_INCREMENT = 1;
const ACTION_INCREMENT = 2;
const MAX_TOPICS_PER_EVENT = 6;

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3),
    ),
  ).slice(0, 12);
}

async function bumpTopicWeights(userId: string, topicIds: string[], increment: number) {
  if (!topicIds.length) return;
  const db = getDb();
  const now = new Date();

  await Promise.all(
    topicIds.slice(0, MAX_TOPICS_PER_EVENT).map((topicId) =>
      db.userInterestSignal.upsert({
        where: { userId_topicId: { userId, topicId } },
        update: { weight: { increment }, lastEventAt: now },
        create: { userId, topicId, weight: Math.min(increment, MAX_WEIGHT), lastEventAt: now },
      }).then(async () => {
        // Cap runaway weights instead of letting a single topic dominate indefinitely.
        await db.userInterestSignal.updateMany({
          where: { userId, topicId, weight: { gt: MAX_WEIGHT } },
          data: { weight: MAX_WEIGHT },
        });
      }),
    ),
  );
}

/**
 * Records a free-text search and nudges the user's interest weights toward
 * any research topics the query text matches. Best-effort: failures never
 * block the search response that triggered them.
 */
export async function recordSearchAndUpdateInterest(userId: string, queryText: string, context: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  const trimmed = queryText.trim();
  if (!trimmed) return;

  const db = getDb();
  try {
    await db.searchQueryLog.create({
      data: { userId, queryText: trimmed.slice(0, 300), context: context.slice(0, 60) },
    });

    const tokens = tokenize(trimmed);
    if (!tokens.length) return;

    const matchingTopics = await db.researchTopic.findMany({
      where: { OR: tokens.map((token) => ({ name: { contains: token, mode: "insensitive" as const } })) },
      select: { id: true },
      take: MAX_TOPICS_PER_EVENT,
    });

    await bumpTopicWeights(userId, matchingTopics.map((topic) => topic.id), SEARCH_INCREMENT);
  } catch (error) {
    console.error("[personalization] failed to record search", error);
  }
}

/**
 * Nudges interest weights from a stronger, explicit signal (a save, or
 * positive feedback) rather than a search — weighted higher than a search
 * token match.
 */
export async function bumpInterestFromTopicSlugs(userId: string, topicSlugs: string[]): Promise<void> {
  if (!process.env.DATABASE_URL || !topicSlugs.length) return;
  const db = getDb();
  try {
    const topics = await db.researchTopic.findMany({
      where: { slug: { in: topicSlugs.slice(0, MAX_TOPICS_PER_EVENT) } },
      select: { id: true },
    });
    await bumpTopicWeights(userId, topics.map((topic) => topic.id), ACTION_INCREMENT);
  } catch (error) {
    console.error("[personalization] failed to record interest action", error);
  }
}

/**
 * Returns the user's current top research-topic slugs by interest weight,
 * derived from search activity, saves, and feedback. Used to widen
 * discovery and opportunity ranking beyond the static profile topic list.
 */
export async function getTopInterestTopicSlugs(userId: string, limit = 8): Promise<string[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const signals = await getDb().userInterestSignal.findMany({
      where: { userId, weight: { gt: 0 } },
      orderBy: { weight: "desc" },
      take: limit,
      select: { topic: { select: { slug: true } } },
    });
    return signals.map((signal) => signal.topic.slug);
  } catch (error) {
    console.error("[personalization] failed to load interest signals", error);
    return [];
  }
}
