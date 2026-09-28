"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InstitutionalOrganizationType, OrganizationProfileResponse, OrganizationUpdateInput } from "@/lib/api-contracts";
import styles from "./organization-profile.module.css";

const organizationTypes: Array<[InstitutionalOrganizationType, string]> = [
  ["university", "University"],
  ["hospital", "Hospital"],
  ["research-institute", "Research institute"],
  ["company", "Company"],
  ["foundation", "Foundation"],
];

export function OrganizationProfileEditor({ organization }: { organization: OrganizationProfileResponse }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<OrganizationUpdateInput>({
    name: organization.name,
    type: organization.type,
    countryCode: organization.countryCode ?? null,
    website: organization.website ?? null,
    description: organization.description ?? null,
    contactEmail: organization.contactEmail ?? null,
    sizeLabel: organization.sizeLabel ?? null,
  });

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/v1/organization", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as { success: boolean; error?: { message?: string } };
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not save institutional profile.");
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save institutional profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.editor}>
      <h2>Institutional details</h2>
      <p className={styles.editorLede}>
        These fields are self-reported by your organization&apos;s administrator and labeled as such until
        corroborated by institutional evidence (verified domain email, ROR/GRID match, or manual review).
      </p>

      <div className={styles.grid}>
        <label>
          <span>Organization name</span>
          <input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label>
          <span>Organization type</span>
          <select value={draft.type ?? organization.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as InstitutionalOrganizationType })}>
            {organizationTypes.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Country code</span>
          <input maxLength={2} value={draft.countryCode ?? ""} onChange={(e) => setDraft({ ...draft, countryCode: e.target.value.toUpperCase() || null })} />
        </label>
        <label>
          <span>Website</span>
          <input value={draft.website ?? ""} onChange={(e) => setDraft({ ...draft, website: e.target.value || null })} />
        </label>
        <label>
          <span>Contact email</span>
          <input type="email" value={draft.contactEmail ?? ""} onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value || null })} />
        </label>
        <label>
          <span>Organization size</span>
          <input value={draft.sizeLabel ?? ""} onChange={(e) => setDraft({ ...draft, sizeLabel: e.target.value || null })} placeholder="e.g. 251–1,000" />
        </label>
      </div>

      <label className={styles.fullField}>
        <span>Description</span>
        <textarea
          rows={4}
          value={draft.description ?? ""}
          onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
        />
      </label>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {saved && !error ? <p className={styles.success} role="status">Institutional profile saved.</p> : null}

      <footer className={styles.actions}>
        <button type="button" className="primaryButton" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save institutional profile"}
        </button>
      </footer>
    </section>
  );
}
