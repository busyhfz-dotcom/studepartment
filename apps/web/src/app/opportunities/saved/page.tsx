import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { SavedOpportunityWorkspace } from "./saved-opportunity-workspace";
import styles from "./page.module.css";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function SavedOpportunitiesPage({ searchParams }: { searchParams: Promise<{ save?: string }> }) {
  const { save } = await searchParams;
  const pendingId = save && /^[a-zA-Z0-9-]{1,128}$/.test(save) ? save : undefined;
  const user = await getCurrentUser();
  const destination = "/opportunities/saved" + (pendingId ? `?save=${pendingId}` : "");
  if (!user) redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(destination)}`);
  return (
    <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className="eyebrow">Opportunity Decision Workspace</span>
          <h1>Review source-backed opportunities as decisions, not bookmarks.</h1>
          <p>
            Track applications from saved to decision while keeping source context, deadlines, alerts and private notes in one place.
            Saving an opportunity never changes scientific relevance or formal eligibility.
          </p>
          <Link href="/opportunities">← Back to Opportunity Intelligence</Link>
        </header>
        <SavedOpportunityWorkspace pendingOpportunityId={pendingId} />
      </div>
    </ProductShell>
  );
}
