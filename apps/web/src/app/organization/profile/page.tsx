import Link from "next/link";
import { redirect } from "next/navigation";
import { IdentityAvatar } from "@/components/identity/identity-avatar";
import { ProductShell } from "@/components/shell/product-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { getOwnedOrganization } from "@/server/repositories/organization-repository";
import { OrganizationProfileEditor } from "./organization-profile-editor";
import { OrganizationOpportunities } from "./organization-opportunities";
import styles from "./organization-profile.module.css";

export default async function OrganizationProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/organization/profile");
  if (user.accountKind !== "INSTITUTION") redirect("/onboarding/organization");

  const organization = await getOwnedOrganization(user.id);
  if (!organization) redirect("/onboarding/organization");
  const typeLabel = ({ university: "University", hospital: "Hospital", laboratory: "Laboratory", "research-institute": "Research institute", company: "Company", foundation: "Foundation" } as const)[organization.type];
  const detailLabels = { primaryFocus: "Primary focus", services: "Services and programs", facilities: "Facilities", accreditations: "Accreditations", capacity: "Capacity", fundingAreas: "Funding areas", departments: "Departments and teams", researchPrograms: "Research programs", notableProjects: "Notable projects", partnerships: "Partners and networks", careers: "Careers and training", researcherServices: "Researcher support", dataResources: "Data and shared resources", ethicsGovernance: "Ethics and governance" } as const;
  const visibleDetails = Object.entries(organization.profileDetails ?? {}).filter(([, value]) => value);

  return (
    <ProductShell accountKind="institution">
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.identityHead}>
            <IdentityAvatar name={organization.name} src={organization.logoUrl} kind="organization" size="large" />
            <div>
              <div className={styles.headerMeta}>
                <span className="eyebrow">{typeLabel} Identity</span>
                <span className={`${styles.statusPill} ${organization.verified ? styles.statusVerified : styles.statusUnverified}`}>
                  {organization.verified ? "Verified institution" : "Unverified · self-reported"}
                </span>
              </div>
              <h1>{organization.name}</h1>
            </div>
          </div>
          <p className="lede">
            This is your organization&apos;s canonical record on Studepartment — distinct from an individual
            researcher profile. Researchers see this identity when evaluating your postings, affiliations,
            and institutional intelligence.
          </p>
          <div className={styles.headerActions}>
            <Link className="secondary" href={`/institutions/${organization.id}`}>View public institutional page ↗</Link>
          </div>
        </header>

        {visibleDetails.length ? <section className={styles.detailGrid}>{visibleDetails.map(([key, value]) => <div className={styles.statCard} key={key}><span>{detailLabels[key as keyof typeof detailLabels]}</span><strong>{value}</strong></div>)}</section> : null}

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
        <OrganizationOpportunities />
      </div>
    </ProductShell>
  );
}
