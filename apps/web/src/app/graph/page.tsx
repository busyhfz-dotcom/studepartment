import { ProductShell } from "@/components/shell/product-shell";
import { ScientificGraphExplorer } from "./scientific-graph-explorer";
import { ProGate } from "@/components/billing/pro-gate";
import { ProPreviewNotice } from "@/components/billing/pro-preview-notice";
import { canUseProFeature, getCurrentUser } from "@/server/auth/current-user";
import styles from "./page.module.css";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ScientificGraphPage({
  searchParams,
}: {
  searchParams: Promise<{ researcher?: string }>;
}) {
  const user = await getCurrentUser();
  const { researcher } = await searchParams;
  if (!user && !researcher) redirect("/auth/sign-in?callbackUrl=/graph");
  const accountKind = user?.accountKind === "INSTITUTION" ? "institution" : "individual";
  if (!canUseProFeature(user)) return <ProductShell accountKind={accountKind}><ProGate feature="Scientific Evidence Graph" /></ProductShell>;

  return (
    <ProductShell accountKind={accountKind}>
      <div className={styles.shell}>
        <ProPreviewNotice user={user} />
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Evidence Graph</span>
            <span className={styles.versionPill}>Derived canonical relationships</span>
          </div>
          <h1>See how a researcher&apos;s work connects.</h1>
          <p className="lede">
            Publications, topics, methods, labs, institutions and current opportunities, shown as clear links drawn from Provenant data. No hidden researcher scores.
          </p>
        </header>
        {accountKind === "institution" && !researcher ? <section className={styles.errorState}><h2>Select a researcher to inspect their evidence graph</h2><p>Open a public scientific identity from Discovery to inspect its publications, affiliations and opportunities.</p><Link className="primaryButton" href="/discover">Choose a researcher →</Link></section> : <ScientificGraphExplorer researcherId={researcher} />}
      </div>
    </ProductShell>
  );
}
