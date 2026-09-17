import Link from "next/link";
import { redirect } from "next/navigation";
import { ScientificProfileCard } from "@/components/scientific/scientific-profile-card";
import { getCurrentUser } from "@/server/auth/current-user";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import styles from "./profile.module.css";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile");

  const profile = await researcherRepository.getProfileForUser(user.id);
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

  return (
    <main className="shell profileShell">
      <div className={styles.toolbar}>
        <Link className="backLink" href="/">← Studepartment</Link>
        <Link className="primaryButton" href="/profile/edit">Edit scientific identity</Link>
      </div>

      <ScientificProfileCard identity={identity} />

      {profile.completeness ? (
        <section className={styles.guidance} aria-labelledby="profile-guidance-title">
          <div className={styles.header}>
            <div>
              <span className="eyebrow">Profile guidance</span>
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
    </main>
  );
}
