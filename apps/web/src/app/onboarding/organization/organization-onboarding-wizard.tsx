"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InstitutionalOrganizationType, OrganizationCreateInput, OrganizationProfileDetails } from "@/lib/api-contracts";
import styles from "../onboarding.module.css";

const organizationTypes: Array<[InstitutionalOrganizationType, string]> = [
  ["university", "University"],
  ["hospital", "Hospital"],
  ["laboratory", "Laboratory"],
  ["research-institute", "Research institute"],
  ["company", "Company"],
  ["foundation", "Foundation"],
];

const typeFields: Record<InstitutionalOrganizationType, Array<[keyof OrganizationProfileDetails, string, string]>> = {
  hospital: [["services", "Clinical services", "Oncology, pathology, imaging…"], ["accreditations", "Accreditations", "Clinical and research accreditations"], ["capacity", "Clinical / research capacity", "Beds, trials, research units…"]],
  laboratory: [["primaryFocus", "Research focus", "Core scientific focus"], ["facilities", "Facilities and instruments", "Sequencing, microscopy, biobank…"], ["services", "Research services", "Assays, analysis, sample processing…"]],
  university: [["primaryFocus", "Academic focus", "Primary disciplines and research areas"], ["facilities", "Research infrastructure", "Core facilities and platforms"]],
  "research-institute": [["primaryFocus", "Research programs", "Flagship programs and scientific focus"], ["facilities", "Research infrastructure", "Platforms, cohorts, core facilities…"]],
  company: [["primaryFocus", "Scientific focus", "Therapeutic area, technology, product…"], ["services", "Capabilities", "Research and development capabilities"]],
  foundation: [["fundingAreas", "Funding areas", "Diseases, methods, regions…"], ["services", "Programs", "Grants, fellowships, partnerships…"]],
};

const sizeLabels = ["1–10", "11–50", "51–250", "251–1,000", "1,000+"];

export function OrganizationOnboardingWizard() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<OrganizationCreateInput>({
    name: "",
    type: "university",
    countryCode: null,
    website: null,
    description: null,
    contactEmail: null,
    sizeLabel: null,
    profileDetails: {},
  });

  function updateDetail(key: keyof OrganizationProfileDetails, value: string) {
    setDraft((current) => ({ ...current, profileDetails: { ...current.profileDetails, [key]: value || null } }));
  }

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/v1/organization", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as { success: boolean; error?: { message?: string } };
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not register institutional profile.");
      router.push("/organization/profile");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not register institutional profile.");
      setSaving(false);
    }
  }

  return (
    <section className={styles.wizard}>
      <div className={styles.stage}>
        <div className={styles.stack}>
          <span className="eyebrow">Institutional context</span>
          <h2>What organization are you registering?</h2>
          <div className={styles.grid}>
            <label className={styles.fullField}>
              <span>Organization name</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Karolinska Institutet, Dept. of Oncology"
              />
            </label>
            <label>
              <span>Organization type</span>
              <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as InstitutionalOrganizationType })}>
                {organizationTypes.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Country code</span>
              <input
                maxLength={2}
                value={draft.countryCode ?? ""}
                onChange={(e) => setDraft({ ...draft, countryCode: e.target.value.toUpperCase() || null })}
                placeholder="e.g. SE"
              />
            </label>
            <label>
              <span>Website</span>
              <input
                value={draft.website ?? ""}
                onChange={(e) => setDraft({ ...draft, website: e.target.value || null })}
                placeholder="https://…"
              />
            </label>
            <label>
              <span>Organization size</span>
              <select value={draft.sizeLabel ?? ""} onChange={(e) => setDraft({ ...draft, sizeLabel: e.target.value || null })}>
                <option value="">Prefer not to say</option>
                {sizeLabels.map((label) => (
                  <option key={label} value={label}>{label} people</option>
                ))}
              </select>
            </label>
            <label>
              <span>Contact email</span>
              <input
                type="email"
                value={draft.contactEmail ?? ""}
                onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value || null })}
                placeholder="research-office@institution.edu"
              />
            </label>
          </div>
          <div className={styles.stack}>
            <h3>{organizationTypes.find(([value]) => value === draft.type)?.[1]} profile details</h3>
            <div className={styles.grid}>
              {typeFields[draft.type].map(([key, label, placeholder]) => (
                <label key={key}><span>{label}</span><input value={draft.profileDetails?.[key] ?? ""} onChange={(event) => updateDetail(key, event.target.value)} placeholder={placeholder} /></label>
              ))}
            </div>
          </div>
          <label className={styles.fullField}>
            <span>Description</span>
            <input
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
              placeholder="What this institution or lab focuses on"
            />
            <small>
              Shown on your public institutional profile. This is a self-reported description — it is
              labeled as unverified until Studepartment corroborates it against institutional evidence.
            </small>
          </label>
        </div>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <footer className={styles.actions}>
          <span />
          <button type="button" className="primaryButton" disabled={saving || !draft.name.trim()} onClick={submit}>
            {saving ? "Registering…" : "Create institutional profile"}
          </button>
        </footer>
      </div>
    </section>
  );
}
