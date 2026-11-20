import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText, methodSlugsFor, topicSlugsFor } from "./classify";
import { mapWithConcurrency } from "./http";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://study.uq.edu.au/study-options/phd-mphil-professional-doctorate/projects";
const maxPages = 12;

type Project = { url: string; title: string; description: string; fields: string };

export function queenslandProjectPage(html: string) {
  const origin = new URL(homepage);
  const projects = [...html.matchAll(/<div\s+about="([^"]+)"\s+class="listing listing--bordered"[^>]*>([\s\S]*?)<\/a>/gi)]
    .filter(([, path]) => path.startsWith(origin.pathname + "/"))
    .map(([, path, body]): Project => ({
      url: new URL(path, origin).href,
      title: htmlToText(body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]),
      description: htmlToText(body.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]),
      fields: htmlToText(body.match(/<dl[^>]*>([\s\S]*?)<\/dl>/i)?.[1]),
    }));
  const nextPath = html.match(/<a\s+href="(\?page=\d+)"\s+class="uq-pagination__item uq-pagination__next"/i)?.[1];
  if (!projects.length && !/no results|no projects found/i.test(html)) throw new Error("Unrecognized UQ project list");
  return { projects, next: nextPath ? new URL(nextPath, origin).href : null };
}

export function fundedQueenslandProject(project: Project, html: string, now: Date): OpportunityIngestionRecord | null {
  const text = htmlToText(html);
  const degree = text.match(/\bProgram\s+(PhD|MPhil)\b/i)?.[1]?.toLowerCase();
  if (!degree || !/this project is supported by|this scholarship includes|scholarship provides/i.test(text)) return null;
  const instructions = htmlToText(html.match(/\bexpression of interest\s*\(EOI\)\s+by\s+([\s\S]*?)<\/p>/i)?.[1]);
  const dates = [...instructions.matchAll(/\b(\d{1,2}) ([A-Za-z]+),? (20\d{2})\b/g)]
    .map(([, day, month, year]) => englishDate(`${day} ${month} ${year}`))
    .filter((value): value is string => Boolean(value))
    .sort();
  const deadline = dates.at(-1);
  if (!deadline || deadline < new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(now)) return null;
  const code = text.match(/Scholarship Code Listed in the Advertisement:\s*([A-Z0-9-]{5,})\b/)?.[1];
  return {
    sourceRecordId: code ?? new URL(project.url).pathname.split("/").at(-1)!,
    sourceUrl: project.url,
    applicationUrl: project.url,
    type: degree === "phd" ? "PHD_SCHOLARSHIP" : "MASTERS_SCHOLARSHIP",
    title: project.title,
    description: "A funded research project offered by the University of Queensland. See the university listing for stipend, supervisor and eligibility details. Application deadlines may differ by fee status.",
    organization: { name: "The University of Queensland", type: "UNIVERSITY", countryCode: "AU", website: "https://www.uq.edu.au" },
    countryCode: "AU",
    deadline,
    deadlineTimezone: "Australia/Brisbane",
    topicSlugs: topicSlugsFor(project.title + " " + project.description),
    methodSlugs: methodSlugsFor(project.title + " " + project.description),
    status: "ACTIVE",
  };
}

export const queenslandFundedProjectsSource: OpportunitySourceConnector = {
  id: "uq-funded-biomedical-projects",
  source: { type: "INSTITUTIONAL_CAREERS", name: "University of Queensland funded projects", verified: true },
  kind: "scholarships",
  homepage,
  description: "Funded biomedical PhD and MPhil projects with a current published application deadline, direct from the University of Queensland.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  intervalMinutes: 720,
  staleGraceHours: 72,
  isEnabled: () => true,
  async collect({ fetch, now, log }) {
    const read = await openPublisher(fetch, homepage);
    const projects = new Map<string, Project>();
    let url: string | null = homepage;
    for (let page = 0; url && page < maxPages; page += 1) {
      const result = queenslandProjectPage(await read(url));
      for (const project of result.projects) {
        if (project.title && isMedicalText(project.title, project.description, project.fields)) projects.set(project.url, project);
      }
      url = result.next;
    }
    if (url) throw new Error("The UQ biomedical project list exceeded the page budget");
    let failed = 0;
    const records = await mapWithConcurrency([...projects.values()], 4, async (project) => {
      try {
        return fundedQueenslandProject(project, await read(project.url), now);
      } catch {
        failed += 1;
        return null;
      }
    });
    if (failed > projects.size / 4) throw new Error("Too many UQ detail pages were unavailable");
    const unique = new Map<string, OpportunityIngestionRecord>();
    for (const record of records) if (record) unique.set(record.sourceRecordId, record);
    log(`UQ: ${unique.size} funded projects from ${projects.size} biomedical project pages`);
    return [...unique.values()];
  },
};
