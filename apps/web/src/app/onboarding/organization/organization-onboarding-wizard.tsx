"use client";

import { DocumentManager } from "@/components/files/document-manager";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IdentityAvatar } from "@/components/identity/identity-avatar";
import { ProfileImageUpload } from "@/components/identity/profile-image-upload";
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

function emptyDraft(type: InstitutionalOrganizationType): OrganizationCreateInput {
  return {
    name: "",
    type,
    logoUrl: null,
    countryCode: null,
    website: null,
    description: null,
    contactEmail: null,
    sizeLabel: null,
    profileDetails: {},
  };
}

export function OrganizationOnboardingWizard({ initialType = "university", initialDraft, callbackUrl = "/organization/profile" }: {
  initialType?: InstitutionalOrganizationType;
  initialDraft: OrganizationCreateInput | null;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [action, setAction] = useState<"save" | "delete" | "publish" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileUploads, setFileUploads] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasSavedDraft, setHasSavedDraft] = useState(Boolean(initialDraft));
  const [publishConfirmed, setPublishConfirmed] = useState(false);
  const [draft, setDraft] = useState<OrganizationCreateInput>(initialDraft ?? emptyDraft(initialType));
  const busy = action !== null || uploading || fileUploads > 0;

  function updateDetail(key: keyof OrganizationProfileDetails, value: string) {
    setDraft((current) => ({ ...current, profileDetails: { ...current.profileDetails, [key]: value || null } }));
  }

  async function changeDraft(nextAction: "save" | "delete" | "publish") {
    if (busy || (nextAction === "publish" && (!publishConfirmed || !draft.name.trim()))) return;
    setAction(nextAction);
    setError("");
    setNotice("");
    try {
      const publishing = nextAction === "publish";
      const response = await fetch(publishing ? "/api/v1/organization" : "/api/v1/organization/draft", {
        method: publishing ? "POST" : nextAction === "save" ? "PUT" : "DELETE",
        ...(nextAction !== "delete" ? {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(draft),
        } : {}),
      });
      const result = (await response.json()) as { success: boolean; error?: { message?: string } };
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not update your institution.");
      if (publishing) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }
      setHasSavedDraft(nextAction === "save");
      if (nextAction === "delete") {
        setDraft(emptyDraft(draft.type));
        setPublishConfirmed(false);
      }
      setNotice(nextAction === "save" ? "Private draft saved to your account." : "Private draft deleted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update your institution.");
    } finally {
      setAction(null);
    }
  }

  return (
    <section className={styles.wizard}>
      <div className={styles.stage}>
        <div className={styles.stack}>
          <span className="eyebrow">Institutional context</span>
          <h2>What organization are you registering?</h2>
          <div className={styles.photoEditor}>
            <IdentityAvatar name={draft.name || "Organization"} src={draft.logoUrl} kind="organization" size="large" />
            <ProfileImageUpload kind="organization" value={draft.logoUrl} onChange={(url) => setDraft((current) => ({ ...current, logoUrl: url }))} onBusyChange={setUploading} disabled={action !== null} />
          </div>
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
              After publication, this is shown on your institutional profile. It is marked as self-reported until Provenant can
              confirm it from institutional sources.
            </small>
          </label>
        </div>

        <DocumentManager scope="organization" title="Organization documents (optional)" onBusyChange={(delta) => setFileUploads((count) => count + delta)} />
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {notice ? <p role="status">{notice}</p> : null}
        <p>Your saved draft is visible only in your account. Publishing makes your institution discoverable.</p>
        <label className={styles.visibility}>
          <input type="checkbox" checked={publishConfirmed} onChange={(event) => setPublishConfirmed(event.target.checked)} />
          <span>I represent this institution and confirm these profile details may be published.</span>
        </label>
        <footer className={styles.actions}>
          <div>
            <button type="button" className="secondary" disabled={busy} onClick={() => void changeDraft("save")}>
              {action === "save" ? "Saving…" : "Save private draft"}
            </button>
            {hasSavedDraft ? <button type="button" className="secondary" disabled={busy} onClick={() => void changeDraft("delete")}>Delete draft</button> : null}
          </div>
          <button type="button" className="primaryButton" disabled={busy || !publishConfirmed || !draft.name.trim()} onClick={() => void changeDraft("publish")}>
            {action === "publish" ? "Publishing…" : "Publish institutional profile"}
          </button>
        </footer>
      </div>
    </section>
  );
}
