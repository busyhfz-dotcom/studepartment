import { createHash } from "node:crypto";
import { getDb } from "@studepartment/db";
import { getSiteUrl } from "@/lib/site";
import { isEmailDeliveryConfigured, sendEmail } from "@/server/notifications/email";
import { DIGEST_WINDOW_DAYS, MAX_DEADLINE_LOOKAHEAD_DAYS, escapeHtml, isDeadlineDue } from "./digest-format";

const MAX_EMAIL_ATTEMPTS = 60;
const MAX_REMINDERS_PER_EMAIL = 10;

type DigestOpportunity = {
  title: string;
  organization: string;
  deadlineLabel: string;
  location: string;
};

type DigestContent = {
  subject: string;
  positions: DigestOpportunity[];
  grants: DigestOpportunity[];
  savedDeadlines: DigestOpportunity[];
};

const subjectLinesByCount = [
  "Your Provenant weekly digest — nothing new this week",
  "1 new match this week on Provenant",
];

function subjectLine(total: number, savedDeadlines = 0): string {
  if (total === 0 && savedDeadlines > 0) {
    return savedDeadlines === 1 ? "1 saved opportunity closes soon" : `${savedDeadlines} saved opportunities close soon`;
  }
  if (total === 0) return subjectLinesByCount[0];
  if (total === 1) return subjectLinesByCount[1];
  if (total <= 4) return `${total} new positions & grants worth a look this week`;
  return `${total} new positions & grants matched to your research this week`;
}

function formatDeadline(deadline: Date | null): string {
  if (!deadline) return "Rolling / no fixed deadline";
  return `Deadline ${deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function renderHtml(content: DigestContent, siteUrl: string): string {
  const section = (title: string, items: DigestOpportunity[]) => {
    if (!items.length) return "";
    const rows = items
      .map(
        (item) =>
          `<tr><td style="padding:10px 0;border-bottom:1px solid #e6e9e7;">
            <strong style="font-size:14px;color:#101815;">${escapeHtml(item.title)}</strong><br/>
            <span style="font-size:12px;color:#5b655f;">${escapeHtml(item.organization)} · ${escapeHtml(item.location)}</span><br/>
            <span style="font-size:12px;color:#0b6c60;font-weight:600;">${escapeHtml(item.deadlineLabel)}</span>
          </td></tr>`,
      )
      .join("");
    return `<h2 style="font-size:15px;color:#101815;margin:24px 0 8px;">${title}</h2><table width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
  };

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
    <p style="font-size:12px;color:#5b655f;">Provenant · Medical Research Intelligence</p>
    <h1 style="font-size:20px;color:#101815;">${escapeHtml(content.subject)}</h1>
    ${section("Saved opportunities closing soon", content.savedDeadlines)}
    ${section("New positions", content.positions)}
    ${section("New grants & funding", content.grants)}
    <p style="margin-top:28px;font-size:11px;color:#8a938e;">
      You are receiving this because Provenant research emails are turned on.
      <a href="${siteUrl}/settings/privacy" style="color:#0b6c60;">Manage notification preferences</a>.
    </p>
  </div>`;
}

function renderText(content: DigestContent, siteUrl: string): string {
  const section = (title: string, items: DigestOpportunity[]) => {
    if (!items.length) return "";
    return `\n${title}\n` + items.map((item) => `- ${item.title} · ${item.organization} · ${item.deadlineLabel}`).join("\n") + "\n";
  };
  return (
    `${content.subject}\n` +
    section("Saved opportunities closing soon", content.savedDeadlines) +
    section("New positions", content.positions) +
    section("New grants & funding", content.grants) +
    `\nManage notification preferences: ${siteUrl}/settings/privacy\n`
  );
}

export type WeeklyDigestRunSummary = {
  usersConsidered: number;
  emailsSent: number;
  emailsAttempted: number;
  emailsSkippedNoContent: number;
  emailsSkippedDeliveryNotConfigured: number;
};

/**
 * A daily check sends eligible deadline reminders and, when due, a weekly
 * digest. Both can fit in one email, and require a verified, opted-in account.
 */
export async function runWeeklyDigest(): Promise<WeeklyDigestRunSummary> {
  const summary: WeeklyDigestRunSummary = {
    usersConsidered: 0, emailsSent: 0, emailsAttempted: 0,
    emailsSkippedNoContent: 0, emailsSkippedDeliveryNotConfigured: 0,
  };
  if (!process.env.DATABASE_URL || !isEmailDeliveryConfigured()) return summary;

  const db = getDb();
  const siteUrl = getSiteUrl();
  const now = new Date();
  const eligibleCutoff = new Date(now.getTime() - DIGEST_WINDOW_DAYS * 86_400_000);

  type Reminder = {
    id: string; userId: string; alertLeadDays: number; deadline: Date;
    title: string; city: string | null; countryCode: string | null; organization: string;
  };
  // The lead time differs per saved listing. Apply it in Postgres so later
  // deadlines cannot fill the batch before reminders that are actually due.
  const reminders = await db.$queryRaw<Reminder[]>`
    WITH due AS (
      SELECT s.id, s."userId", s."alertLeadDays", o.deadline, o.title,
             o.city, o."countryCode", org.name AS organization,
             row_number() OVER (PARTITION BY s."userId" ORDER BY o.deadline, s.id) AS row_number
      FROM "SavedOpportunity" s
      JOIN "User" u ON u.id = s."userId"
      JOIN "Opportunity" o ON o.id = s."opportunityId"
      JOIN "Organization" org ON org.id = o."organizationId"
      CROSS JOIN LATERAL (
        SELECT GREATEST(1, LEAST(${MAX_DEADLINE_LOOKAHEAD_DAYS}, s."alertLeadDays")) * interval '1 day' AS lead_time
      ) timing
      WHERE s."deadlineAlert" AND u."emailVerified" AND u."digestFrequency" = 'WEEKLY'
        AND o.status = 'ACTIVE' AND o.deadline BETWEEN ${now}::timestamp AND ${now}::timestamp + timing.lead_time
        AND (s."lastAlertedAt" IS NULL OR s."lastAlertedAt" < o.deadline - timing.lead_time)
    )
    SELECT id, "userId", "alertLeadDays", deadline, title, city, "countryCode", organization
    FROM due WHERE row_number <= ${MAX_REMINDERS_PER_EMAIL}
    ORDER BY deadline, id
    LIMIT ${MAX_EMAIL_ATTEMPTS * MAX_REMINDERS_PER_EMAIL}
  `;
  const remindersByUser = new Map<string, Reminder[]>();
  for (const item of reminders) {
    if (!isDeadlineDue(item.deadline, item.alertLeadDays, now)) continue;
    const group = remindersByUser.get(item.userId);
    if (group) group.push(item);
    else remindersByUser.set(item.userId, [item]);
  }
  const select = {
    id: true, email: true, lastDigestSentAt: true,
    researcher: { select: { topics: { select: { topic: { select: { slug: true } } } } } },
  } as const;
  const optedIn = { digestFrequency: "WEEKLY", emailVerified: true } as const;
  const [deadlineCandidates, weeklyCandidates] = await Promise.all([
    remindersByUser.size ? db.user.findMany({ where: { ...optedIn, id: { in: [...remindersByUser.keys()] } }, select }) : [],
    db.user.findMany({
      where: { ...optedIn, OR: [{ lastDigestSentAt: null }, { lastDigestSentAt: { lte: eligibleCutoff } }] },
      select, orderBy: [{ lastDigestSentAt: { sort: "asc", nulls: "first" } }, { id: "asc" }], take: 500,
    }),
  ]);
  const candidatesById = new Map([...weeklyCandidates, ...deadlineCandidates].map((user) => [user.id, user]));
  const candidateIds = new Set([...remindersByUser.keys(), ...weeklyCandidates.map(({ id }) => id)]);

  for (const candidateId of candidateIds) {
    if (summary.emailsAttempted >= MAX_EMAIL_ATTEMPTS) break;
    const candidate = candidatesById.get(candidateId);
    if (!candidate) continue;
    summary.usersConsidered += 1;
    const since = candidate.lastDigestSentAt ?? eligibleCutoff;
    const weeklyDue = !candidate.lastDigestSentAt || candidate.lastDigestSentAt <= eligibleCutoff;
    const topicSlugs = candidate.researcher?.topics.map(({ topic }) => topic.slug) ?? [];

    const baseWhere = {
      status: "ACTIVE" as const,
      firstSeenAt: { gte: since },
      OR: [{ deadline: null }, { deadline: { gte: now } }],
    };

    const [positions, grants] = weeklyDue ? await Promise.all([
      db.opportunity.findMany({
        where: {
          ...baseWhere,
          type: { not: "GRANT" },
          ...(topicSlugs.length ? { topics: { some: { topic: { slug: { in: topicSlugs } } } } } : {}),
        },
        orderBy: [{ firstSeenAt: "desc" }],
        take: 6,
        select: { title: true, city: true, countryCode: true, deadline: true, organization: { select: { name: true } } },
      }),
      db.opportunity.findMany({
        where: {
          ...baseWhere,
          type: "GRANT",
          ...(topicSlugs.length ? { topics: { some: { topic: { slug: { in: topicSlugs } } } } } : {}),
        },
        orderBy: [{ firstSeenAt: "desc" }],
        take: 6,
        select: { title: true, city: true, countryCode: true, deadline: true, organization: { select: { name: true } } },
      }),
    ]) : [[], []];
    const dueSaved = remindersByUser.get(candidate.id) ?? [];

    const total = positions.length + grants.length;
    if (total === 0 && dueSaved.length === 0) {
      summary.emailsSkippedNoContent += 1;
      continue;
    }

    const map = (rows: typeof positions): DigestOpportunity[] =>
      rows.map((row) => ({
        title: row.title,
        organization: row.organization.name,
        deadlineLabel: formatDeadline(row.deadline),
        location: [row.city, row.countryCode].filter(Boolean).join(", ") || "Location not published",
      }));

    const content: DigestContent = {
      subject: subjectLine(total, dueSaved.length),
      positions: map(positions),
      grants: map(grants),
      savedDeadlines: dueSaved.map((row) => ({
        title: row.title, organization: row.organization, deadlineLabel: formatDeadline(row.deadline),
        location: [row.city, row.countryCode].filter(Boolean).join(", ") || "Location not published",
      })),
    };

    if (summary.emailsAttempted > 0) await new Promise((resolve) => setTimeout(resolve, 250));
    summary.emailsAttempted += 1;
    const result = await sendEmail({
      to: candidate.email,
      subject: content.subject,
      html: renderHtml(content, siteUrl),
      text: renderText(content, siteUrl),
      idempotencyKey: "provenant-digest/" + createHash("sha256").update(candidate.id + ":" + now.toISOString().slice(0, 10)).digest("hex"),
    });

    if (result.sent) {
      summary.emailsSent += 1;
      await db.$transaction([
        ...(total > 0 ? [db.user.updateMany({ where: { id: candidate.id }, data: { lastDigestSentAt: now } })] : []),
        ...(dueSaved.length ? [db.savedOpportunity.updateMany({ where: { id: { in: dueSaved.map(({ id }) => id) } }, data: { lastAlertedAt: now } })] : []),
      ]);
    } else if (result.reason === "EMAIL_DELIVERY_NOT_CONFIGURED") {
      summary.emailsSkippedDeliveryNotConfigured += 1;
      break;
    } else if (result.reason === "PROVIDER_ERROR_429" || result.reason === "PROVIDER_ERROR_401" || result.reason === "PROVIDER_ERROR_403") {
      break;
    }
  }

  return summary;
}
