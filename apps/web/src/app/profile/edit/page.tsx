import Link from "next/link";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { listOrganizationOptions } from "@/server/repositories/organization-repository";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { ProfileEditor } from "./profile-editor";
import styles from "./page.module.css";
import { ResearchProfileActions } from "@/components/scientific/research-profile-actions";
import { isOrcidConfigured } from "@/server/integrations/orcid/client";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile/edit");

  if (user.accountKind === "INSTITUTION") redirect("/organization/profile");
  const [profile, organizations] = await Promise.all([
    researcherRepository.getProfileForUser(user.id),
    listOrganizationOptions(),
  ]);
  if (!profile) redirect("/onboarding");

  const orcidVerified = profile.verification.some(
    (signal) => signal.verified && signal.label.toLowerCase().includes("orcid"),
  );
  const configured = isOrcidConfigured();

  return (
    <main className="shell onboardingShell">
      <ScientificBackdrop tone="light" />
      <Link className="backLink" href="/profile">← Back to Scientific Identity</Link>

      <header className="onboardingHeader">
        <span className="eyebrow">Edit Scientific Identity</span>
        <h1>Keep your profile accurate.</h1>
        <p className="lede">
          Your research focus, collaboration preferences and visibility settings decide how you appear in search
          and which opportunities we suggest. None of it becomes a public score.
        </p>
      </header>

      <section className="orcidPanel" aria-labelledby="orcid-provenance-title">
        <div>
          <div className={styles.provenanceLine}>
            <span className="eyebrow">ORCID profile</span>
            <span className={orcidVerified ? styles.verifiedState : styles.assertedState}>
              {orcidVerified ? "Ownership verified" : "Profile link"}
            </span>
          </div>
          <h2 id="orcid-provenance-title">
            Bring your ORCID information into your profile.
          </h2>
          <p>
            Connect on ORCID to verify ownership and import available public information, or save your iD below to request a public-data import. Existing profile edits are preserved.
          </p>
          {profile.orcid ? <code className={styles.orcidIdentifier}>{profile.orcid}</code> : null}
          <ResearchProfileActions sourceKey="orcid" value={profile.orcid} />
          {!configured ? <p role="status">Automatic import is awaiting activation of the platform’s ORCID connection.</p> : null}
        </div>
        <div className={styles.sourceActions}>
          {configured ? <a className="primaryButton" href="/api/integrations/orcid/connect">Connect and import from ORCID →</a> : null}
          <Link className="secondary" href="/profile/orcid">Research profile services →</Link>
        </div>
      </section>

      <ProfileEditor profile={profile} organizations={organizations} />
    </main>
  );
}
