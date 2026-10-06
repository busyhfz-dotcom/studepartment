import Link from "next/link";
import styles from "./research-art.module.css";

type SymbolName = "identity" | "discovery" | "opportunities" | "evidence" | "assistant";

export function ResearchSymbol({ name = "evidence" }: { name?: SymbolName }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {name === "identity" ? <><circle cx="12" cy="7" r="4" /><path d="M4 21c0-6 3-9 8-9s8 3 8 9M18 3l1 1 2-2" /></> :
      name === "discovery" ? <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5M7.5 10.5h6M10.5 7.5v6" /></> :
      name === "opportunities" ? <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M8 6V3h8v3M3 11c5 3 13 3 18 0M10 12h4" /></> :
      name === "assistant" ? <><rect x="4" y="3" width="16" height="14" rx="3" /><path d="m8 17-3 4v-6M8 8h8M8 12h5" /></> :
      <><circle cx="12" cy="4" r="2.5" /><circle cx="4" cy="18" r="2.5" /><circle cx="20" cy="18" r="2.5" /><path d="m10.5 6-5 9.5M13.5 6l5 9.5M7 18h10" /></>}
  </svg>;
}

export function BrandSymbol() {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 32 32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 7h9a5 5 0 0 1 0 10h-4a5 5 0 0 0 0 10h10" /><circle cx="9" cy="7" r="2" /><circle cx="24" cy="27" r="2" /></svg>;
}

export function ResearchOrbit() {
  return <div className={styles.orbit} aria-hidden="true">
    <div className={`${styles.ring} ${styles.ringOne}`} /><div className={`${styles.ring} ${styles.ringTwo}`} /><div className={`${styles.ring} ${styles.ringThree}`} />
    <div className={styles.center}><ResearchSymbol /></div>
    <span className={`${styles.node} ${styles.nodeOne}`}><ResearchSymbol name="identity" /></span>
    <span className={`${styles.node} ${styles.nodeTwo}`}><ResearchSymbol name="opportunities" /></span>
    <span className={`${styles.node} ${styles.nodeThree}`}><ResearchSymbol name="assistant" /></span>
    <i className={`${styles.star} ${styles.starOne}`} /><i className={`${styles.star} ${styles.starTwo}`} /><i className={`${styles.star} ${styles.starThree}`} />
  </div>;
}

const nodes = [
  { name: "identity", label: "Scientific Identity", detail: "ORCID & publications", href: "/profile" },
  { name: "discovery", label: "Discovery", detail: "Scientific relevance", href: "/discover" },
  { name: "opportunities", label: "Opportunities", detail: "Positions & grants", href: "/start" },
  { name: "evidence", label: "Evidence Graph", detail: "Attributable sources", href: "/graph" },
] as const;

export function ResearchPreview() {
  return <section className={styles.preview} aria-label="Explore the connected research workspace" data-reveal>
    <div className={styles.windowBar}><span className={styles.dots}><i /><i /><i /></span><span>Studepartment / Research workspace</span><span>Scientific context</span></div>
    <div className={styles.previewBody}>
      <nav className={styles.rail} aria-label="Research tools">{nodes.map(node => <Link key={node.name} href={node.href} aria-label={node.label}><ResearchSymbol name={node.name} /></Link>)}</nav>
      <div className={styles.canvas}>
        <div className={styles.canvasTitle}><div><small>Scientific Discovery</small><h2>Find fit with a reason.</h2></div><span>Source-aware</span></div>
        <div className={styles.map}>
          <svg className={styles.connections} viewBox="0 0 950 280" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M180 65C340 65 250 145 460 145S625 70 780 70" /><path d="M180 223C320 223 300 145 460 145S640 223 780 223" /><circle cx="465" cy="145" r="70" opacity=".15" /></g></svg>
          <Link href="/profile" className={styles.identity}><span><ResearchSymbol name="identity" /></span><strong>Scientific Identity</strong><small>Your research context</small><em>Topics · methods · affiliations</em></Link>
          {nodes.map((node,i) => <Link key={node.name} href={node.href} className={`${styles.mapNode} ${styles[`position${i}`]}`}><span className={styles.mapIcon}><ResearchSymbol name={node.name} /></span><span><small>{node.label}</small><strong>{node.detail}</strong></span></Link>)}
        </div>
        <div className={styles.mapFooter}><span>Researcher-controlled</span><span>Source-aware</span><span>Private by default</span></div>
      </div>
    </div>
  </section>;
}
