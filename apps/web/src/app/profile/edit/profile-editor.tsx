"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import type {
  CollaborationGoalValue,
  OrganizationOption,
  ProfileResponse,
  ProfileUpdateInput,
} from "@/lib/api-contracts";
import styles from "./page.module.css";

const topicOptions = [
  ["oncology", "Oncology"],
  ["cancer-immunotherapy", "Cancer immunotherapy"],
  ["biomarkers", "Biomarkers"],
  ["clinical-trials", "Clinical trials"],
  ["computational-oncology", "Computational oncology"],
] as const;

const methodOptions = [
  ["clinical-trial-design", "Clinical trial design"],
  ["translational-research", "Translational research"],
  ["biomarker-analysis", "Biomarker analysis"],
  ["machine-learning", "Machine learning"],
] as const;

const collaborationOptions: Array<[CollaborationGoalValue, string]> = [
  ["research-collaboration", "Research collaboration"],
  ["mentorship", "Mentorship"],
  ["student-supervision", "Student supervision"],
  ["clinical-project", "Clinical project"],
  ["grant-partnership", "Grant partnership"],
  ["position-opportunities", "Position opportunities"],
];

function collaborationValueFromLabel(label: string): CollaborationGoalValue | null {
  const value = label.trim().toLowerCase().replaceAll(" ", "-");
  return collaborationOptions.some(([candidate]) => candidate === value)
    ? (value as CollaborationGoalValue)
    : null;
}

function checkedValues(form: FormData, key: string) {
  return form.getAll(key).map(String);
}

export function ProfileEditor({
  profile,
  organizations,
}: {
  profile: ProfileResponse;
  organizations: OrganizationOption[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const collaborationDefaults = useMemo(
    () => new Set(profile.collaborationGoals.map(collaborationValueFromLabel).filter(Boolean)),
    [profile.collaborationGoals],
  );
  const topicDefaults = useMemo(() => new Set(profile.topicSlugs ?? []), [profile.topicSlugs]);
  const methodDefaults = useMemo(() => new Set(profile.methodSlugs ?? []), [profile.methodSlugs]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload: ProfileUpdateInput = {
      fullName: String(form.get("fullName") ?? ""),
      headline: String(form.get("headline") ?? "") || null,
      bio: String(form.get("bio") ?? "") || null,
      city: String(form.get("city") ?? "") || null,
      countryCode: String(form.get("countryCode") ?? "") || null,
      careerStage: String(form.get("careerStage") ?? "") || null,
      organizationId: String(form.get("organizationId") ?? "") || null,
      orcid: String(form.get("orcid") ?? "") || null,
      availability: String(form.get("availability") ?? "selective") as ProfileResponse["availability"],
      profilePublic: form.get("profilePublic") === "on",
      collaborationGoals: checkedValues(form, "collaborationGoals") as CollaborationGoalValue[],
      topicSlugs: checkedValues(form, "topicSlugs"),
      methodSlugs: checkedValues(form, "methodSlugs"),
    };

    try {
      const response = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as
        | { success: true; data: ProfileResponse }
        | { success: false; error: { message: string } };

      if (!response.ok || !result.success) {
        throw new Error(result.success ? "Profile update failed." : result.error.message);
      }

      setStatus("success");
      setMessage("Scientific identity saved. Provenance for these edits has been recorded.");
      router.refresh();
      router.push("/profile");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Profile update failed.");
    }
  }

  return (
    <form className={styles.editorCard} onSubmit={submit}>
      <section className={styles.editorSection}>
        <span className="sectionLabel">Identity</span>
        <div className={styles.editorGrid}>
          <label className={styles.fieldGroup}>
            <span>Full name</span>
            <input name="fullName" defaultValue={profile.fullName} maxLength={160} required />
          </label>
          <label className={styles.fieldGroup}>
            <span>Headline</span>
            <input name="headline" defaultValue={profile.headline} maxLength={220} />
          </label>
          <label className={styles.fieldGroup}>
            <span>Career stage / title</span>
            <input name="careerStage" defaultValue={profile.careerStage} maxLength={120} />
          </label>
          <label className={styles.fieldGroup}>
            <span>Current institution</span>
            <select name="organizationId" defaultValue={profile.organizationId ?? ""}>
              <option value="">Independent / not listed</option>
              {organizations.map((organization) => (
                <option value={organization.id} key={organization.id}>
                  {organization.name}{organization.verified ? " · verified" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.fieldGroup}>
            <span>City</span>
            <input name="city" defaultValue={profile.city ?? ""} maxLength={120} />
          </label>
          <label className={styles.fieldGroup}>
            <span>Country code</span>
            <input name="countryCode" defaultValue={profile.countryCode ?? ""} maxLength={2} placeholder="DE" />
          </label>
          <label className={styles.fieldGroup}>
            <span>Availability</span>
            <select name="availability" defaultValue={profile.availability}>
              <option value="open">Open</option>
              <option value="selective">Selective</option>
              <option value="quiet">Quiet mode</option>
              <option value="closed">Not accepting requests</option>
            </select>
          </label>
        </div>
      </section>

      <section className={styles.editorSection}>
        <span className="sectionLabel">Research summary</span>
        <label className={styles.fieldGroup}>
          <span>Summary</span>
          <textarea name="bio" defaultValue={profile.bio ?? ""} rows={6} maxLength={3000} />
        </label>
      </section>

      <section className={styles.editorSection}>
        <span className="sectionLabel">Research focus</span>
        <p className={styles.sectionHelp}>Use canonical topics and methods so discovery can work on structured scientific data rather than free-text keywords.</p>
        <div className={styles.choiceColumns}>
          <fieldset className={styles.choiceGroup}>
            <legend>Topics</legend>
            {topicOptions.map(([value, label]) => (
              <label key={value} className={styles.checkRow}>
                <input type="checkbox" name="topicSlugs" value={value} defaultChecked={topicDefaults.has(value)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className={styles.choiceGroup}>
            <legend>Methods</legend>
            {methodOptions.map(([value, label]) => (
              <label key={value} className={styles.checkRow}>
                <input type="checkbox" name="methodSlugs" value={value} defaultChecked={methodDefaults.has(value)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </section>

      <section className={styles.editorSection}>
        <span className="sectionLabel">Collaboration intent</span>
        <div className={styles.choiceGrid}>
          {collaborationOptions.map(([value, label]) => (
            <label key={value} className={styles.checkRow}>
              <input type="checkbox" name="collaborationGoals" value={value} defaultChecked={collaborationDefaults.has(value)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className={`${styles.editorSection} ${styles.editorSplit}`}>
        <div>
          <span className="sectionLabel">ORCID</span>
          <label className={styles.fieldGroup}>
            <span>ORCID iD</span>
            <input name="orcid" defaultValue={profile.orcid ?? ""} placeholder="0000-0000-0000-0000" />
          </label>
          <p className={styles.sourceNotice}>Manual entry is recorded as an assertion, not verification. Verified ORCID status requires the authorized ORCID import flow.</p>
        </div>
        <div>
          <span className="sectionLabel">Visibility</span>
          <label className={styles.visibilityToggle}>
            <input name="profilePublic" type="checkbox" defaultChecked={profile.profilePublic ?? true} />
            <span>
              <strong>Public scientific profile</strong>
              <small>Allow the profile to appear in researcher discovery.</small>
            </span>
          </label>
        </div>
      </section>

      <footer className={styles.editorActions}>
        <div>
          <span>Every saved edit is attached to the authenticated user and recorded with provenance.</span>
          {message ? <p className={status === "error" ? styles.errorMessage : styles.successMessage}>{message}</p> : null}
        </div>
        <button className="primaryButton" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save scientific identity"}
        </button>
      </footer>
    </form>
  );
}
