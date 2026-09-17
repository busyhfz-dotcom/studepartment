import { ArrowLeft, Building2, CalendarDays, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/primitives";
import { researchIntelligence } from "@/lib/ai";
import { currentResearcher, opportunities } from "@/lib/demo-data";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const opportunity = opportunities.find((entry) => entry.slug === slug);
  if (!opportunity) notFound();
  const match = await researchIntelligence.explainOpportunityMatch({ researcher: currentResearcher, opportunity });

  return (
    <>
      <Link className="back-link" href="/opportunities"><ArrowLeft size={15} /> Back to opportunities</Link>
      <section className="opportunity-detail-head panel"><div><div className="card-topline"><Badge tone="accent">{opportunity.kind}</Badge><span className="deadline"><CalendarDays size={14} /> Deadline {opportunity.deadline}</span></div><h1>{opportunity.title}</h1><p className="profile-role">{opportunity.summary}</p><p className="muted-row"><Building2 size={15} /> {opportunity.institution} · {opportunity.lab}<span>·</span><MapPin size={15} /> {opportunity.location}</p><div className="tag-list">{opportunity.topics.map((topic) => <span className="tag tag-strong" key={topic}>{topic}</span>)}</div></div><button className="button button-primary" type="button">Open application</button></section>
      <div className="opportunity-detail-grid">
        <div className="profile-main-column">
          <section className="panel detail-panel"><div className="panel-title"><div><span className="section-icon"><CheckCircle2 size={18} /></span><h2>What the opportunity needs</h2></div></div><ul className="requirement-list">{opportunity.requirements.map((item) => <li key={item}><CheckCircle2 size={16} /> {item}</li>)}</ul><h3>Funding / support</h3><p>{opportunity.funding}</p></section>
        </div>
        <aside className="profile-side-column"><section className="panel fit-analysis"><div className="fit-title"><span className="spark-box"><Sparkles size={17} /></span><div><small>Profile analysis</small><h2>{match.verdict}</h2></div></div><p>{match.summary}</p><div className="match-signals">{match.signals.map((signal) => <div key={signal.label}><i className={`signal-${signal.strength}`} /><span><strong>{signal.label}</strong>{signal.detail}</span></div>)}</div><p className="decision-note">{match.caution}</p></section></aside>
      </div>
    </>
  );
}
