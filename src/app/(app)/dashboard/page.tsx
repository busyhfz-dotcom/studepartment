import { ArrowRight, BookOpen, Network, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { OpportunityCard } from "@/components/opportunity-card";
import { Avatar, Badge, SectionHeading } from "@/components/primitives";
import { ResearcherCard } from "@/components/researcher-card";
import { researchIntelligence } from "@/lib/ai";
import { activity, currentResearcher, opportunities, researchers } from "@/lib/demo-data";

export default async function DashboardPage() {
  const match = await researchIntelligence.explainOpportunityMatch({ researcher: currentResearcher, opportunity: opportunities[0] });

  return (
    <>
      <div className="page-heading dashboard-heading">
        <div><p className="eyebrow">Thursday · Research workspace</p><h1>Good evening, Maya.</h1><p>Your scientific graph has 6 new signals worth reviewing.</p></div>
        <Link className="button button-dark" href="/discover"><Search size={16} /> Discover research</Link>
      </div>

      <section className="metric-grid">
        <article className="metric-card"><span className="metric-icon"><Sparkles size={19} /></span><div><strong>6</strong><span>New relevant signals</span></div><small>Across people + opportunities</small></article>
        <article className="metric-card"><span className="metric-icon"><BookOpen size={19} /></span><div><strong>12</strong><span>Saved opportunities</span></div><small>3 deadlines this month</small></article>
        <article className="metric-card"><span className="metric-icon"><Network size={19} /></span><div><strong>4</strong><span>Active introductions</span></div><small>1 response since yesterday</small></article>
      </section>

      <section className="dashboard-feature panel">
        <div className="feature-context">
          <div className="card-topline"><Badge tone="accent">AI opportunity analysis</Badge><span className="microcopy">Updated from your scientific profile</span></div>
          <p className="eyebrow">Recommended to review</p>
          <h2>{opportunities[0].title}</h2>
          <p>{opportunities[0].institution} · {opportunities[0].location}</p>
          <div className="tag-list">{opportunities[0].topics.map((topic) => <span className="tag" key={topic}>{topic}</span>)}</div>
          <Link className="button button-primary" href={`/opportunities/${opportunities[0].slug}`}>Open analysis <ArrowRight size={16} /></Link>
        </div>
        <div className="match-panel">
          <div className="match-verdict"><span><Sparkles size={17} /></span><div><small>Connection quality</small><strong>{match.verdict}</strong></div></div>
          <p>{match.summary}</p>
          <div className="match-signals">{match.signals.map((signal) => <div key={signal.label}><i className={`signal-${signal.strength}`} /><span><strong>{signal.label}</strong>{signal.detail}</span></div>)}</div>
          <small className="decision-note">{match.caution}</small>
        </div>
      </section>

      <section className="dashboard-section">
        <SectionHeading title="Researchers in your scientific neighborhood" eyebrow="Discovery" action={<Link className="text-link" href="/discover">View discovery <ArrowRight size={14} /></Link>} />
        <div className="card-grid card-grid-2">{researchers.slice(0, 2).map((researcher) => <ResearcherCard researcher={researcher} key={researcher.id} />)}</div>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-section">
          <SectionHeading title="Opportunity watchlist" eyebrow="Intelligence" action={<Link className="text-link" href="/opportunities">All opportunities <ArrowRight size={14} /></Link>} />
          <div className="stack-list">{opportunities.slice(1, 3).map((opportunity) => <OpportunityCard compact opportunity={opportunity} key={opportunity.id} />)}</div>
        </section>
        <section className="dashboard-section">
          <SectionHeading title="Recent activity" eyebrow="Your network" />
          <div className="activity-list">{activity.map((item, index) => <div className="activity-item" key={item.title}><span className="activity-dot">{index + 1}</span><div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.time}</small></div></div>)}</div>
        </section>
      </div>

      <section className="profile-nudge panel">
        <Avatar initials={currentResearcher.initials} />
        <div><strong>Your profile is discoverable and verified.</strong><p>Add one current project and preferred collaboration types to sharpen future recommendations.</p></div>
        <Link className="button button-ghost" href="/profile">Improve scientific profile</Link>
      </section>
    </>
  );
}
