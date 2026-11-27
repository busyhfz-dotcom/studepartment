import type { Metadata } from "next";
import { Institution } from "@/components/opportunities/brand-mark";
import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { getShellViewer } from "@/server/auth/shell-viewer";
import { countryName } from "@/lib/countries";
import styles from "../../scanner/scanner.module.css";
import conference from "./data/conferences.json";
import graduate from "./data/graduate.json";
import ai from "./data/ai.json";
import cancer from "./data/cancer.json";
import seed from "./data/seed.json";

export const metadata: Metadata = {
  title: "Medicine and research directory",
  description: "Browse graduate programmes, department routes, conferences, travel awards, prizes and research funding.",
};

const items = [...conference, ...graduate, ...ai, ...cancer, ...seed].sort((a, b) => a.title.localeCompare(b.title));
const categories = [...new Set(items.flatMap(item => item.kinds))].sort();
const collections = [
  ["conferences", "Conferences and awards"],
  ["graduate", "Medical graduate study"],
  ["ai", "AI in medicine"],
  ["cancer", "Cancer research funding"],
  ["seed", "Research programmes and funding"],
];
const pageSize = 30;
const countryAliases: Record<string, string[]> = { US: ["USA", "US", "United States"], GB: ["UK", "U.K.", "United Kingdom", "England", "Scotland", "Wales", "Northern Ireland"], NL: ["Netherlands", "The Netherlands", "Holland"] };

export default async function OpportunityDirectory({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; page?: string; group?: string; country?: string }> }) {
  const [params, viewer] = await Promise.all([searchParams, getShellViewer()]);
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const category = categories.includes(params.category ?? "") ? params.category : "";
  const group = collections.some(([id]) => id === params.group) ? params.group : "";
  const code = typeof params.country === "string" ? params.country.toUpperCase() : "";
  const country = countryName(code);
  const placeNames = country ? (countryAliases[code] ?? [country]).map(name => name.toLowerCase()) : [];
  const terms = q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results = items.filter(item => {
    if ((category && !item.kinds.includes(category)) || (group && !item.sources.includes(group))) return false;
    const places = item.places.flatMap(place => place.toLowerCase().split(/\s*[/,;·()]\s*/));
    if (country && !places.some(place => placeNames.includes(place))) return false;
    const searchable = [item.title, item.provider, ...item.places, ...item.subjects, ...item.alternateTitles, ...item.facts.map(([, value]) => value)].join(" ").toLocaleLowerCase();
    return terms.every(term => searchable.includes(term));
  });
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.max(1, Math.min(totalPages, Number.parseInt(params.page ?? "", 10) || 1));
  const visible = results.slice((page - 1) * pageSize, page * pageSize);
  function pageHref(next: number, includeCountry = true) {
    const query = new URLSearchParams({ page: String(next) });
    if (q) query.set("q", q);
    if (category) query.set("category", category);
    if (group) query.set("group", group);
    if (includeCountry && country) query.set("country", code);
    return "/opportunities/directory?" + query;
  }
  return <ProductShell {...viewer}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1>Medicine and research directory</h1>
        <p className="lede">Explore graduate programmes, department routes, research careers, conferences and funding schemes. Dates and eligibility come from the workbooks. Confirm the current application window with the publisher.</p>
        <Link href="/start?step=browse">Browse open opportunities</Link>
      </header>
      <form action="/opportunities/directory" method="get" className={styles.directoryFilters}>
        {country ? <input type="hidden" name="country" value={code} /> : null}
        <label>Search<input name="q" defaultValue={q} placeholder="Subject, institution or country" /></label>
        <label>Category<select name="category" defaultValue={category}><option value="">All categories</option>{categories.map(kind=><option key={kind}>{kind}</option>)}</select></label>
        <label>Collection<select name="group" defaultValue={group}>
          <option value="">All collections</option>{collections.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></label>
        <button type="submit" className="primaryButton">Search directory</button>
      </form>
      <p>{results.length.toLocaleString("en")} {results.length === 1 ? "resource" : "resources"}
        {country ? <> · {country} · <Link href={pageHref(1, false)}>All locations</Link></> : null}
      </p>
      <div className={styles.sourceGrid}>
        {visible.map(item => <article className={styles.sourceCard} key={item.title + "|" + item.url}>
          <div className={styles.sourceMeta}><span>{category || item.kinds[0]}</span>{item.places.length ? <span data-original-content>{item.places.join(" · ")}</span> : null}</div>
          <h2 data-original-content>{item.title}</h2>
          {item.provider ? <p><Institution name={item.provider} website={item.url} /></p> : null}
          {item.subjects.length ? <p data-original-content>{item.subjects.join(" · ")}</p> : null}
          {item.facts.length ? <details className={styles.directoryFacts}>
            <summary>Details from the workbooks</summary>
            <dl>{item.facts.map(([label, value]) => <div key={label + "|" + value}>
              <dt>{label}</dt><dd data-original-content>{value}</dd>
            </div>)}</dl>
          </details> : null}
          <a href={item.url} target="_blank" rel="noopener noreferrer">Open source</a>
          {item.additionalLinks.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer">Additional source {index + 1}</a>)}
        </article>)}
      </div>
      {totalPages > 1 ? <nav className={styles.directoryPager} aria-label="Directory pages">
        {page > 1 ? <Link href={pageHref(page - 1)}>← Previous</Link> : null}
        <span>Page {page} of {totalPages}</span>
        {page < totalPages ? <Link href={pageHref(page + 1)}>Next →</Link> : null}
      </nav> : null}
    </div>
  </ProductShell>;
}
