import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { ScientificProfileCard } from "@/components/scientific/scientific-profile-card";
import { getCurrentUser } from "@/server/auth/current-user";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import styles from "./profile.module.css";

const orcidMessages: Record<string, { text: string; error?: boolean }> = {
  connected: { text: "ORCID ownership verified. Your scientific identity now carries an explicit verified ORCID provenance signal." },
  denied: { text: "ORCID authorization was cancelled. No profile data or verification state was changed.", error: true },
  "invalid-state": { text: "ORCID verification could not be completed because the authorization state was invalid or expired. Try again from profile settings.", error: true },
  conflict: { text: "That ORCID iD is already connected to another scientific identity. No change was made.", error: true },
  error: { text: "ORCID verification failed. No verification state was changed.", error: true },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ orcid?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile");

  const [{ orcid }, profile] = await Promise.all([
    searchParams,
    researcherRepository.getProfileForUser(user.id),
  ]);
  if (!profile) redirect("/onboarding");

  const identity = {
    id: profile.id,
    fullName: profile.fullName,
    headline: profile.headline,
    institution: profile.institution,
    location: profile.location,
    careerStage: profile.careerStage,
    summary: profile.bio ?? "Add a research summary to make scientific discovery more precise.",
    researchInterests: profile.researchInterests.map((name) => ({ name })),
    methods: profile.methods.map((name) => ({ name })),
    openTo: profile.collaborationGoals,
    availabilityMode: profile.availability,
    verification: profile.verification,
  };
  const orcidMessage = orcid ? orcidMessages[orcid] : undefined;

  return (
    <ProductShell>
      <div className="profileShell">
        <div className={styles.toolbar}>
          <div>
            <span className="eyebrow">Scientific identity</span>
            <p className={styles.toolbarCopy}>Manage the canonical profile and evidence used by discovery, matching, and introductions.</p>
          </div>
          <Link className="primaryButton" href="/profile/edit">Edit scientific identity</Link>
        </div>

        {orcidMessage ? (
          <p className={`${styles.notice} ${orcidMessage.error ? styles.noticeError : ""}`} role="status">
            {orcidMessage.text}
          </p>
        ) : null}

        <ScientificProfileCard identity={identity} />

        {profile.completeness ? (
          <section className={styles.guidance} aria-labelledby="profile-guidance-title">
            <div className={styles.header}>
              <div>
                <span className="sectionLabel">Profile guidance</span>
                <h2 id="profile-guidance-title">{profile.completeness.completed} of {profile.completeness.total} identity dimensions ready</h2>
              </div>
              <strong>{profile.completeness.percent}%</strong>
            </div>
            <div className={styles.bar} aria-hidden="true">
              <span style={{ width: `${profile.completeness.percent}%` }} />
            </div>
            <div className={styles.grid}>
              {profile.completeness.dimensions.map((dimension) => (
                <div className={styles.item} key={dimension.key}>
                  <span>{dimension.complete ? "✓" : "○"}</span>
                  <span>{dimension.label}</span>
                </div>
              ))}
            </div>
            <p>{profile.completeness.note}</p>
          </section>
        ) : null}
      </div>
    </ProductShell>
  );
}
