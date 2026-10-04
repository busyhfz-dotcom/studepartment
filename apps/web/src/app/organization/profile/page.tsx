import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { getOwnedOrganization } from "@/server/repositories/organization-repository";
import { OrganizationProfileEditor } from "./organization-profile-editor";
import styles from "./organization-profile.module.css";

export default async function OrganizationProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/organization/profile");
  if (user.accountKind !== "INSTITUTION") redirect("/onboarding/organization");

  const organization = await getOwnedOrganization(user.id);
  if (!organization) redirect("/onboarding/organization");

  return (
    <ProductShell accountKind="institution">
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Institutional Identity</span>
            <span className={`${styles.statusPill} ${organization.verified ? styles.statusVerified : styles.statusUnverified}`}>
              {organization.verified ? "Verified institution" : "Unverified · self-reported"}
            </span>
          </div>
          <h1>{organization.name}</h1>
          <p className="lede">
            This is your organization&apos;s canonical record on Studepartment — distinct from an individual
            researcher profile. Researchers see this identity when evaluating your postings, affiliations,
            and institutional intelligence.
          </p>
          <div className={styles.headerActions}>
            <Link className="secondary" href={`/institutions/${organization.id}`}>View public institutional page ↗</Link>
          </div>
        </header>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <strong>{organization.activeOpportunityCount}</strong>
            <span>Opportunities linked to this organization</span>
          </div>
          <div className={styles.statCard}>
            <strong>{organization.affiliatedResearcherCount}</strong>
            <span>Researchers with a current affiliation</span>
          </div>
          <div className={styles.statCard}>
            <strong>{organization.claimedAt ? new Date(organization.claimedAt).toLocaleDateString() : "—"}</strong>
            <span>Institutional profile claimed</span>
          </div>
        </div>

        <OrganizationProfileEditor organization={organization} />
      </div>
    </ProductShell>
  );
}
