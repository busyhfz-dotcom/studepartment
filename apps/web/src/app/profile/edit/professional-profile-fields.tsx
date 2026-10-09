"use client";

import type {
  IndividualProfileDetails,
  ProfileLanguageEntry,
  ProfileProjectEntry,
  ProfileRecognitionEntry,
  ProfileTimelineEntry,
} from "@/lib/api-contracts";
import { useState } from "react";
import styles from "./page.module.css";

type Props = {
  value: IndividualProfileDetails;
  onChange: (next: IndividualProfileDetails) => void;
};

function lines(value: string[] | undefined) {
  return value?.join("\n") ?? "";
}

function parseLines(value: string) {
  return Array.from(new Set(value.split("\n").map((item) => item.trim()).filter(Boolean)));
}

function TextList({ label, hint, value, onChange }: { label: string; hint: string; value?: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState(() => lines(value));
  return (
    <label className={styles.fieldGroup}>
      <span>{label}</span>
      <textarea rows={4} value={draft} onChange={(event) => { setDraft(event.target.value); onChange(parseLines(event.target.value)); }} placeholder={hint} />
      <small>One item per line.</small>
    </label>
  );
}

function TimelineEditor({ title, addLabel, entries, onChange }: { title: string; addLabel: string; entries: ProfileTimelineEntry[]; onChange: (next: ProfileTimelineEntry[]) => void }) {
  const update = (index: number, field: keyof ProfileTimelineEntry, value: string) => onChange(entries.map((entry, current) => current === index ? { ...entry, [field]: value || null } : entry));
  return (
    <div className={styles.collection}>
      <div className={styles.collectionHead}><h3>{title}</h3><button type="button" onClick={() => onChange([...entries, { title: "" }])}>+ {addLabel}</button></div>
      {entries.length ? entries.map((entry, index) => (
        <div className={styles.collectionRow} key={`${title}-${index}`}>
          <input aria-label={`${title} title`} value={entry.title} onChange={(event) => update(index, "title", event.target.value)} placeholder="Title or degree" />
          <input aria-label={`${title} organization`} value={entry.organization ?? ""} onChange={(event) => update(index, "organization", event.target.value)} placeholder="Institution or organization" />
          <input aria-label={`${title} period`} value={entry.period ?? ""} onChange={(event) => update(index, "period", event.target.value)} placeholder="2022 – present" />
          <input aria-label={`${title} link`} type="url" value={entry.url ?? ""} onChange={(event) => update(index, "url", event.target.value)} placeholder="Supporting link (optional)" />
          <textarea aria-label={`${title} description`} rows={2} value={entry.description ?? ""} onChange={(event) => update(index, "description", event.target.value)} placeholder="Responsibilities, methods, outcomes or evidence" />
          <button className={styles.removeButton} type="button" onClick={() => onChange(entries.filter((_, current) => current !== index))}>Remove</button>
        </div>
      )) : <p className={styles.emptyCollection}>Nothing added yet. This section remains hidden on the public profile until it has content.</p>}
    </div>
  );
}

function ProjectEditor({ entries, onChange }: { entries: ProfileProjectEntry[]; onChange: (next: ProfileProjectEntry[]) => void }) {
  const update = (index: number, field: keyof ProfileProjectEntry, value: string) => onChange(entries.map((entry, current) => current === index ? { ...entry, [field]: value || null } : entry));
  return (
    <div className={styles.collection}>
      <div className={styles.collectionHead}><h3>Projects and portfolio</h3><button type="button" onClick={() => onChange([...entries, { title: "" }])}>+ Add project</button></div>
      {entries.map((entry, index) => <div className={styles.collectionRow} key={`project-${index}`}>
        <input value={entry.title} onChange={(event) => update(index, "title", event.target.value)} placeholder="Project title" />
        <input value={entry.role ?? ""} onChange={(event) => update(index, "role", event.target.value)} placeholder="Your role" />
        <input value={entry.status ?? ""} onChange={(event) => update(index, "status", event.target.value)} placeholder="Active, completed, recruiting…" />
        <input type="url" value={entry.url ?? ""} onChange={(event) => update(index, "url", event.target.value)} placeholder="Project link" />
        <textarea rows={2} value={entry.description ?? ""} onChange={(event) => update(index, "description", event.target.value)} placeholder="Goal, methods and your contribution" />
        <button className={styles.removeButton} type="button" onClick={() => onChange(entries.filter((_, current) => current !== index))}>Remove</button>
      </div>)}
      {!entries.length ? <p className={styles.emptyCollection}>Show research, clinical, open-source and translational projects here.</p> : null}
    </div>
  );
}

function RecognitionEditor({ title, addLabel, entries, onChange }: { title: string; addLabel: string; entries: ProfileRecognitionEntry[]; onChange: (next: ProfileRecognitionEntry[]) => void }) {
  const update = (index: number, field: keyof ProfileRecognitionEntry, value: string) => onChange(entries.map((entry, current) => current === index ? { ...entry, [field]: value || null } : entry));
  return (
    <div className={styles.collection}>
      <div className={styles.collectionHead}><h3>{title}</h3><button type="button" onClick={() => onChange([...entries, { title: "" }])}>+ {addLabel}</button></div>
      {entries.map((entry, index) => <div className={styles.collectionRow} key={`${title}-${index}`}>
        <input value={entry.title} onChange={(event) => update(index, "title", event.target.value)} placeholder="Title" />
        <input value={entry.issuer ?? ""} onChange={(event) => update(index, "issuer", event.target.value)} placeholder="Issuer or funder" />
        <input value={entry.year ?? ""} onChange={(event) => update(index, "year", event.target.value)} placeholder="Year / period" />
        <input type="url" value={entry.url ?? ""} onChange={(event) => update(index, "url", event.target.value)} placeholder="Evidence link" />
        <textarea rows={2} value={entry.description ?? ""} onChange={(event) => update(index, "description", event.target.value)} placeholder="Context, role, amount or outcome" />
        <button className={styles.removeButton} type="button" onClick={() => onChange(entries.filter((_, current) => current !== index))}>Remove</button>
      </div>)}
      {!entries.length ? <p className={styles.emptyCollection}>Nothing added yet.</p> : null}
    </div>
  );
}

function LanguageEditor({ entries, onChange }: { entries: ProfileLanguageEntry[]; onChange: (next: ProfileLanguageEntry[]) => void }) {
  return (
    <div className={styles.collection}>
      <div className={styles.collectionHead}><h3>Languages</h3><button type="button" onClick={() => onChange([...entries, { name: "", proficiency: "" }])}>+ Add language</button></div>
      <div className={styles.compactRows}>
        {entries.map((entry, index) => <div key={`language-${index}`}>
          <input value={entry.name} onChange={(event) => onChange(entries.map((item, current) => current === index ? { ...item, name: event.target.value } : item))} placeholder="Language" />
          <input value={entry.proficiency ?? ""} onChange={(event) => onChange(entries.map((item, current) => current === index ? { ...item, proficiency: event.target.value } : item))} placeholder="Native, fluent, professional…" />
          <button className={styles.removeButton} type="button" onClick={() => onChange(entries.filter((_, current) => current !== index))}>Remove</button>
        </div>)}
      </div>
    </div>
  );
}

export function ProfessionalProfileFields({ value, onChange }: Props) {
  const set = <K extends keyof IndividualProfileDetails>(key: K, next: IndividualProfileDetails[K]) => onChange({ ...value, [key]: next });
  const links = value.links ?? {};
  const preferences = value.careerPreferences ?? {};

  return (
    <>
      <section className={styles.editorSection}>
        <div className={styles.sectionHead}>
          <div><span className="sectionLabel">Professional profile · free</span><h2>Experience, education and portfolio</h2></div>
          <p>Build the complete profile researchers and organizations expect. These standard profile features remain free.</p>
        </div>
        <div className={styles.freeBadge}>Included in every account · no subscription required</div>
        <TimelineEditor title="Experience" addLabel="Add experience" entries={value.experience ?? []} onChange={(next) => set("experience", next)} />
        <TimelineEditor title="Education and training" addLabel="Add education" entries={value.education ?? []} onChange={(next) => set("education", next)} />
        <ProjectEditor entries={value.projects ?? []} onChange={(next) => set("projects", next)} />
        <div className={styles.collectionColumns}>
          <RecognitionEditor title="Awards and honors" addLabel="Add award" entries={value.awards ?? []} onChange={(next) => set("awards", next)} />
          <RecognitionEditor title="Grants and funded work" addLabel="Add grant" entries={value.grants ?? []} onChange={(next) => set("grants", next)} />
        </div>
      </section>

      <section className={styles.editorSection}>
        <div className={styles.sectionHead}>
          <div><span className="sectionLabel">Capabilities · free</span><h2>Skills, service and languages</h2></div>
          <p>Make practical capabilities searchable without turning them into a public score.</p>
        </div>
        <div className={styles.textListGrid}>
          <TextList label="Skills and techniques" hint={'R programming\nFlow cytometry\nSystematic review'} value={value.skills} onChange={(next) => set("skills", next)} />
          <TextList label="Professional memberships" hint={'ESMO\nAACR\nLocal research society'} value={value.memberships} onChange={(next) => set("memberships", next)} />
          <TextList label="Teaching and supervision" hint={'Clinical research methods lecturer\nMSc thesis supervisor'} value={value.teaching} onChange={(next) => set("teaching", next)} />
          <TextList label="Peer review and editorial service" hint={'Journal reviewer\nEditorial board service'} value={value.peerReview} onChange={(next) => set("peerReview", next)} />
        </div>
        <LanguageEditor entries={value.languages ?? []} onChange={(next) => set("languages", next)} />
      </section>

      <section className={styles.editorSection}>
        <div className={styles.sectionHead}>
          <div><span className="sectionLabel">Career readiness · free</span><h2>Links and opportunity preferences</h2></div>
          <p>Keep your scientific footprint and the opportunities you want in one profile.</p>
        </div>
        <div className={styles.editorGrid}>
          {([
            ["website", "Personal website"], ["cv", "CV / résumé link"], ["linkedin", "LinkedIn"],
            ["researchGate", "ResearchGate"], ["googleScholar", "Google Scholar"], ["github", "GitHub / code portfolio"],
          ] as const).map(([key, label]) => <label className={styles.fieldGroup} key={key}><span>{label}</span><input type="url" value={links[key] ?? ""} onChange={(event) => set("links", { ...links, [key]: event.target.value || null })} placeholder="https://…" /></label>)}
        </div>
        <div className={styles.textListGrid}>
          <TextList label="Target roles" hint={'Postdoctoral fellow\nClinical research scientist'} value={preferences.targetRoles} onChange={(next) => set("careerPreferences", { ...preferences, targetRoles: next })} />
          <TextList label="Preferred countries" hint={'Germany\nUnited Kingdom\nRemote'} value={preferences.targetCountries} onChange={(next) => set("careerPreferences", { ...preferences, targetCountries: next })} />
          <TextList label="Opportunity types" hint={'Postdoc\nGrant\nFellowship\nCollaboration'} value={preferences.opportunityTypes} onChange={(next) => set("careerPreferences", { ...preferences, opportunityTypes: next })} />
          <div className={styles.preferenceFields}>
            <label className={styles.fieldGroup}><span>Remote preference</span><select value={preferences.remotePreference ?? ""} onChange={(event) => set("careerPreferences", { ...preferences, remotePreference: event.target.value || null })}><option value="">Not specified</option><option value="on-site">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option><option value="flexible">Flexible</option></select></label>
            <label className={styles.fieldGroup}><span>Relocation</span><select value={preferences.relocation ?? ""} onChange={(event) => set("careerPreferences", { ...preferences, relocation: event.target.value || null })}><option value="">Not specified</option><option value="open">Open to relocation</option><option value="selective">Selective</option><option value="not-open">Not open</option></select></label>
          </div>
        </div>
      </section>
    </>
  );
}
