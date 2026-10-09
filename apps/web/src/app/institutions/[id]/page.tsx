import Link from "next/link";
import { PublicDocuments } from "@/components/files/public-documents";
import { notFound } from "next/navigation";
import { IdentityAvatar } from "@/components/identity/identity-avatar";
import { ProductShell } from "@/components/shell/product-shell";
import { getInstitutionalIntelligence, getInstitutionFitSnapshot } from "@/server/institutions/intelligence";
import styles from "./page.module.css";

function date(value?: string) {
  if (!value) return "No exact deadline";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function InstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [institution, fit] = await Promise.all([
    getInstitutionalIntelligence(id),
    getInstitutionFitSnapshot(id),
  ]);
  if (!institution) notFound();
  const detailLabels = { primaryFocus: "Primary focus", services: "Services and programs", facilities: "Facilities", accreditations: "Accreditations", capacity: "Capacity", fundingAreas: "Funding areas", departments: "Departments and teams", researchPrograms: "Research programs", notableProjects: "Notable projects", partnerships: "Partners and networks", careers: "Careers and training", researcherServices: "Researcher support", dataResources: "Data and shared resources", ethicsGovernance: "Ethics and governance" } as const;
  const publicDetails = Object.entries(institution.profileDetails).filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1].trim()));

  return (
    <ProductShell>
      <div className={styles.shell}>
        <Link className="backLink" href="/discover/institutions">← Back to institution discovery</Link>
        <header className={styles.hero}>
          <div className={styles.identityBlock}>
            <IdentityAvatar name={institution.name} src={institution.logoUrl} kind="organization" size="large" />
            <div>
              <span className="eyebrow">Institutional Research Intelligence</span>
              <h1>{institution.name}</h1>
              <p>{institution.type}{institution.countryCode ? " · " + institution.countryCode : ""}{institution.verified ? " · Verified organization" : ""}</p>
            </div>
          </div>
          {institution.website ? <a href={institution.website} rel="noreferrer" target="_blank">Official website ↗</a> : null}
        </header>

        {institution.description || publicDetails.length ? <section className={styles.organizationStory}><div><span className="sectionLabel">Institutional profile · organization supplied</span><h2>About this organization</h2>{institution.description ? <p>{institution.description}</p> : null}</div>{publicDetails.length ? <div className={styles.organizationDetails}>{publicDetails.map(([key, value]) => <article key={key}><span>{detailLabels[key as keyof typeof detailLabels] ?? key}</span><p>{value}</p></article>)}</div> : null}</section> : null}

        <PublicDocuments files={institution.documents} />
        <section className={styles.metrics}>
          <div><strong>{institution.researchers.length}</strong><span>public current researchers</span></div>
          <div><strong>{institution.labs.length}</strong><span>canonical laboratories</span></div>
          <div><strong>{institution.opportunities.length}</strong><span>current opportunities</span></div>
          <div><strong>{institution.topics.length}</strong><span>observed research topics</span></div>
        </section>

        {fit ? (
          <section className={styles.fitPanel}>
            <div className={styles.fitCopy}>
              <span className="sectionLabel">Identity-to-institution overlap</span>
              <h2>Where your Scientific Identity intersects this institution</h2>
              <p>This view compares canonical topics, methods, and current opportunities. It is not a prestige score, institutional ranking, or hiring prediction.</p>
            </div>
            <div className={styles.fitSignals}>
              <div><strong>{fit.sharedTopics.length}</strong><span>shared topics</span></div>
              <div><strong>{fit.sharedMethods.length}</strong><span>shared methods</span></div>
              <div><strong>{fit.matchingOpportunityCount}</strong><span>overlapping current opportunities</span></div>
            </div>
            <div className={styles.fitReasons}>
              {fit.reasons.map((reason) => <p key={reason}>✓ {reason}</p>)}
              {fit.gaps.map((gap) => <p className={styles.fitGap} key={gap}>Review: {gap}</p>)}
            </div>
            <Link className={styles.assistantAction} href={"/assistant?institution=" + institution.id}>Interrogate this institution with Research Assistant ↗</Link>
          </section>
        ) : null}

        <section className={styles.grid}>
          <article className={styles.panel}>
            <span className="sectionLabel">Research concentration evidence</span>
            <h2>Topics represented by current researchers</h2>
            <div className={styles.signalList}>
              {institution.topics.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.researcherCount} researchers</strong></div>)}
              {!institution.topics.length ? <p>No public topic evidence yet.</p> : null}
            </div>
          </article>
          <article className={styles.panel}>
            <span className="sectionLabel">Method capability evidence</span>
            <h2>Methods represented by current researchers</h2>
            <div className={styles.signalList}>
              {institution.methods.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.researcherCount} researchers</strong></div>)}
              {!institution.methods.length ? <p>No public method evidence yet.</p> : null}
            </div>
          </article>
        </section>

        <section className={styles.panel}>
          <span className="sectionLabel">Current researcher evidence</span>
          <h2>Researchers currently connected through public affiliations</h2>
          <div className={styles.people}>
            {institution.researchers.map((researcher) => (
              <Link href={"/researchers/" + researcher.id} key={researcher.id}>
                <IdentityAvatar name={researcher.fullName} src={researcher.imageUrl} kind="person" size="small" />
                <span className={styles.personCopy}><strong>{researcher.fullName}</strong><span>{researcher.headline}</span><small>{researcher.title ?? "Current affiliation"} · {researcher.publicationCount} active publication records</small></span>
              </Link>
            ))}
            {!institution.researchers.length ? <p>No public current researcher profiles are connected yet.</p> : null}
          </div>
        </section>

        <section className={styles.grid}>
          <article className={styles.panel}>
            <span className="sectionLabel">Laboratories</span>
            <h2>Canonical labs</h2>
            <div className={styles.stack}>
              {institution.labs.map((lab) => <div key={lab.id}><strong>{lab.name}</strong><span>{lab.memberCount} members{lab.verified ? " · Verified" : ""}</span>{lab.description ? <p>{lab.description}</p> : null}</div>)}
              {!institution.labs.length ? <p>No canonical labs connected yet.</p> : null}
            </div>
          </article>
          <article className={styles.panel}>
            <span className="sectionLabel">Current opportunity evidence</span>
            <h2>Current source-backed opportunities</h2>
            <div className={styles.stack}>
              {institution.opportunities.map((opportunity) => <div key={opportunity.id}><strong>{opportunity.title}</strong><span>{opportunity.type} · {opportunity.deadlinePrecision === "rolling" ? "Rolling" : date(opportunity.deadline)}</span><a href={opportunity.sourceUrl} rel="noreferrer" target="_blank">Source ↗</a></div>)}
              {!institution.opportunities.length ? <p>No current opportunities are connected.</p> : null}
            </div>
          </article>
        </section>

        <p className={styles.note}>Institutional Intelligence is derived from canonical public affiliations, labs, scientific taxonomies, and source-backed opportunities. Counts describe available evidence; they are not institutional rankings.</p>
      </div>
    </ProductShell>
  );
}
