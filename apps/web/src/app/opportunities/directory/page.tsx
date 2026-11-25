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

export const metadata: Metadata = {
  title: "Medicine and research directory",
  description: "Browse official starting points for graduate programmes, conferences, travel awards, prizes and research funding.",
};

const items = [...conference, ...graduate, ...ai, ...cancer].sort((a, b) => a.title.localeCompare(b.title));
const categories = [...new Set(items.map(item => item.kind))].sort();
const pageSize = 30;
const countryAliases: Record<string, string[]> = { US: ["USA", "US", "United States"], GB: ["UK", "U.K.", "United Kingdom", "England", "Scotland", "Wales", "Northern Ireland"], NL: ["Netherlands", "The Netherlands", "Holland"] };

export default async function OpportunityDirectory({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; page?: string; group?: string; country?: string }> }) {
  const [params, viewer] = await Promise.all([searchParams, getShellViewer()]);
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const category = categories.includes(params.category ?? "") ? params.category : "";
  const group = ["conferences", "graduate", "ai", "cancer"].includes(params.group ?? "") ? params.group : "";
  const code = typeof params.country === "string" ? params.country.toUpperCase() : "";
  const country = countryName(code);
  const placeNames = country ? (countryAliases[code] ?? [country]).map(name => name.toLowerCase()) : [];
  const terms = q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results = items.filter(item => {
    if ((category && item.kind !== category) || (group && !item.sources.includes(group))) return false;
    const places = item.place.toLowerCase().split(/\s*[/,;·]\s*/);
    if (country && !places.some(place => placeNames.includes(place))) return false;
    const searchable = [item.title, item.provider, item.place, ...item.subjects].join(" ").toLocaleLowerCase();
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
        <p className="lede">Find graduate programmes, research groups, scientific meetings and funding schemes. Check the publisher for the current cycle, application dates and eligibility.</p>
        <Link href="/start?step=browse">Browse open opportunities</Link>
      </header>
      <form action="/opportunities/directory" method="get" className={styles.directoryFilters}>
        {country ? <input type="hidden" name="country" value={code} /> : null}
        <label>Search<input name="q" defaultValue={q} placeholder="Subject, institution or country" /></label>
        <label>Category<select name="category" defaultValue={category}><option value="">All categories</option>{categories.map(kind=><option key={kind}>{kind}</option>)}</select></label>
        <label>Collection<select name="group" defaultValue={group}>
          <option value="">All collections</option><option value="conferences">Conferences and awards</option><option value="graduate">Medical graduate study</option><option value="ai">AI in medicine</option><option value="cancer">Cancer research funding</option>
        </select></label>
        <button type="submit" className="primaryButton">Search directory</button>
      </form>
      <p>{results.length.toLocaleString("en")} {results.length === 1 ? "resource" : "resources"}
        {country ? <> · {country} · <Link href={pageHref(1, false)}>All locations</Link></> : null}
      </p>
      <div className={styles.sourceGrid}>
        {visible.map(item => <article className={styles.sourceCard} key={item.kind + "|" + item.title + "|" + item.url}>
          <div className={styles.sourceMeta}><span>{item.kind}</span>{item.place ? <span>{item.place}</span> : null}</div>
          <h2>{item.title}</h2>
          {item.provider ? <p><Institution name={item.provider} website={item.url} /></p> : null}
          {item.subjects.length ? <p><strong>Subject</strong> · {item.subjects.join(" · ")}</p> : null}
          {item.detail ? <p>{item.detail}</p> : null}
          <a href={item.url} target="_blank" rel="noopener noreferrer">Check official source</a>
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
