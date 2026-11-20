import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { decodeEntities, htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://cancer.ca/en/research/for-researchers/funding-opportunities";
const timezone = "America/Toronto";
const organization = { name: "Canadian Cancer Society", type: "FOUNDATION", countryCode: "CA", website: "https://cancer.ca/" } as const;

function canadianDeadline(text: string) {
  const date = text.match(/^([A-Za-z]+ \d{1,2}, 20\d{2}),\s*(\d{1,2}):(\d{2})\s*(am|pm)\s*(?:ET|EST|EDT)\b/i);
  if (!date) return null;
  const day = englishDate(date[1]);
  const hour = Number(date[2]) % 12 + (date[4].toLowerCase() === "pm" ? 12 : 0);
  if (!day || Number(date[2]) < 1 || Number(date[2]) > 12 || Number(date[3]) > 59) return null;
  const time = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, timeZoneName: "longOffset" })
    .formatToParts(new Date(day + "T12:00:00Z")).find((part) => part.type === "timeZoneName")?.value;
  return time ? day + "T" + String(hour).padStart(2, "0") + ":" + date[3] + ":00" + time.slice(3) : null;
}

export function canadianCancerRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const table = html.match(/<h3[^>]*>\s*(?:<strong>)?Open competitions(?:<\/strong>)?\s*<\/h3>[\s\S]*?<table\b[^>]*>([\s\S]*?)<\/table>/i)?.[1];
  if (!table || !/Canadian Cancer Society/i.test(html)) throw new Error("The Canadian Cancer Society's open competitions were not recognized");
  return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap(([, row]) => {
    const columns = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(([, cell]) => cell);
    if (!/^research grant$/i.test(htmlToText(columns[2]))) return [];
    const link = columns[1]?.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const deadline = canadianDeadline(htmlToText(columns[0]));
    if (!link || !deadline || Date.parse(deadline) <= now.getTime()) return [];
    const url = new URL(decodeEntities(link[1]), homepage);
    if (url.origin !== new URL(homepage).origin || !url.pathname.startsWith(new URL(homepage).pathname + "/")) return [];
    const sourceUrl = url.origin + url.pathname;
    return [{
      sourceRecordId: url.pathname.replace(/\/$/, "").split("/").at(-1)!,
      sourceUrl,
      applicationUrl: sourceUrl,
      type: "GRANT",
      title: htmlToText(link[2]),
      organization,
      countryCode: "CA",
      deadline,
      deadlineTimezone: timezone,
      topicSlugs: ["oncology"],
      metadata: { status: "open", fundingRegion: "Canada", awardCurrency: "CAD" },
    }];
  });
}

export const canadianCancerFundingSource: OpportunitySourceConnector = {
  id: "canadian-cancer-society-grants",
  source: { type: "FUNDER", name: "Canadian Cancer Society", verified: true },
  kind: "grants",
  homepage,
  description: "Open research competitions published directly by the Canadian Cancer Society.",
  completeSnapshot: false,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    return canadianCancerRecords(await read(homepage), now);
  },
};
