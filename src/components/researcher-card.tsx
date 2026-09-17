import { ArrowUpRight, BadgeCheck, MapPin } from "lucide-react";
import Link from "next/link";
import type { Researcher } from "@/lib/types";
import { Avatar, Badge } from "@/components/primitives";

export function ResearcherCard({ researcher }: { researcher: Researcher }) {
  return (
    <article className="entity-card researcher-card">
      <div className="card-topline">
        <Avatar initials={researcher.initials} />
        {researcher.collaborationOpen && <Badge tone="success">Open to introductions</Badge>}
      </div>
      <div>
        <h3 className="entity-title">
          {researcher.name}
          {researcher.verified && <BadgeCheck size={17} aria-label="Verified scientific identity" />}
        </h3>
        <p className="entity-role">{researcher.role}</p>
      </div>
      <p className="muted-row"><MapPin size={15} /> {researcher.institution} · {researcher.location}</p>
      <p className="card-copy">{researcher.bio}</p>
      <div className="tag-list">
        {researcher.topics.slice(0, 3).map((topic) => <span className="tag" key={topic}>{topic}</span>)}
      </div>
      <div className="card-footer">
        <span className="microcopy">{researcher.publications} publications · {researcher.citations} citations</span>
        <Link className="icon-link" href={`/researchers/${researcher.slug}`} aria-label={`View ${researcher.name}`}>
          View profile <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}
