import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { ResearchProfileActions } from "@/components/scientific/research-profile-actions";
import { researchProfileSources } from "@/lib/research-profile-sources";
import { getCurrentUser } from "@/server/auth/current-user";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import styles from "./page.module.css";

export default async function ResearchProfilesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile/orcid");
  const institutional = user.accountKind === "INSTITUTION";
  const profile = institutional ? null : await researcherRepository.getProfileForUser(user.id);
  const profileHref = institutional ? "/organization/profile" : "/profile";
  return <ProductShell accountKind={institutional ? "institution" : "individual"}>
    <div className={styles.page}>
      <header className={styles.header}>
        <span className="eyebrow">Scientific identity · External profiles</span>
        <h1>Your research profiles</h1>
        <p>Open your external research profiles and their official services.</p>
      </header>
      <div className={styles.grid}>
        {researchProfileSources.filter((source) => !institutional || source.key !== "orcid").map((source) => <section className={styles.card} key={source.key}>
          <h2>{source.name}</h2>
          <p>{source.description}</p>
          <ResearchProfileActions sourceKey={source.key} value={source.key === "orcid" ? profile?.orcid : profile?.profileDetails?.links?.[source.key]} />
          {source.key === "orcid" ? <a className={styles.register} href="https://orcid.org/register" target="_blank" rel="noopener noreferrer">Create an ORCID iD ↗</a> : null}
        </section>)}
      </div>
      <section className={styles.card}>
        <h2>Keep your profile links together</h2>
        <p>Add your public profile URLs to keep your research links together.</p>
        <div className={styles.actions}>
          <Link className="primaryButton" href={institutional ? profileHref : "/profile/edit"}>{institutional ? "Open institutional profile" : "Save your profile links"} →</Link>
          <Link className="secondary" href={profileHref}>Back to your profile</Link>
        </div>
      </section>
    </div>
  </ProductShell>;
}
