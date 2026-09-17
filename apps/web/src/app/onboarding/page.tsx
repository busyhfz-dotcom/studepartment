import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { ProfileEditor } from "../profile/edit/profile-editor";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/onboarding");

  const profile = await researcherRepository.getProfileForUser(user.id);
  if (!profile) redirect("/auth/sign-in");

  return (
    <main className="shell onboardingShell">
      <header className="onboardingHeader">
        <Link className="backLink" href="/">← Studepartment</Link>
        <span className="eyebrow">Scientific Identity · v1 onboarding</span>
        <h1>Build the minimum identity needed for useful scientific discovery.</h1>
        <p className="lede">
          Add only data that improves scientific context, trust, matching, opportunity analysis, or the quality of introductions. You can change visibility and availability at any time.
        </p>
      </header>

      <section className="orcidPanel">
        <div>
          <span className="eyebrow">Verification model</span>
          <h2>Your claims and verified external records are kept separate.</h2>
          <p>
            An ORCID iD entered here is stored as a researcher assertion. It becomes a verified source only after the authorized ORCID import flow confirms ownership and records provenance.
          </p>
        </div>
      </section>

      <ProfileEditor profile={profile} />
    </main>
  );
}
