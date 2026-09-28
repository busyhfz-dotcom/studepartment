import { getDb } from "@studepartment/db";
import { getSiteUrl } from "@/lib/site";
import { sendEmail } from "@/server/notifications/email";

const DIGEST_WINDOW_DAYS = 7;

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
};

const subjectLinesByCount = [
  "Your Studepartment weekly digest — nothing new this week",
  "1 new match this week on Studepartment",
];

function subjectLine(total: number): string {
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
            <strong style="font-size:14px;color:#101815;">${item.title}</strong><br/>
            <span style="font-size:12px;color:#5b655f;">${item.organization} · ${item.location}</span><br/>
            <span style="font-size:12px;color:#0b6c60;font-weight:600;">${item.deadlineLabel}</span>
          </td></tr>`,
      )
      .join("");
    return `<h2 style="font-size:15px;color:#101815;margin:24px 0 8px;">${title}</h2><table width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
  };

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
    <p style="font-size:12px;color:#5b655f;">Studepartment · Medical Research Intelligence</p>
    <h1 style="font-size:20px;color:#101815;">${content.subject}</h1>
    ${section("New positions", content.positions)}
    ${section("New grants & funding", content.grants)}
    <p style="margin-top:28px;font-size:11px;color:#8a938e;">
      You are receiving this because your Studepartment weekly digest is turned on.
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
    section("New positions", content.positions) +
    section("New grants & funding", content.grants) +
    `\nManage notification preferences: ${siteUrl}/settings/privacy\n`
  );
}

export type WeeklyDigestRunSummary = {
  usersConsidered: number;
  emailsSent: number;
  emailsSkippedNoContent: number;
  emailsSkippedDeliveryNotConfigured: number;
};

/**
 * Sends the weekly digest to every user opted in whose last digest is at
 * least DIGEST_WINDOW_DAYS old (or who has never received one). Intended to
 * be invoked by an external scheduler hitting the protected internal job
 * route on a weekly cadence — this process does not schedule itself.
 */
export async function runWeeklyDigest(): Promise<WeeklyDigestRunSummary> {
  if (!process.env.DATABASE_URL) {
    return { usersConsidered: 0, emailsSent: 0, emailsSkippedNoContent: 0, emailsSkippedDeliveryNotConfigured: 0 };
  }

  const db = getDb();
  const siteUrl = getSiteUrl();
  const now = new Date();
  const eligibleCutoff = new Date(now.getTime() - DIGEST_WINDOW_DAYS * 86_400_000);

  const candidates = await db.user.findMany({
    where: {
      digestFrequency: "WEEKLY",
      emailVerified: true,
      OR: [{ lastDigestSentAt: null }, { lastDigestSentAt: { lte: eligibleCutoff } }],
    },
    select: {
      id: true,
      email: true,
      lastDigestSentAt: true,
      researcher: {
        select: {
          topics: { select: { topic: { select: { slug: true } } } },
        },
      },
    },
    take: 500,
  });

  const summary: WeeklyDigestRunSummary = {
    usersConsidered: candidates.length,
    emailsSent: 0,
    emailsSkippedNoContent: 0,
    emailsSkippedDeliveryNotConfigured: 0,
  };

  for (const candidate of candidates) {
    const since = candidate.lastDigestSentAt ?? new Date(now.getTime() - DIGEST_WINDOW_DAYS * 86_400_000);
    const topicSlugs = candidate.researcher?.topics.map(({ topic }) => topic.slug) ?? [];

    const baseWhere = {
      status: "ACTIVE" as const,
      firstSeenAt: { gte: since },
      OR: [{ deadline: null }, { deadline: { gte: now } }],
    };

    const [positions, grants] = await Promise.all([
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
    ]);

    const total = positions.length + grants.length;
    if (total === 0) {
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
      subject: subjectLine(total),
      positions: map(positions),
      grants: map(grants),
    };

    const result = await sendEmail({
      to: candidate.email,
      subject: content.subject,
      html: renderHtml(content, siteUrl),
      text: renderText(content, siteUrl),
    });

    if (result.sent) {
      summary.emailsSent += 1;
      await db.user.update({ where: { id: candidate.id }, data: { lastDigestSentAt: now } });
    } else if (result.reason === "EMAIL_DELIVERY_NOT_CONFIGURED") {
      summary.emailsSkippedDeliveryNotConfigured += 1;
    }
  }

  return summary;
}
