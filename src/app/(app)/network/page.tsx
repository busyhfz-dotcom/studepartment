import { ArrowRight, CheckCircle2, Clock3, Network, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Avatar, Badge } from "@/components/primitives";
import { researchers } from "@/lib/demo-data";

export const metadata = { title: "Scientific introductions" };

const introductions = [
  { person: researchers[1], status: "Accepted", tone: "success" as const, context: "Multimodal biomarkers for therapy response", note: "Private conversation is now available." },
  { person: researchers[0], status: "Pending", tone: "warm" as const, context: "T-cell exhaustion in resistant tumors", note: "Sent yesterday · recipient controls whether this opens a conversation." },
];

export default function NetworkPage() {
  return (
    <>
      <div className="page-heading split-heading"><div><p className="eyebrow">Controlled scientific connection</p><h1>Introductions, not inbox noise.</h1><p>Every contact begins with context, intent and recipient consent.</p></div><div className="heading-note"><ShieldCheck size={18} /><span>Private by default</span></div></div>
      <section className="connection-principles panel">
        <div><span><Network size={19} /></span><strong>Discover</strong><p>Find a scientifically relevant person.</p></div><ArrowRight size={17} />
        <div><span><CheckCircle2 size={19} /></span><strong>Explain</strong><p>Review why the connection makes sense.</p></div><ArrowRight size={17} />
        <div><span><Clock3 size={19} /></span><strong>Request</strong><p>Send a contextual introduction request.</p></div><ArrowRight size={17} />
        <div><span><ShieldCheck size={19} /></span><strong>Connect</strong><p>Conversation opens only after acceptance.</p></div>
      </section>
      <section className="dashboard-section"><div className="section-heading"><div><p className="eyebrow">Active</p><h2>Your introductions</h2></div><Link className="button button-dark button-sm" href="/discover">Discover researchers</Link></div>
        <div className="intro-list">{introductions.map(({ person, status, tone, context, note }) => <article className="intro-card" key={person.id}><Avatar initials={person.initials} /><div className="intro-main"><div><h3>{person.name}</h3><Badge tone={tone}>{status}</Badge></div><p>{person.role} · {person.institution}</p><strong>Context: {context}</strong><small>{note}</small></div><Link className="icon-link" href={`/researchers/${person.slug}`}>View context <ArrowRight size={15} /></Link></article>)}</div>
      </section>
    </>
  );
}
