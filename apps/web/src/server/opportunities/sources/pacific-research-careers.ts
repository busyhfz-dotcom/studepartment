import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText, topicSlugsFor } from "./classify";
import { englishDate, openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const riken = "https://www.riken.jp/en/careers/openings/";
const cbs = "https://cbs.riken.jp/en/careers/";
const imb = "https://www.imb.sinica.edu.tw/en/careers/joblist_phd.php";

export function rikenResearchRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const rows = Array.from(html.matchAll(/<tr class="vaT">([\s\S]*?)<\/tr>/gi));
  if (!rows.length || !/Job Openings\s*\|\s*RIKEN/i.test(html)) throw new Error("RIKEN's public vacancy list was not recognized");
  return rows.flatMap(([, row]) => {
    const division = htmlToText(row.match(/<th\b[^>]*>([\s\S]*?)<\/th>/i)?.[1]);
    const cells = Array.from(row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi), ([, markup]) => markup);
    const job = cells[1]?.match(/<a href="(\/en\/careers\/researchers\/(\d{8}_\d+)\/index\.html)">([\s\S]*?)<\/a>/i);
    if (!job || !isMedicalText(division, job[3]) || /Plant Perception/i.test(division)) return [];
    const dateText = htmlToText(cells[2]);
    const deadline = /open until filled/i.test(dateText) ? "open until filled" : englishDate(dateText);
    if (!deadline || /^\d/.test(deadline) && Date.parse(deadline) + 86_400_000 < now.getTime()) return [];
    const sourceUrl = new URL(job[1], riken).href;
    const record = toPositionRecord({
      sourceRecordId: job[2],
      sourceUrl,
      applicationUrl: sourceUrl,
      title: htmlToText(job[3]),
      organization: { name: "RIKEN", type: "RESEARCH_INSTITUTE", countryCode: "JP", website: "https://www.riken.jp/en/" },
      countryCode: "JP",
      city: htmlToText(cells[3]) || null,
      deadline,
      publishedAt: job[2].replace(/^(\d{4})(\d{2})(\d{2})_\d+$/, "$1-$2-$3"),
      biomedicalPublisher: true,
    });
    return record ? [{ ...record, topicSlugs: topicSlugsFor(division), deadlineTimezone: "Asia/Tokyo" }] : [];
  });
}

export function rikenBrainScienceRecords(html: string): OpportunityIngestionRecord[] {
  const links = Array.from(html.matchAll(/href=["'](https:\/\/www\.riken\.jp\/en\/careers\/researchers\/(\d{8}_\d+)\/index\.html)["'][^>]*>([\s\S]*?)<\/a>/gi));
  if (!links.length || !/Careers\s*\|\s*RIKEN Center for Brain Science/i.test(html)) throw new Error("RIKEN Brain Science's career list was not recognized");
  return links.flatMap(([, sourceUrl, id, markup]) => {
    const record = toPositionRecord({
      sourceRecordId: id,
      sourceUrl,
      applicationUrl: sourceUrl,
      title: htmlToText(markup.match(/<p class="ttl">([\s\S]*?)<\/p>/i)?.[1] ?? markup),
      organization: { name: "RIKEN Center for Brain Science", type: "RESEARCH_INSTITUTE", countryCode: "JP", website: "https://cbs.riken.jp/en/" },
      countryCode: "JP",
      publishedAt: id.replace(/^(\d{4})(\d{2})(\d{2})_\d+$/, "$1-$2-$3"),
      biomedicalPublisher: true,
    });
    return record ? [{ ...record, topicSlugs: ["neuroscience"] }] : [];
  });
}

export function academiaSinicaRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const jobs = Array.from(html.matchAll(/href=['"](jobshow\.php\?jid=(\d+))['"][^>]*>([\s\S]*?)<\/a>/gi));
  if (!jobs.length || !/Institute of Molecular Biology/i.test(html)) throw new Error("Academia Sinica's vacancy list was not recognized");
  return jobs.flatMap(([, href, id, markup]) => {
    const text = htmlToText(markup);
    const lab = htmlToText(markup.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i)?.[1]);
    const role = text.match(/\b(Postdoctoral Fellow|Postdoctoral Researcher|Research Assistant)\b/i)?.[1];
    if (!lab || !role) return [];
    const deadline = text.match(/\b(20\d{2}-\d{2}(?:-\d{2})?)\s+Deadline\b/i)?.[1] ?? null;
    if (deadline && deadline < now.toISOString().slice(0, deadline.length)) return [];
    const url = new URL(href, imb).href;
    const record = toPositionRecord({
      sourceRecordId: id,
      sourceUrl: url,
      applicationUrl: url,
      title: `${role} — ${lab}`,
      organization: { name: "Academia Sinica, Institute of Molecular Biology", type: "RESEARCH_INSTITUTE", countryCode: "TW", website: "https://www.imb.sinica.edu.tw/en/" },
      countryCode: "TW",
      city: "Taipei",
      deadline,
      biomedicalPublisher: true,
    });
    return record ? [{ ...record, deadlineTimezone: "Asia/Taipei", topicSlugs: topicSlugsFor(text) }] : [];
  });
}

export const pacificResearchCareerSources: OpportunitySourceConnector[] = [
  {
    id: "riken-medical-research",
    source: { type: "INSTITUTIONAL_CAREERS", name: "RIKEN Research Careers", verified: true },
    kind: "positions",
    homepage: riken,
    description: "Recent biomedical research vacancies on Japan’s RIKEN public job list.",
    completeSnapshot: false,
    intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch, now }) {
      const [read, readCbs] = await Promise.all([openPublisher(fetch, riken), openPublisher(fetch, cbs)]);
      const [main, neuroscience] = await Promise.all([read(riken), readCbs(cbs)]);
      // The institute may publish the same appointment on both boards.
      return [...new Map([...rikenBrainScienceRecords(neuroscience), ...rikenResearchRecords(main, now)]
        .map((record) => [record.sourceRecordId, record])).values()];
    },
  },
  {
    id: "academia-sinica-molecular-biology",
    source: { type: "INSTITUTIONAL_CAREERS", name: "Academia Sinica Molecular Biology Careers", verified: true },
    kind: "positions",
    homepage: imb,
    description: "Postdoctoral and research posts in molecular biology from Academia Sinica in Taiwan.",
    completeSnapshot: true,
    allowEmptySnapshot: true,
    staleGraceHours: 24,
    intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, imb);
      return academiaSinicaRecords(await read(imb), now);
    },
  },
];
