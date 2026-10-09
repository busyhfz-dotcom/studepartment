"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import type {
  CollaborationGoalValue,
  IndividualProfileDetails,
  IndividualProfileRole,
  OrganizationOption,
  ProfileResponse,
  ProfileUpdateInput,
} from "@/lib/api-contracts";
import styles from "./page.module.css";
import { IdentityAvatar } from "@/components/identity/identity-avatar";
import { ProfessionalProfileFields } from "./professional-profile-fields";

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
  const [accountRole, setAccountRole] = useState<IndividualProfileRole>(profile.accountRole);
  const [imageUrl, setImageUrl] = useState(profile.imageUrl ?? "");
  const [professionalDetails, setProfessionalDetails] = useState<IndividualProfileDetails>(profile.profileDetails ?? {});

  const collaborationDefaults = useMemo(
    () => new Set(profile.collaborationGoals.map(collaborationValueFromLabel).filter(Boolean)),
    [profile.collaborationGoals],
  );
  const topicDefaults = useMemo(() => new Set(profile.topicSlugs ?? []), [profile.topicSlugs]);
  const methodDefaults = useMemo(() => new Set(profile.methodSlugs ?? []), [profile.methodSlugs]);
  const orcidVerified = useMemo(
    () => profile.verification.some(
      (signal) => signal.verified && signal.label.toLowerCase().includes("orcid"),
    ),
    [profile.verification],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload: ProfileUpdateInput = {
      fullName: String(form.get("fullName") ?? ""),
      headline: String(form.get("headline") ?? "") || null,
      imageUrl: imageUrl || null,
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
      accountRole,
      profileDetails: accountRole === "student"
        ? {
            ...professionalDetails,
            degreeProgram: String(form.get("degreeProgram") ?? "") || null,
            graduationYear: String(form.get("graduationYear") ?? "") || null,
            thesisTopic: String(form.get("thesisTopic") ?? "") || null,
            supervisorName: String(form.get("supervisorName") ?? "") || null,
          }
        : {
            ...professionalDetails,
            academicTitle: String(form.get("academicTitle") ?? "") || null,
            department: String(form.get("department") ?? "") || null,
            ...(accountRole === "researcher"
              ? {
                  currentProject: String(form.get("currentProject") ?? "") || null,
                  yearsExperience: String(form.get("yearsExperience") ?? "") || null,
                }
              : {}),
            ...(accountRole === "professor"
              ? {
                  labName: String(form.get("labName") ?? "") || null,
                  supervisionStatus: String(form.get("supervisionStatus") ?? "") || null,
                }
              : {}),
          },
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
        <div className={styles.sectionHead}>
          <div>
            <span className="sectionLabel">Identity</span>
            <h2>Research identity</h2>
          </div>
          <p>Maintain the factual identity and institutional context used across discovery and research workflows.</p>
        </div>
        <div className={styles.photoEditor}>
          <IdentityAvatar name={profile.fullName} src={imageUrl} />
          <label className={styles.fieldGroup}>
            <span>Professional profile photo URL</span>
            <input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://…" />
            <small>Use a square portrait from a secure HTTPS address. A branded initials avatar appears when no photo is provided.</small>
          </label>
        </div>
        <div className={styles.editorGrid}>
          <label className={styles.fieldGroup}>
            <span>Full name</span>
            <input name="fullName" defaultValue={profile.fullName} maxLength={160} required />
          </label>
          <label className={styles.fieldGroup}>
            <span>Profile type</span>
            <select value={accountRole} onChange={(event) => setAccountRole(event.target.value as IndividualProfileRole)}>
              <option value="student">Student</option>
              <option value="researcher">Researcher</option>
              <option value="professor">Professor / faculty</option>
            </select>
          </label>
          <label className={styles.fieldGroup}>
            <span>Professional headline</span>
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
                  {organization.name}{organization.verified ? " · verified institution" : ""}
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
            <span>Introduction availability</span>
            <select name="availability" defaultValue={profile.availability}>
              <option value="open">Open</option>
              <option value="selective">Selective</option>
              <option value="quiet">Quiet mode</option>
              <option value="closed">Not accepting requests</option>
            </select>
          </label>
          {accountRole === "student" ? (
            <>
              <label className={styles.fieldGroup}><span>Degree program</span><input name="degreeProgram" defaultValue={profile.profileDetails?.degreeProgram ?? ""} placeholder="PhD, MSc, MD…" /></label>
              <label className={styles.fieldGroup}><span>Expected graduation</span><input name="graduationYear" defaultValue={profile.profileDetails?.graduationYear ?? ""} placeholder="2028" /></label>
              <label className={styles.fieldGroup}><span>Supervisor</span><input name="supervisorName" defaultValue={profile.profileDetails?.supervisorName ?? ""} /></label>
              <label className={styles.fieldGroup}><span>Thesis / dissertation topic</span><input name="thesisTopic" defaultValue={profile.profileDetails?.thesisTopic ?? ""} /></label>
            </>
          ) : (
            <>
              <label className={styles.fieldGroup}><span>Academic title</span><input name="academicTitle" defaultValue={profile.profileDetails?.academicTitle ?? ""} placeholder="Assistant professor, PI…" /></label>
              <label className={styles.fieldGroup}><span>Department</span><input name="department" defaultValue={profile.profileDetails?.department ?? ""} /></label>
              {accountRole === "researcher" ? <><label className={styles.fieldGroup}><span>Years of research experience</span><input name="yearsExperience" defaultValue={profile.profileDetails?.yearsExperience ?? ""} /></label><label className={styles.fieldGroup}><span>Current project</span><input name="currentProject" defaultValue={profile.profileDetails?.currentProject ?? ""} /></label></> : null}
              {accountRole === "professor" ? <><label className={styles.fieldGroup}><span>Lab / research group</span><input name="labName" defaultValue={profile.profileDetails?.labName ?? ""} /></label><label className={styles.fieldGroup}><span>Student supervision</span><select name="supervisionStatus" defaultValue={profile.profileDetails?.supervisionStatus ?? ""}><option value="">Not specified</option><option value="accepting">Accepting students</option><option value="selective">Selective</option><option value="closed">Not accepting students</option></select></label></> : null}
            </>
          )}
        </div>
      </section>

      <ProfessionalProfileFields value={professionalDetails} onChange={setProfessionalDetails} />

      <section className={styles.editorSection}>
        <div className={styles.sectionHead}>
          <div>
            <span className="sectionLabel">Research summary</span>
            <h2>Scientific context</h2>
          </div>
          <p>Describe the research context another researcher needs to understand your work. Keep it factual and specific.</p>
        </div>
        <label className={styles.fieldGroup}>
          <span>Research summary</span>
          <textarea name="bio" defaultValue={profile.bio ?? ""} rows={6} maxLength={3000} />
        </label>
      </section>

      <section className={styles.editorSection}>
        <div className={styles.sectionHead}>
          <div>
            <span className="sectionLabel">Canonical research focus</span>
            <h2>Topics and methods</h2>
          </div>
          <p>Structured terms support explainable retrieval. They are matching inputs, not expertise ratings or reputation signals.</p>
        </div>
        <div className={styles.choiceColumns}>
          <fieldset className={styles.choiceGroup}>
            <legend>Topics</legend>
            <div className={styles.choiceList}>
              {topicOptions.map(([value, label]) => (
                <label key={value} className={styles.checkRow}>
                  <input type="checkbox" name="topicSlugs" value={value} defaultChecked={topicDefaults.has(value)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.choiceGroup}>
            <legend>Methods</legend>
            <div className={styles.choiceList}>
              {methodOptions.map(([value, label]) => (
                <label key={value} className={styles.checkRow}>
                  <input type="checkbox" name="methodSlugs" value={value} defaultChecked={methodDefaults.has(value)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className={styles.editorSection}>
        <div className={styles.sectionHead}>
          <div>
            <span className="sectionLabel">Collaboration intent</span>
            <h2>What contact is relevant</h2>
          </div>
          <p>Choose the scientific reasons for which you want to be considered. Recipient controls still govern every introduction.</p>
        </div>
        <div className={styles.choiceGrid}>
          {collaborationOptions.map(([value, label]) => (
            <label key={value} className={styles.checkRow}>
              <input type="checkbox" name="collaborationGoals" value={value} defaultChecked={collaborationDefaults.has(value)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className={styles.editorSection}>
        <div className={styles.sectionHead}>
          <div>
            <span className="sectionLabel">ORCID provenance</span>
            <h2>Identifier and ownership state</h2>
          </div>
          <p>ORCID ownership and publication evidence are separate claims. Bibliographic corroboration is evaluated independently.</p>
        </div>
        <div className={styles.provenanceGrid}>
          <div>
            <label className={styles.fieldGroup}>
              <span>ORCID iD</span>
              <input name="orcid" defaultValue={profile.orcid ?? ""} placeholder="0000-0000-0000-0000" />
            </label>
            <p className={styles.sourceNotice}>
              Manual entry is recorded as an assertion. Verified ownership requires the authorized ORCID flow.
            </p>
          </div>
          <div className={styles.provenanceEvidence}>
            <strong>{orcidVerified ? "Ownership provenance: verified" : "Ownership provenance: asserted"}</strong>
            <span>
              {orcidVerified
                ? "The connected ORCID flow verified control of this ORCID identity. Individual works still carry their own evidence level."
                : "This identifier has not been ownership-verified through the connected ORCID flow."}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.editorSection}>
        <div className={styles.sectionHead}>
          <div>
            <span className="sectionLabel">Visibility</span>
            <h2>Discovery control</h2>
          </div>
          <p>Control whether this Scientific Identity can appear in researcher discovery. Private product activity is not published here.</p>
        </div>
        <div className={styles.visibilityGrid}>
          <label className={styles.visibilityToggle}>
            <input name="profilePublic" type="checkbox" defaultChecked={profile.profilePublic ?? true} />
            <span>
              <strong>Include this Scientific Identity in researcher discovery</strong>
              <small>Turn this off to remove the profile from researcher discovery while retaining your account and private workspace.</small>
            </span>
          </label>
          <p className={styles.controlNote}>
            Visibility changes affect discovery exposure only. They do not convert private activity into public profile data.
          </p>
        </div>
      </section>

      <footer className={styles.editorActions}>
        <div>
          <span>Saved edits remain attached to the authenticated account and retain provenance context.</span>
          {message ? <p className={status === "error" ? styles.errorMessage : styles.successMessage}>{message}</p> : null}
        </div>
        <button className="primaryButton" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save Scientific Identity"}
        </button>
      </footer>
    </form>
  );
}
