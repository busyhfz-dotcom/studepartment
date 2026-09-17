import { ArrowLeft, BadgeCheck, BookOpen, Building2, MapPin, Network, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Badge } from "@/components/primitives";
import { researchers } from "@/lib/demo-data";

export default async function ResearcherDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const researcher = researchers.find((entry) => entry.slug === slug);
  if (!researcher) notFound();

  return (
    <>
      <Link className="back-link" href="/discover"><ArrowLeft size={15} /> Back to discovery</Link>
      <section className="profile-hero panel researcher-detail-hero"><Avatar initials={researcher.initials} size="lg" /><div className="profile-hero-main"><div className="profile-name-row"><h1>{researcher.name}</h1>{researcher.verified && <Badge tone="success"><BadgeCheck size={14} /> Verified identity</Badge>}</div><p className="profile-role">{researcher.role}</p><p className="muted-row"><Building2 size={15} /> {researcher.institution}<span>·</span><MapPin size={15} /> {researcher.location}</p><p className="profile-bio">{researcher.bio}</p></div><button className="button button-primary" type="button"><Network size={16} /> Request introduction</button></section>
      <div className="profile-layout">
        <div className="profile-main-column">
          <section className="panel detail-panel"><div className="panel-title"><div><span className="section-icon"><Sparkles size={18} /></span><h2>Scientific context</h2></div></div><h3>Current focus</h3><p>{researcher.currentFocus}</p><h3>Research topics</h3><div className="tag-list">{researcher.topics.map((topic) => <span className="tag tag-strong" key={topic}>{topic}</span>)}</div><h3>Methods</h3><div className="tag-list">{researcher.methods.map((method) => <span className="tag" key={method}>{method}</span>)}</div></section>
          <section className="panel detail-panel"><div className="panel-title"><div><span className="section-icon"><BookOpen size={18} /></span><h2>Research output</h2></div></div><div className="publication-metrics"><div><strong>{researcher.publications}</strong><span>Publications</span></div><div><strong>{researcher.citations}</strong><span>Citations</span></div><div><strong>Verified</strong><span>Identity status</span></div></div></section>
        </div>
        <aside className="profile-side-column"><section className="panel match-reason-card"><p className="eyebrow">Why this appeared</p><h3>Relevant scientific neighborhood</h3><p>This researcher shares adjacent scientific topics and methods with your current profile. The platform surfaces context rather than assigning a universal researcher score.</p><div className="tag-list">{researcher.topics.slice(0, 2).map((topic) => <span className="tag" key={topic}>{topic}</span>)}</div></section></aside>
      </div>
    </>
  );
}
