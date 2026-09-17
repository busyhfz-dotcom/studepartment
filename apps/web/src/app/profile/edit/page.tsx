import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { listOrganizationOptions } from "@/server/repositories/organization-repository";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { ProfileEditor } from "./profile-editor";

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

  return (
    <main className="shell onboardingShell">
      <Link className="backLink" href="/profile">← Back to profile</Link>
      <header className="onboardingHeader">
        <span className="eyebrow">Scientific Identity · v1</span>
        <h1>Keep your scientific identity precise, sourced, and useful.</h1>
        <p className="lede">
          Identity data is used for discovery, matching, opportunity analysis, and trusted introductions. It is not used to build a public popularity score.
        </p>
      </header>

      <section className="orcidPanel">
        <div>
          <span className="eyebrow">Verified identity source</span>
          <h2>Verify ORCID ownership through ORCID itself.</h2>
          <p>
            Manual ORCID text remains an assertion. OAuth verification records an explicit ORCID provenance signal and does not store the returned access token.
          </p>
          {orcid && statusCopy[orcid] ? <p role="status"><strong>{statusCopy[orcid]}</strong></p> : null}
        </div>
        <a className="primaryButton" href="/api/integrations/orcid/connect">Verify with ORCID</a>
      </section>

      <ProfileEditor profile={profile} organizations={organizations} />
    </main>
  );
}
