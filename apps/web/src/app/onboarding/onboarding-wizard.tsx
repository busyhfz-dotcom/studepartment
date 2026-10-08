"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CollaborationGoalValue, IndividualProfileDetails, IndividualProfileRole, OrganizationOption, ProfileResponse, ProfileUpdateInput } from "@/lib/api-contracts";
import styles from "./onboarding.module.css";

const topics = [
  ["oncology", "Oncology"],
  ["cancer-immunotherapy", "Cancer immunotherapy"],
  ["biomarkers", "Biomarkers"],
  ["clinical-trials", "Clinical trials"],
  ["computational-oncology", "Computational oncology"],
] as const;
const methods = [
  ["clinical-trial-design", "Clinical trial design"],
  ["translational-research", "Translational research"],
  ["biomarker-analysis", "Biomarker analysis"],
  ["machine-learning", "Machine learning"],
] as const;
const goals: Array<[CollaborationGoalValue, string]> = [
  ["research-collaboration", "Research collaboration"],
  ["mentorship", "Mentorship"],
  ["student-supervision", "Student supervision"],
  ["clinical-project", "Clinical project"],
  ["grant-partnership", "Grant partnership"],
  ["position-opportunities", "Position opportunities"],
];

function initialGoal(label: string): CollaborationGoalValue | null {
  const candidate = label.toLowerCase().replaceAll(" ", "-") as CollaborationGoalValue;
  return goals.some(([value]) => value === candidate) ? candidate : null;
}

export function OnboardingWizard({ profile, organizations }: { profile: ProfileResponse; organizations: OrganizationOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ProfileUpdateInput>({
    fullName: profile.fullName,
    headline: profile.headline,
    careerStage: profile.careerStage,
    organizationId: profile.organizationId ?? null,
    city: profile.city ?? null,
    countryCode: profile.countryCode ?? null,
    topicSlugs: profile.topicSlugs ?? [],
    methodSlugs: profile.methodSlugs ?? [],
    collaborationGoals: profile.collaborationGoals.map(initialGoal).filter((value): value is CollaborationGoalValue => Boolean(value)),
    availability: profile.availability,
    profilePublic: profile.profilePublic ?? true,
    orcid: profile.orcid ?? null,
    accountRole: profile.accountRole,
    profileDetails: profile.profileDetails ?? {},
  });

  const steps = useMemo(() => ["Context", "Research focus", "Collaboration", "Trust & visibility"], []);

  function toggleList(key: "topicSlugs" | "methodSlugs" | "collaborationGoals", value: string) {
    setDraft((current) => {
      const existing = (current[key] ?? []) as string[];
      const next = existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value];
      return { ...current, [key]: next };
    });
  }

  function updateDetail(key: keyof IndividualProfileDetails, value: string) {
    setDraft((current) => ({
      ...current,
      profileDetails: { ...current.profileDetails, [key]: value || null },
    }));
  }

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as { success: boolean; error?: { message?: string } };
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not save scientific identity.");
      router.push("/profile");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save scientific identity.");
      setSaving(false);
    }
  }

  return (
    <section className={styles.wizard}>
      <nav className={styles.progress} aria-label="Onboarding progress">
        {steps.map((label, index) => (
          <button key={label} type="button" className={index === step ? styles.activeStep : ""} onClick={() => index < step && setStep(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>{label}
          </button>
        ))}
      </nav>

      <div className={styles.stage}>
        {step === 0 ? (
          <div className={styles.stack}>
            <span className="eyebrow">Step 1 · Scientific context</span>
            <h2>Who are you in the research ecosystem?</h2>
            <div className={styles.grid}>
              <label><span>Full name</span><input value={draft.fullName ?? ""} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} /></label>
              <label><span>Your role</span><select value={draft.accountRole ?? "researcher"} onChange={(e) => setDraft({ ...draft, accountRole: e.target.value as IndividualProfileRole })}><option value="student">Student</option><option value="researcher">Researcher</option><option value="professor">Professor / faculty</option></select></label>
              <label><span>Headline</span><input value={draft.headline ?? ""} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} /></label>
              <label><span>Career stage / title</span><input value={draft.careerStage ?? ""} onChange={(e) => setDraft({ ...draft, careerStage: e.target.value })} /></label>
              <label><span>Institution</span><select value={draft.organizationId ?? ""} onChange={(e) => setDraft({ ...draft, organizationId: e.target.value || null })}><option value="">Independent / not listed</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}{org.verified ? " · verified" : ""}</option>)}</select></label>
              <label><span>City</span><input value={draft.city ?? ""} onChange={(e) => setDraft({ ...draft, city: e.target.value || null })} /></label>
              <label><span>Country code</span><input maxLength={2} value={draft.countryCode ?? ""} onChange={(e) => setDraft({ ...draft, countryCode: e.target.value.toUpperCase() || null })} /></label>
              {draft.accountRole === "student" ? <><label><span>Degree program</span><input value={draft.profileDetails?.degreeProgram ?? ""} onChange={(e) => updateDetail("degreeProgram", e.target.value)} placeholder="PhD, MSc, MD…" /></label><label><span>Expected graduation</span><input value={draft.profileDetails?.graduationYear ?? ""} onChange={(e) => updateDetail("graduationYear", e.target.value)} placeholder="2028" /></label><label className={styles.fullField}><span>Thesis / dissertation topic</span><input value={draft.profileDetails?.thesisTopic ?? ""} onChange={(e) => updateDetail("thesisTopic", e.target.value)} /></label></> : null}
              {draft.accountRole !== "student" ? <><label><span>Academic title</span><input value={draft.profileDetails?.academicTitle ?? ""} onChange={(e) => updateDetail("academicTitle", e.target.value)} placeholder="Assistant professor, PI…" /></label><label><span>Department</span><input value={draft.profileDetails?.department ?? ""} onChange={(e) => updateDetail("department", e.target.value)} /></label></> : null}
              {draft.accountRole === "professor" ? <label className={styles.fullField}><span>Student supervision</span><select value={draft.profileDetails?.supervisionStatus ?? ""} onChange={(e) => updateDetail("supervisionStatus", e.target.value)}><option value="">Not specified</option><option value="accepting">Accepting students</option><option value="selective">Selective</option><option value="closed">Not accepting students</option></select></label> : null}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className={styles.stack}>
            <span className="eyebrow">Step 2 · Research focus</span><h2>Choose the topics and methods that describe your actual work.</h2>
            <div className={styles.choiceColumns}>
              <div><h3>Topics</h3>{topics.map(([value, label]) => <button type="button" key={value} className={(draft.topicSlugs ?? []).includes(value) ? styles.selected : ""} onClick={() => toggleList("topicSlugs", value)}>{label}</button>)}</div>
              <div><h3>Methods</h3>{methods.map(([value, label]) => <button type="button" key={value} className={(draft.methodSlugs ?? []).includes(value) ? styles.selected : ""} onClick={() => toggleList("methodSlugs", value)}>{label}</button>)}</div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className={styles.stack}>
            <span className="eyebrow">Step 3 · Collaboration intent</span><h2>Tell the system what kinds of introductions are useful.</h2>
            <div className={styles.choices}>{goals.map(([value, label]) => <button type="button" key={value} className={(draft.collaborationGoals ?? []).includes(value) ? styles.selected : ""} onClick={() => toggleList("collaborationGoals", value)}>{label}</button>)}</div>
            <label className={styles.fullField}><span>Availability</span><select value={draft.availability ?? "selective"} onChange={(e) => setDraft({ ...draft, availability: e.target.value as ProfileResponse["availability"] })}><option value="open">Open</option><option value="selective">Selective</option><option value="quiet">Quiet mode</option><option value="closed">Not accepting requests</option></select></label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className={styles.stack}>
            <span className="eyebrow">Step 4 · Trust & visibility</span><h2>Keep assertions separate from verified scientific evidence.</h2>
            <label className={styles.fullField}><span>ORCID iD (optional)</span><input placeholder="0000-0000-0000-0000" value={draft.orcid ?? ""} onChange={(e) => setDraft({ ...draft, orcid: e.target.value || null })} /><small>Manual entry is an assertion. Verification will require the authorized ORCID flow.</small></label>
            <label className={styles.visibility}><input type="checkbox" checked={draft.profilePublic ?? true} onChange={(e) => setDraft({ ...draft, profilePublic: e.target.checked })} /><span><strong>Public scientific profile</strong><small>Make this identity discoverable to other researchers.</small></span></label>
          </div>
        ) : null}

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <footer className={styles.actions}>
          <button type="button" className="secondaryButton" disabled={step === 0 || saving} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</button>
          {step < steps.length - 1 ? <button type="button" className="primaryButton" onClick={() => setStep((value) => value + 1)}>Continue</button> : <button type="button" className="primaryButton" disabled={saving} onClick={finish}>{saving ? "Saving…" : "Create scientific identity"}</button>}
        </footer>
      </div>
    </section>
  );
}
