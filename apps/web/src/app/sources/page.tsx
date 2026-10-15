import type { Metadata } from "next";
import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { getShellViewer } from "@/server/auth/shell-viewer";
import { opportunitySources } from "@/server/opportunities/sources/registry";
import { getOpportunitySourceStatus, LISTING_STALE_AFTER_DAYS, type PublicSourceStatus } from "@/server/opportunities/sources/sync";
import styles from "../scanner/scanner.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Data sources",
  description: "The funders and employers whose open positions and funding calls appear in Provenant, and how often each is checked.",
};

async function loadSources(): Promise<PublicSourceStatus[]> {
  try {
    return await getOpportunitySourceStatus();
  } catch {
    return opportunitySources.map((connector) => ({
      id: connector.id,
      name: connector.source.name,
      kind: connector.kind,
      homepage: connector.homepage,
      description: connector.description,
      enabled: connector.isEnabled(process.env),
      activeListings: 0,
      lastSyncedAt: null,
    }));
  }
}

function syncedLabel(value: string | null) {
  if (!value) return "Not checked yet";
  const hours = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 3_600_000));
  if (hours < 1) return "Checked within the hour";
  if (hours < 48) return `Checked ${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `Checked ${Math.round(hours / 24)} days ago`;
}

export default async function SourcesPage() {
  const [viewer, sources] = await Promise.all([getShellViewer(), loadSources()]);
  const groups = [
    { kind: "grants" as const, label: "Funding calls", intro: "Official funders' databases, read through the public APIs they publish." },
    { kind: "positions" as const, label: "Positions", intro: "Employers' own job feeds and open job boards that allow reuse of their listings." },
  ];

  return (
    <ProductShell {...viewer}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className="eyebrow">Data sources</span>
          <h1>Where Provenant&apos;s listings come from.</h1>
          <p className="lede">
            Provenant reads open positions and funding calls directly from the publishers below, using the official
            APIs and feeds they provide. Every listing links back to its source, and we leave out sites that ask not to
            be crawled.
          </p>
        </header>

        {groups.map((group) => (
          <section className={styles.category} key={group.kind}>
            <div className={styles.categoryHeading}>
              <h2>{group.label}</h2>
              <p>{group.intro}</p>
            </div>
            <div className={styles.sourceGrid}>
              {sources.filter((source) => source.kind === group.kind).map((source) => (
                <a className={styles.sourceCard} href={source.homepage} key={source.id} rel="noreferrer noopener" target="_blank">
                  <div className={styles.sourceTop}>
                    <strong>{source.name}</strong>
                    <span>↗</span>
                  </div>
                  <p>{source.description}</p>
                  <div className={styles.sourceMeta}>
                    <span>{source.enabled ? `${source.activeListings.toLocaleString("en")} open listings` : "Not connected yet"}</span>
                    <span>{source.enabled ? syncedLabel(source.lastSyncedAt) : "Awaiting access key"}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <section className={styles.category}>
          <div className={styles.categoryHeading}>
            <h2>How listings are kept current</h2>
            <p>What happens between the publisher and your search results.</p>
          </div>
          <ul className={styles.notes}>
            <li>Each source is checked every 6 to 12 hours. New listings appear after the next check.</li>
            <li>A listing leaves search when its deadline passes, when the publisher removes it, or when it has not been seen at the source for {LISTING_STALE_AFTER_DAYS} days.</li>
            <li>Deadlines, eligibility and funding amounts are taken from the publisher. Always confirm them on the official page before you apply.</li>
            <li>Large job boards such as EURAXESS, Nature Careers and jobs.ac.uk do not allow automated collection, so they are linked from <Link href="/scanner">Scanner</Link> instead.</li>
          </ul>
        </section>
      </div>
    </ProductShell>
  );
}
