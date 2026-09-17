import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Building2,
  Dna,
  FlaskConical,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function HomePage() {
  return (
    <div className="marketing-shell">
      <header className="marketing-nav container">
        <Logo />
        <nav aria-label="Marketing navigation">
          <a href="#platform">Platform</a>
          <a href="#intelligence">Intelligence</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <div className="nav-actions">
          <Link className="text-link" href="/dashboard">Sign in</Link>
          <Link className="button button-dark button-sm" href="/dashboard">Open workspace <ArrowRight size={15} /></Link>
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <div className="hero-kicker"><Sparkles size={14} /> Scientific intelligence, not another social feed</div>
            <h1>Find the research connection that <span>changes what happens next.</span></h1>
            <p>Studepartment connects medical researchers, laboratories and opportunities through verified scientific context, explainable AI and intentional private introductions.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/dashboard">Explore the workspace <ArrowRight size={17} /></Link>
              <Link className="button button-ghost" href="/opportunities">Browse opportunities</Link>
            </div>
            <div className="hero-proof">
              <span><BadgeCheck size={16} /> Verified scientific identity</span>
              <span><ShieldCheck size={16} /> Privacy by design</span>
              <span><BrainCircuit size={16} /> Explainable matching</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Scientific discovery interface preview">
            <div className="visual-glow" />
            <div className="intelligence-window">
              <div className="window-head">
                <div><span className="window-dot" /><span className="window-dot" /><span className="window-dot" /></div>
                <span>Scientific discovery</span>
                <span className="secure-label"><ShieldCheck size={13} /> private</span>
              </div>
              <div className="smart-search"><Search size={18} /><span>tumor immune escape · spatial profiling</span><kbd>↵</kbd></div>
              <p className="window-label">Contextually relevant connections</p>
              <div className="result-stack">
                <div className="mini-result featured-result">
                  <div className="mini-avatar">ER</div>
                  <div><strong>Prof. Elena Rossi <BadgeCheck size={14} /></strong><span>Cancer Immunology · European Institute of Oncology</span><small>Shared: T-cell exhaustion · single-cell RNA-seq</small></div>
                  <span className="alignment-pill">Strong alignment</span>
                </div>
                <div className="connection-thread"><span /><small>Scientific context connects these entities</small><span /></div>
                <div className="mini-result">
                  <div className="mini-icon"><FlaskConical size={18} /></div>
                  <div><strong>Spatial Immuno-Oncology Postdoc</strong><span>Netherlands Cancer Institute</span><small>Methods align with recent research history</small></div>
                  <ArrowRight size={16} />
                </div>
                <div className="mini-result">
                  <div className="mini-icon"><Building2 size={18} /></div>
                  <div><strong>Tumor Microenvironment Program</strong><span>Amsterdam · Translational research lab</span><small>Active in 4 overlapping research topics</small></div>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
            <div className="floating-card floating-card-a"><Dna size={16} /><div><strong>Knowledge graph</strong><span>Context beyond keywords</span></div></div>
            <div className="floating-card floating-card-b"><Network size={16} /><div><strong>Controlled introductions</strong><span>No unsolicited inbox noise</span></div></div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="container trust-inner">
            <span>Built for high-signal medical research environments</span>
            <div><strong>Oncology</strong><strong>Immunology</strong><strong>Clinical Research</strong><strong>Translational Science</strong></div>
          </div>
        </section>

        <section className="marketing-section container" id="platform">
          <div className="marketing-heading">
            <p className="eyebrow">One scientific workspace</p>
            <h2>Discovery, opportunity and collaboration — connected by context.</h2>
            <p>Replace fragmented searches, cold outreach and generic job boards with a research graph that understands scientific identity and intent.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-card-large">
              <span className="feature-icon"><Search size={21} /></span>
              <h3>Semantic scientific discovery</h3>
              <p>Find people, labs and institutions by research context, methods, disease area and current scientific direction — not just exact keywords.</p>
              <div className="feature-demo query-demo"><span>immune escape</span><span>spatial omics</span><span>therapy resistance</span></div>
            </article>
            <article className="feature-card">
              <span className="feature-icon"><Sparkles size={21} /></span>
              <h3>Opportunity intelligence</h3>
              <p>Understand why a PhD, postdoc, grant or collaboration is relevant before spending time on it.</p>
              <div className="signal-bars"><span style={{ width: "92%" }} /><span style={{ width: "74%" }} /><span style={{ width: "61%" }} /></div>
            </article>
            <article className="feature-card">
              <span className="feature-icon"><Network size={21} /></span>
              <h3>Intentional introductions</h3>
              <p>Request a private scientific introduction with clear context instead of sending unrestricted unsolicited messages.</p>
              <div className="intro-flow"><span>Discover</span><i>→</i><span>Explain</span><i>→</i><span>Request</span></div>
            </article>
          </div>
        </section>

        <section className="intelligence-section" id="intelligence">
          <div className="container intelligence-grid">
            <div>
              <p className="eyebrow">Explainable by default</p>
              <h2>AI should help a researcher decide — not decide for them.</h2>
              <p className="lead-copy">Every suggested connection exposes the scientific signals behind it: overlapping topics, compatible methods, collaboration intent and relevant context.</p>
              <ul className="check-list">
                <li><BadgeCheck size={17} /> No opaque researcher leaderboard</li>
                <li><BadgeCheck size={17} /> Clear evidence behind suggestions</li>
                <li><BadgeCheck size={17} /> Human judgment remains in the loop</li>
              </ul>
            </div>
            <div className="explanation-card">
              <div className="explanation-head"><span>Why this matches</span><strong>Strong alignment</strong></div>
              <div className="explanation-signal"><span className="signal-icon">01</span><div><strong>Research context</strong><p>Tumor immunology and biomarker work overlap directly.</p></div></div>
              <div className="explanation-signal"><span className="signal-icon">02</span><div><strong>Method compatibility</strong><p>Spatial transcriptomics appears in both the project and recent methods.</p></div></div>
              <div className="explanation-signal"><span className="signal-icon">03</span><div><strong>Scientific intent</strong><p>The researcher is currently open to relevant translational collaborations.</p></div></div>
              <p className="decision-note">Decision support only — never an automated hiring or eligibility decision.</p>
            </div>
          </div>
        </section>

        <section className="privacy-section container" id="privacy">
          <div className="privacy-card">
            <div><p className="eyebrow">Privacy is architecture</p><h2>Scientific visibility without surrendering control.</h2></div>
            <p>Separate public scientific information, verified identity, controlled contact details and private communication. Researchers choose what becomes discoverable and when an introduction can become a conversation.</p>
            <ShieldCheck size={66} strokeWidth={1.2} />
          </div>
        </section>

        <section className="final-cta container">
          <div><p className="eyebrow">Built for useful connections</p><h2>Make the next research opportunity easier to discover.</h2></div>
          <Link className="button button-primary" href="/dashboard">Enter the demo workspace <ArrowRight size={17} /></Link>
        </section>
      </main>
      <footer className="marketing-footer container"><Logo /><span>Research intelligence infrastructure · MVP foundation</span></footer>
    </div>
  );
}
