import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { ResearchProfileActions } from "@/components/scientific/research-profile-actions";
import { researchProfileSources } from "@/lib/research-profile-sources";
import { getCurrentUser } from "@/server/auth/current-user";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { isOrcidConfigured } from "@/server/integrations/orcid/client";
import { OrcidImportButton } from "./import-button";
import styles from "./page.module.css";

export default async function ResearchProfilesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile/orcid");
  const institutional = user.accountKind === "INSTITUTION";
  const profile = institutional ? null : await researcherRepository.getProfileForUser(user.id);
  const profileHref = institutional ? "/organization/profile" : "/profile";
  const configured = isOrcidConfigured();
  return <ProductShell accountKind={institutional ? "institution" : "individual"}>
    <div className={styles.page}>
      <header className={styles.header}>
        <span className="eyebrow">Scientific identity · External profiles</span>
        <h1>Your research profiles</h1>
        <p>Import public information from ORCID, or keep your other research profiles one click away through their official services.</p>
      </header>
      {!institutional ? <section className={styles.card}>
        <h2>Connect and import from ORCID</h2>
        <p>Sign in on ORCID and authorize Studepartment to read your public record. We import available biography, country, education, research appointments, keywords, profile links and up to 100 research outputs. Existing profile text and populated sections are preserved.</p>
        <p>We request read access to public information only. Your ORCID password stays with ORCID; no ORCID access token is stored.</p>
        {configured ? <div className={styles.actions}>
          <a className="primaryButton" href="/api/integrations/orcid/connect">Connect and import from ORCID →</a>
          {profile?.orcid ? <OrcidImportButton /> : <Link className="secondary" href="/profile/edit">Enter your ORCID iD</Link>}
        </div> : <p role="status">Automatic import is awaiting activation of the platform’s ORCID connection. You can save your iD and open your public record now.</p>}
        <p>Saving a new iD requests a public-data import when this connection is active. Account ownership is verified only after authorization on ORCID.</p>
      </section> : null}
      <div className={styles.grid}>
        {researchProfileSources.map((source) => <section className={styles.card} key={source.key}>
          <h2>{source.name}</h2>
          <p>{source.description}</p>
          <ResearchProfileActions sourceKey={source.key} value={source.key === "orcid" ? profile?.orcid : profile?.profileDetails?.links?.[source.key]} />
          {source.key === "orcid" ? <a className={styles.register} href="https://orcid.org/register" target="_blank" rel="noopener noreferrer">Create an ORCID iD ↗</a> : null}
        </section>)}
      </div>
      <section className={styles.card}>
        <h2>Keep your profile links together</h2>
        <p>Other external profile links open the source website. They do not import information or verify account ownership. Open each service in a new tab, then paste its public profile URL into your Studepartment profile.</p>
        <div className={styles.actions}>
          <Link className="primaryButton" href={institutional ? profileHref : "/profile/edit"}>{institutional ? "Open institutional profile" : "Save your profile links"} →</Link>
          <Link className="secondary" href={profileHref}>Back to your profile</Link>
        </div>
      </section>
    </div>
  </ProductShell>;
}
