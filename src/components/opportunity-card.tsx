import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { Badge } from "@/components/primitives";

export function OpportunityCard({ opportunity, compact = false }: { opportunity: Opportunity; compact?: boolean }) {
  return (
    <article className={`entity-card opportunity-card ${compact ? "compact-card" : ""}`}>
      <div className="card-topline">
        <Badge tone={opportunity.featured ? "accent" : "neutral"}>{opportunity.kind}</Badge>
        <span className="deadline"><CalendarDays size={14} /> {opportunity.deadline}</span>
      </div>
      <div>
        <h3 className="entity-title">{opportunity.title}</h3>
        <p className="entity-role">{opportunity.institution} · {opportunity.lab}</p>
      </div>
      <p className="muted-row"><MapPin size={15} /> {opportunity.location}{opportunity.remote ? " · Remote collaboration supported" : ""}</p>
      {!compact && <p className="card-copy">{opportunity.summary}</p>}
      <div className="tag-list">
        {opportunity.topics.slice(0, 3).map((topic) => <span className="tag" key={topic}>{topic}</span>)}
      </div>
      <div className="card-footer">
        <span className="microcopy">{opportunity.funding}</span>
        <Link className="icon-link" href={`/opportunities/${opportunity.slug}`}>
          Analyze fit <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}
