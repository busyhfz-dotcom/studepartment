import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductShell } from "@/components/shell/product-shell";
import { getShellViewer } from "@/server/auth/shell-viewer";
import { OpportunityExplorer } from "./opportunity-explorer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Search medical research positions and grants",
  description: "Find research jobs, fellowships and funding calls by topic, location, career stage and deadline.",
  alternates: { canonical: "/opportunities" },
};

export default async function OpportunitiesPage() {
  const viewer = await getShellViewer();
  return (
    <ProductShell {...viewer}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Opportunity Intelligence</span>
            <span className={styles.versionPill}>Source-aware decisions</span>
          </div>
          <h1>Protect your time before you apply.</h1>
          <p className="lede">
            Check how recent each listing is, how well it fits, who can apply and when it closes, before you put work into an application.
          </p>
          <Link href="/opportunities/saved">Your saved opportunities ↗</Link>
        </header>
        <Suspense fallback={<p role="status">Loading opportunity search…</p>}>
          <OpportunityExplorer />
        </Suspense>
      </div>
    </ProductShell>
  );
}
