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
          <span className="eyebrow">Saved opportunities</span>
          <h1>Track every application from saved to decided.</h1>
          <p>
            Keep the deadline, source, reminders and your private notes together for each opportunity.
            Saving something never changes how relevant it is or whether you are eligible.
          </p>
          <Link href="/opportunities">← Back to opportunities</Link>
        </header>
        <SavedOpportunityWorkspace pendingOpportunityId={pendingId} />
      </div>
    </ProductShell>
  );
}
