import Link from "next/link";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { listOrganizationOptions } from "@/server/repositories/organization-repository";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { ProfileEditor } from "./profile-editor";
import styles from "./page.module.css";

const statusCopy: Record<string, string> = {
  "not-configured": "ORCID verification is not configured in this environment yet. Add the ORCID client credentials and registered redirect URI to enable it.",
  error: "The ORCID verification flow could not be started. No verification state was changed.",
};

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ orcid?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile/edit");

  const [{ orcid }, profile, organizations] = await Promise.all([
    searchParams,
    researcherRepository.getProfileForUser(user.id),
    listOrganizationOptions(),
  ]);
  if (!profile) redirect("/onboarding");

  const orcidVerified = profile.verification.some(
    (signal) => signal.verified && signal.label.toLowerCase().includes("orcid"),
  );

  return (
    <main className="shell onboardingShell">
      <ScientificBackdrop tone="light" />
      <Link className="backLink" href="/profile">← Back to Scientific Identity</Link>

      <header className="onboardingHeader">
        <span className="eyebrow">Scientific Identity Maintenance</span>
        <h1>Maintain the scientific context behind research decisions.</h1>
        <p className="lede">
          Keep identity, research focus, collaboration intent, provenance, and visibility accurate. These controls inform
          discovery and decision support without creating a public reputation score.
        </p>
      </header>

      <section className="orcidPanel" aria-labelledby="orcid-provenance-title">
        <div>
          <div className={styles.provenanceLine}>
            <span className="eyebrow">ORCID provenance</span>
            <span className={orcidVerified ? styles.verifiedState : styles.assertedState}>
              {orcidVerified ? "Ownership verified" : "Manual assertion"}
            </span>
          </div>
          <h2 id="orcid-provenance-title">
            {orcidVerified ? "ORCID ownership is connected to this identity." : "Verify ORCID ownership through ORCID."}
          </h2>
          <p>
            Manual ORCID entry is an identity assertion only. OAuth verification records ownership provenance; it does
            not independently verify every work associated with the ORCID record.
          </p>
          {profile.orcid ? <code className={styles.orcidIdentifier}>{profile.orcid}</code> : null}
          {orcid && statusCopy[orcid] ? (
            <p className={styles.orcidStatus} role="status"><strong>{statusCopy[orcid]}</strong></p>
          ) : null}
        </div>
        <a className="primaryButton" href="/api/integrations/orcid/connect">
          {orcidVerified ? "Re-verify with ORCID" : "Verify with ORCID"}
        </a>
      </section>

      <ProfileEditor profile={profile} organizations={organizations} />
    </main>
  );
}
