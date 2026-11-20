import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText, topicSlugsFor } from "./classify";
import { openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://oportunidades.fapesp.br/?lang=en";
const levels: Record<string, OpportunityIngestionRecord["type"]> = {
  "1": "POSTDOC",
  "2": "PHD_SCHOLARSHIP",
  "3": "MASTERS_SCHOLARSHIP",
};

export function fapespFellowshipRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const listed = html.match(/Opportunities available:\s*(\d+)/i);
  const cards = Array.from(html.matchAll(/<li class="(box_col aberta[^"]*)">([\s\S]*?)<\/li>/gi));
  if (!listed || Number(listed[1]) > 0 && !cards.length) throw new Error("FAPESP's open fellowship list was not recognized");
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", dateStyle: "short" }).format(now);
  const selected = new Map<string, OpportunityIngestionRecord>();
  for (const [, classes, card] of cards) {
    if (!/\ben\b/.test(classes)) continue; // The source lists each call in both languages.
    const tag = classes.match(/\btipo_(\d+)\b/);
    const type = tag ? levels[tag[1]] : undefined;
    if (!type) continue;
    const href = card.match(/href="([^"]+)"/i)?.[1];
    if (!href) continue;
    const url = new URL(href, homepage);
    const id = url.pathname.match(/\/(\d+)\/$/)?.[1];
    if (url.origin !== new URL(homepage).origin || !id) continue;
    const title = htmlToText(card.match(/<strong class="title">([\s\S]*?)<\/strong>/i)?.[1]);
    const text = htmlToText(card);
    const organization = text.match(/Institu(?:i)?tion:\s*(.*?)\s*City:/i)?.[1];
    const city = text.match(/City:\s*(.*?)\s*Deadline for submissions:/i)?.[1];
    const deadline = text.match(/Deadline for submissions:\s*(20\d{2}-\d{2}-\d{2})/i)?.[1];
    if (!title || !organization || !deadline || deadline < today) continue;
    if (!isMedicalText(title) && !/faculdade de medicina|escola paulista de medicina|hospital|faculdade de odonto/i.test(organization)) continue;
    selected.set(id, {
      sourceRecordId: id,
      sourceUrl: url.href,
      applicationUrl: url.href,
      type,
      title,
      organization: { name: organization, type: "RESEARCH_INSTITUTE", countryCode: "BR" },
      countryCode: "BR",
      city: city || null,
      deadline,
      deadlineTimezone: "America/Sao_Paulo",
      topicSlugs: topicSlugsFor(title),
      eligibleCareerStages: [type === "POSTDOC" ? "postdoc" : type === "PHD_SCHOLARSHIP" ? "phd" : "student"],
      metadata: { agencyName: "São Paulo Research Foundation (FAPESP)" },
    });
  }
  return [...selected.values()];
}

export const fapespFellowshipsSource: OpportunitySourceConnector = {
  id: "fapesp-health-fellowships",
  source: { type: "FUNDER", name: "FAPESP Published Fellowship Calls", verified: true },
  kind: "scholarships",
  homepage,
  description: "Health-related master’s, PhD and postdoctoral calls published on the São Paulo Research Foundation’s fellowship portal.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  staleGraceHours: 24,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    return fapespFellowshipRecords(await read(homepage), now);
  },
};
