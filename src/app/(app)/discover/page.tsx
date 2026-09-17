import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { ResearcherCard } from "@/components/researcher-card";
import { researchers } from "@/lib/demo-data";

export const metadata = { title: "Discover researchers" };

export default function DiscoverPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Scientific discovery</p><h1>Find relevant researchers.</h1><p>Search by scientific context, methods, disease area, institution or collaboration intent.</p></div></div>
      <section className="discovery-search panel">
        <div className="discovery-input"><Search size={19} /><span>tumor immunology, spatial profiling, therapy resistance…</span><kbd>⌘ K</kbd></div>
        <button className="button button-dark" type="button"><SlidersHorizontal size={16} /> Refine</button>
      </section>
      <div className="filter-row"><button className="filter-chip active" type="button">Best context</button><button className="filter-chip" type="button"><Filter size={14} /> Research topic</button><button className="filter-chip" type="button">Methods</button><button className="filter-chip" type="button">Location</button><button className="filter-chip" type="button">Open to collaborate</button></div>
      <div className="results-meta"><strong>{researchers.length} high-context profiles</strong><span>Demo results explain relevance without globally ranking researchers.</span></div>
      <section className="card-grid card-grid-2">{researchers.map((researcher) => <ResearcherCard researcher={researcher} key={researcher.id} />)}</section>
    </>
  );
}
