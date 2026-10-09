import type { IndividualProfileDetails, ProfileRecognitionEntry, ProfileTimelineEntry } from "@/lib/api-contracts";
import type { ReactNode } from "react";
import styles from "./professional-profile-sections.module.css";

function ExternalTitle({ href, children }: { href?: string | null; children: ReactNode }) {
  return href ? <a href={href} rel="noreferrer" target="_blank">{children} <span aria-hidden="true">↗</span></a> : <strong>{children}</strong>;
}

function Timeline({ title, items }: { title: string; items?: ProfileTimelineEntry[] }) {
  if (!items?.length) return null;
  return <section className={styles.panel}><span className="sectionLabel">{title}</span><div className={styles.timeline}>{items.map((item, index) => <article key={`${item.title}-${index}`}><i /><div><ExternalTitle href={item.url}>{item.title}</ExternalTitle><p className={styles.meta}>{[item.organization, item.period].filter(Boolean).join(" · ")}</p>{item.description ? <p>{item.description}</p> : null}</div></article>)}</div></section>;
}

function Recognition({ title, items }: { title: string; items?: ProfileRecognitionEntry[] }) {
  if (!items?.length) return null;
  return <section className={styles.panel}><span className="sectionLabel">{title}</span><div className={styles.cardList}>{items.map((item, index) => <article key={`${item.title}-${index}`}><ExternalTitle href={item.url}>{item.title}</ExternalTitle><small>{[item.issuer, item.year].filter(Boolean).join(" · ")}</small>{item.description ? <p>{item.description}</p> : null}</article>)}</div></section>;
}

export function ProfessionalProfileSections({ details }: { details?: IndividualProfileDetails }) {
  if (!details) return null;
  const hasContent = Boolean(details.experience?.length || details.education?.length || details.projects?.length || details.awards?.length || details.grants?.length || details.skills?.length || details.languages?.length || details.memberships?.length || details.teaching?.length || details.peerReview?.length || Object.values(details.links ?? {}).some(Boolean) || details.careerPreferences?.targetRoles?.length || details.careerPreferences?.targetCountries?.length || details.careerPreferences?.opportunityTypes?.length);
  if (!hasContent) return null;
  const links = Object.entries(details.links ?? {}).filter((entry): entry is [string, string] => Boolean(entry[1]));
  const labelForLink: Record<string, string> = { website: "Website", cv: "CV / résumé", linkedin: "LinkedIn", researchGate: "ResearchGate", googleScholar: "Google Scholar", github: "GitHub / portfolio" };
  return <div className={styles.shell}>
    <div className={styles.heading}><div><span className="sectionLabel">Professional profile</span><h2>Experience, work and career context</h2></div><span>Free profile</span></div>
    <div className={styles.grid}>
      <Timeline title="Experience" items={details.experience} />
      <Timeline title="Education & training" items={details.education} />
      {details.projects?.length ? <section className={styles.panel}><span className="sectionLabel">Projects & portfolio</span><div className={styles.cardList}>{details.projects.map((item, index) => <article key={`${item.title}-${index}`}><ExternalTitle href={item.url}>{item.title}</ExternalTitle><small>{[item.role, item.status].filter(Boolean).join(" · ")}</small>{item.description ? <p>{item.description}</p> : null}</article>)}</div></section> : null}
      <Recognition title="Awards & honors" items={details.awards} />
      <Recognition title="Grants & funded work" items={details.grants} />
      {details.skills?.length || details.languages?.length ? <section className={styles.panel}><span className="sectionLabel">Skills & languages</span>{details.skills?.length ? <div className={styles.tags}>{details.skills.map((item) => <span key={item}>{item}</span>)}</div> : null}{details.languages?.length ? <div className={styles.languages}>{details.languages.map((item) => <span key={item.name}><strong>{item.name}</strong>{item.proficiency ? <small>{item.proficiency}</small> : null}</span>)}</div> : null}</section> : null}
      {details.memberships?.length || details.teaching?.length || details.peerReview?.length ? <section className={styles.panel}><span className="sectionLabel">Academic service</span><div className={styles.service}>{details.memberships?.length ? <div><strong>Memberships</strong><p>{details.memberships.join(" · ")}</p></div> : null}{details.teaching?.length ? <div><strong>Teaching & supervision</strong><p>{details.teaching.join(" · ")}</p></div> : null}{details.peerReview?.length ? <div><strong>Peer review & editorial</strong><p>{details.peerReview.join(" · ")}</p></div> : null}</div></section> : null}
      {links.length ? <section className={styles.panel}><span className="sectionLabel">Scientific footprint</span><div className={styles.links}>{links.map(([key, href]) => <a href={href} rel="noreferrer" target="_blank" key={key}>{labelForLink[key] ?? key} <span>↗</span></a>)}</div></section> : null}
      {details.careerPreferences && (details.careerPreferences.targetRoles?.length || details.careerPreferences.targetCountries?.length || details.careerPreferences.opportunityTypes?.length || details.careerPreferences.remotePreference || details.careerPreferences.relocation) ? <section className={styles.panel}><span className="sectionLabel">Opportunity preferences</span><div className={styles.preferences}>{details.careerPreferences.targetRoles?.length ? <div><small>Target roles</small><strong>{details.careerPreferences.targetRoles.join(" · ")}</strong></div> : null}{details.careerPreferences.targetCountries?.length ? <div><small>Locations</small><strong>{details.careerPreferences.targetCountries.join(" · ")}</strong></div> : null}{details.careerPreferences.opportunityTypes?.length ? <div><small>Opportunity types</small><strong>{details.careerPreferences.opportunityTypes.join(" · ")}</strong></div> : null}{details.careerPreferences.remotePreference ? <div><small>Work mode</small><strong>{details.careerPreferences.remotePreference}</strong></div> : null}{details.careerPreferences.relocation ? <div><small>Relocation</small><strong>{details.careerPreferences.relocation}</strong></div> : null}</div></section> : null}
    </div>
  </div>;
}
