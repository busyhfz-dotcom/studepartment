import { getDb } from "@studepartment/db";
import type { DigestFrequencyValue, NotificationPreferencesResponse } from "@/lib/api-contracts";

const toDb = { weekly: "WEEKLY", off: "OFF" } as const satisfies Record<DigestFrequencyValue, string>;
const fromDb = { WEEKLY: "weekly", OFF: "off" } as const satisfies Record<string, DigestFrequencyValue>;

let fixturePreferences: NotificationPreferencesResponse = { digestFrequency: "weekly", lastDigestSentAt: null };

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferencesResponse> {
  if (!process.env.DATABASE_URL) return fixturePreferences;

  const user = await getDb().user.findUnique({
    where: { id: userId },
    select: { digestFrequency: true, lastDigestSentAt: true },
  });
  if (!user) {
    return { digestFrequency: "weekly", lastDigestSentAt: null };
  }
  return {
    digestFrequency: fromDb[user.digestFrequency],
    lastDigestSentAt: user.lastDigestSentAt ? user.lastDigestSentAt.toISOString() : null,
  };
}

export async function updateNotificationPreferences(
  userId: string,
  digestFrequency: DigestFrequencyValue,
): Promise<NotificationPreferencesResponse> {
  if (!process.env.DATABASE_URL) {
    fixturePreferences = { ...fixturePreferences, digestFrequency };
    return fixturePreferences;
  }

  const user = await getDb().user.update({
    where: { id: userId },
    data: { digestFrequency: toDb[digestFrequency] },
    select: { digestFrequency: true, lastDigestSentAt: true },
  });
  return {
    digestFrequency: fromDb[user.digestFrequency],
    lastDigestSentAt: user.lastDigestSentAt ? user.lastDigestSentAt.toISOString() : null,
  };
}
