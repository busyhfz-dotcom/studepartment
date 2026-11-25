import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getDb } from "@studepartment/db";
import { ProductShell } from "@/components/shell/product-shell";
import { Institution } from "@/components/opportunities/brand-mark";
import { AwardBasis, formatAward } from "@/components/opportunities/listing-facts";
import { ListingActions } from "@/components/opportunities/listing-actions";
import { OpportunitySignals } from "@/components/opportunities/opportunity-signals";
import { getSiteUrl } from "@/lib/site";
import { getShellViewer } from "@/server/auth/shell-viewer";
import { grantDetails } from "@/server/opportunities/grant-details";
import { publishedFacts } from "@/server/opportunities/published-facts";
import { SaveOpportunityButton } from "../save-opportunity-button";
import styles from "./detail.module.css";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  PHD: "PhD position",
  POSTDOC: "Postdoctoral position",
  FELLOWSHIP: "Fellowship",
  GRANT: "Research grant",
  COLLABORATION: "Collaboration",
  RESEARCH_ASSISTANTSHIP: "Research position",
  MASTERS_SCHOLARSHIP: "Master’s scholarship",
  PHD_SCHOLARSHIP: "PhD scholarship",
  MD_SCHOLARSHIP: "Medical degree scholarship",
};
const fundingTypes = new Set(["GRANT", "MASTERS_SCHOLARSHIP", "PHD_SCHOLARSHIP", "MD_SCHOLARSHIP"]);

/** One public, indexable page per listing that is open and still present at its source. */
const loadOpportunity = cache(async (id: string) => {
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(id)) return null;
  const now = new Date();
  return getDb().opportunity.findFirst({
    where: { id, status: "ACTIVE", OR: [{ deadline: null }, { deadline: { gte: now } }] },
    select: {
      id: true, type: true, title: true, description: true, city: true, countryCode: true,
      deadline: true, deadlinePrecision: true, sourceUrl: true, applicationUrl: true, sourceName: true,
      sourceRecordId: true, eligibleCountryCodes: true,
      publishedAt: true, firstSeenAt: true, lastSeenAt: true, lastVerifiedAt: true,
      organization: { select: { name: true, website: true } },
      topics: { select: { topic: { select: { name: true } } }, take: 8 },
      provenance: { select: { metadata: true }, orderBy: { observedAt: "desc" }, take: 1 },
    },
  });
});

function summary(text: string | null, length: number) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > length ? clean.slice(0, length - 1).trimEnd() + "…" : clean;
}

const formatDate = (date: Date) => new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const opportunity = await loadOpportunity(id);
  if (!opportunity) return { title: "Opportunity not available", robots: { index: false, follow: true } };
  const label = typeLabels[opportunity.type] ?? "Opportunity";
  const description = summary(opportunity.description, 155)
    || `${label} at ${opportunity.organization.name}. See the source, the deadline and when it was last checked.`;
  const title = `${opportunity.title} · ${opportunity.organization.name}`;
  return {
    title,
    description,
    alternates: { canonical: `/opportunities/${opportunity.id}` },
    openGraph: { title, description, type: "article", url: `/opportunities/${opportunity.id}` },
  };
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [opportunity, viewer, requestHeaders] = await Promise.all([loadOpportunity(id), getShellViewer(), headers()]);
  if (!opportunity) notFound();

  const site = getSiteUrl();
  const url = `${site}/opportunities/${opportunity.id}`;
  const label = typeLabels[opportunity.type] ?? "Opportunity";
  const location = [opportunity.city, opportunity.countryCode].filter(Boolean).join(", ");
  const posted = opportunity.publishedAt ?? opportunity.firstSeenAt;
  const checked = opportunity.lastVerifiedAt ?? opportunity.lastSeenAt;
  const applyUrl = opportunity.applicationUrl ?? opportunity.sourceUrl;
  const description = (opportunity.description ?? "").trim();
  const metadata = opportunity.provenance[0]?.metadata;
  const { publishedEligibility, swiss, competition } = publishedFacts(opportunity.sourceUrl, metadata, opportunity.eligibleCountryCodes);
  const grant = opportunity.type === "GRANT" ? grantDetails({
    sourceName: opportunity.sourceName, sourceRecordId: opportunity.sourceRecordId, sourceUrl: opportunity.sourceUrl,
    description, organization: opportunity.organization.name, eligibleCountryCodes: opportunity.eligibleCountryCodes,
    metadata: swiss ? { ...(metadata && typeof metadata === "object" ? metadata : {}), awardMax: 375000, awardCurrency: "CHF" } : metadata,
  }) : undefined;
  const organization = {
    "@type": "Organization",
    name: opportunity.organization.name,
    ...(opportunity.organization.website ? { sameAs: opportunity.organization.website } : {}),
  };

  // Search engines read this to show the listing with its employer, place and closing date.
  const structured = fundingTypes.has(opportunity.type)
    ? {
        "@context": "https://schema.org",
        "@type": "MonetaryGrant",
        name: opportunity.title,
        description: summary(description, 4000) || opportunity.title,
        url,
        funder: organization,
      }
    : {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: opportunity.title,
        description: summary(description, 4000) || opportunity.title,
        datePosted: posted.toISOString().slice(0, 10),
        ...(opportunity.deadline ? { validThrough: opportunity.deadline.toISOString() } : {}),
        hiringOrganization: organization,
        ...(opportunity.countryCode
          ? { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", ...(opportunity.city ? { addressLocality: opportunity.city } : {}), addressCountry: opportunity.countryCode } } }
          : {}),
        directApply: false,
        url,
      };
  const structuredJson = JSON.stringify(structured).replace(/</g, "\\u003c");

  return (
    <ProductShell {...viewer}>
      <script type="application/ld+json" nonce={requestHeaders.get("x-nonce") ?? undefined} dangerouslySetInnerHTML={{ __html: structuredJson }} />
      <article className={styles.shell}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/opportunities">Opportunities</Link>
          <span aria-hidden="true">/</span>
          <span>{label}</span>
        </nav>

        <header className={styles.header}>
          <span className="eyebrow">{label}</span>
          <h1 data-original-content>{opportunity.title}</h1>
          <p className={styles.organization}>
            <Institution name={opportunity.organization.name} website={opportunity.organization.website} />{location ? ` · ${location}` : ""}
          </p>
        </header>

        <dl className={styles.facts}>
          <div>
            <dt>Due</dt>
            <dd>{opportunity.deadlinePrecision === "ROLLING" ? "Rolling" : opportunity.deadline ? formatDate(opportunity.deadline) : "Not published"}</dd>
          </div>
          <div>
            <dt>Last checked at source</dt>
            <dd>{formatDate(checked)}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd data-original-content>{opportunity.sourceName}</dd>
          </div>
          {grant ? <>
            <div><dt>Award min</dt><dd>{formatAward(grant.awardMin, grant.currency)}</dd></div>
            <div><dt>Award max</dt><dd>{formatAward(grant.awardMax, grant.currency)}<AwardBasis grant={grant} /></dd></div>
          </> : null}
          <div><dt>Eligibility</dt><dd>{publishedEligibility ?? "Check official eligibility"}</dd></div>
          {competition ? <div><dt>Historical competition</dt><dd><a href={competition.url}>{competition.rate}% · {competition.basis}</a></dd></div> : null}
        </dl>

        <div className={styles.actions}>
          <div className={styles.listingActionGroup}>
            <OpportunitySignals item={{ id: opportunity.id, title: opportunity.title, type: opportunity.type }} recordView />
            <ListingActions item={{ id: opportunity.id, title: opportunity.title, type: opportunity.type, deadline: opportunity.deadline?.toISOString() ?? null, deadlinePrecision: opportunity.deadlinePrecision.toLowerCase().replaceAll("_", "-") }}
              primary={<a href={applyUrl} rel="noreferrer" target="_blank">Apply now</a>} />
          </div>
          <a className={styles.secondary} href={opportunity.sourceUrl} rel="noreferrer" target="_blank">Review original source</a>
          <SaveOpportunityButton className={styles.secondary} opportunityId={opportunity.id} />
        </div>

        <section className={styles.body}>
          <h2>About this opportunity</h2>
          {description
            ? <p className={styles.description} data-original-content>{description}</p>
            : <p className={styles.muted}>The publisher did not provide a description. Read the full details at the original source.</p>}
          {opportunity.topics.length ? (
            <ul className={styles.tags} aria-label="Research areas">
              {opportunity.topics.map(({ topic }) => <li key={topic.name}>{topic.name}</li>)}
            </ul>
          ) : null}
        </section>

        <aside className={styles.note}>
          <strong>Always confirm at the source.</strong>
          <p>
            Provenant indexes this listing from {opportunity.sourceName} and shows when it was last seen there. Eligibility,
            salary and closing dates are set by the publisher and can change.
          </p>
          {viewer.signedIn ? null : (
            <p>
              <Link href={`/auth/sign-up?callbackUrl=${encodeURIComponent(`/opportunities/${opportunity.id}`)}`}>Create a free profile</Link>{" "}
              to see how well this fits your research, save it and get a reminder before it closes.
            </p>
          )}
        </aside>
      </article>
    </ProductShell>
  );
}
