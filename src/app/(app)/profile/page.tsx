import { BadgeCheck, BookOpen, Building2, CheckCircle2, Dna, MapPin, Pencil, ShieldCheck } from "lucide-react";
import { Avatar, Badge } from "@/components/primitives";
import { currentResearcher } from "@/lib/demo-data";

export const metadata = { title: "Scientific profile" };

export default function ProfilePage() {
  return (
    <>
      <div className="profile-hero panel">
        <Avatar initials={currentResearcher.initials} size="lg" />
        <div className="profile-hero-main"><div className="profile-name-row"><h1>{currentResearcher.name}</h1><Badge tone="success"><BadgeCheck size={14} /> Verified</Badge></div><p className="profile-role">{currentResearcher.role}</p><p className="muted-row"><Building2 size={15} /> {currentResearcher.institution}<span>·</span><MapPin size={15} /> {currentResearcher.location}</p><p className="profile-bio">{currentResearcher.bio}</p></div>
        <button className="button button-ghost" type="button"><Pencil size={15} /> Edit profile</button>
      </div>
      <div className="profile-layout">
        <div className="profile-main-column">
          <section className="panel detail-panel"><div className="panel-title"><div><span className="section-icon"><Dna size={18} /></span><h2>Research identity</h2></div><button className="text-link" type="button">Edit</button></div><h3>Current scientific focus</h3><p>{currentResearcher.currentFocus}</p><h3>Research topics</h3><div className="tag-list">{currentResearcher.topics.map((topic) => <span className="tag tag-strong" key={topic}>{topic}</span>)}</div><h3>Methods & capabilities</h3><div className="tag-list">{currentResearcher.methods.map((method) => <span className="tag" key={method}>{method}</span>)}</div></section>
          <section className="panel detail-panel"><div className="panel-title"><div><span className="section-icon"><BookOpen size={18} /></span><h2>Research output</h2></div></div><div className="publication-metrics"><div><strong>{currentResearcher.publications}</strong><span>Publications</span></div><div><strong>{currentResearcher.citations}</strong><span>Citations</span></div><div><strong>7</strong><span>Recent collaborations</span></div></div><div className="empty-detail"><BookOpen size={18} /><div><strong>Publication synchronization ready</strong><p>Connect ORCID to import and verify publications automatically.</p></div><button className="button button-ghost button-sm" type="button">Connect ORCID</button></div></section>
        </div>
        <aside className="profile-side-column">
          <section className="panel profile-score"><div className="score-ring"><span>84%</span></div><h3>Profile signal quality</h3><p>Your profile already provides strong context for discovery.</p><div className="completion-list"><span><CheckCircle2 size={15} /> Identity verified</span><span><CheckCircle2 size={15} /> Research topics</span><span><CheckCircle2 size={15} /> Methods</span><span className="incomplete">○ Current project missing</span></div></section>
          <section className="panel privacy-controls"><span className="section-icon"><ShieldCheck size={18} /></span><h3>Visibility controls</h3><p>Public scientific identity; contact details remain controlled.</p><div><span>Scientific profile</span><Badge tone="success">Public</Badge></div><div><span>Contact details</span><Badge>Controlled</Badge></div><div><span>Private messages</span><Badge>Private</Badge></div></section>
        </aside>
      </div>
    </>
  );
}
