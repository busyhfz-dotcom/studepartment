import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { isOrcidConfigured } from "@/server/integrations/orcid/client";
import styles from "./page.module.css";

export default async function OrcidConnectionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile/orcid");
  const configured = isOrcidConfigured();
  return <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}>
    <div className={styles.page}>
      <header className={styles.header}>
        <span className="eyebrow">Scientific identity · ORCID</span>
        <h1>Connect your ORCID iD</h1>
        <p>ORCID lets you prove control of your researcher identifier. Your password stays with ORCID, and you choose whether to authorize Studepartment.</p>
      </header>
      <section className={styles.card}>
        <h2>{configured ? "Verify your researcher identity" : "ORCID verification is awaiting activation"}</h2>
        <p>{configured ? "Continue to ORCID to sign in and approve the connection. You will return to your profile when verification finishes." : "The platform's ORCID connection is not active yet. Your profile and uploaded documents remain available. You can add an ORCID iD manually; it will remain unverified until you authorize the connection."}</p>
        <div className={styles.actions}>
          {configured ? <a className="primaryButton" href="/api/integrations/orcid/connect">Continue to ORCID →</a> : <a className="secondary" href="/profile/orcid">Check connection again</a>}
          <Link className="secondary" href="/profile/edit">Edit your Scientific Identity</Link>
          <a className="secondary" href="https://orcid.org/register" target="_blank" rel="noopener noreferrer">Create an ORCID iD ↗</a>
        </div>
        <p>Connecting ORCID does not automatically verify the accuracy of every publication. Public works can be imported separately after ownership verification.</p>
      </section>
      <Link className="backLink" href="/profile">← Back to your profile</Link>
    </div>
  </ProductShell>;
}
