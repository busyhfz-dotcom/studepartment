import { Search, Sparkles } from "lucide-react";
import { OpportunityCard } from "@/components/opportunity-card";
import { opportunities } from "@/lib/demo-data";

export const metadata = { title: "Opportunity intelligence" };

export default function OpportunitiesPage() {
  return (
    <>
      <div className="page-heading split-heading"><div><p className="eyebrow">Opportunity intelligence</p><h1>Opportunities with scientific context.</h1><p>PhD positions, postdocs, fellowships, grants and collaborations interpreted against your profile.</p></div><div className="heading-note"><Sparkles size={17} /><span>Recommendations explain why they appear.</span></div></div>
      <section className="discovery-search panel"><div className="discovery-input"><Search size={19} /><span>Search role, topic, method or institution…</span></div><button className="button button-dark" type="button">Search opportunities</button></section>
      <div className="filter-row"><button className="filter-chip active" type="button">For you</button><button className="filter-chip" type="button">PhD</button><button className="filter-chip" type="button">Postdoc</button><button className="filter-chip" type="button">Fellowship</button><button className="filter-chip" type="button">Grant</button><button className="filter-chip" type="button">Collaboration</button></div>
      <div className="results-meta"><strong>4 opportunities to review</strong><span>Ordered by current profile relevance and recency.</span></div>
      <section className="card-grid card-grid-2">{opportunities.map((opportunity) => <OpportunityCard opportunity={opportunity} key={opportunity.id} />)}</section>
    </>
  );
}
