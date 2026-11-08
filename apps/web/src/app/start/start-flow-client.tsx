"use client";
import { LanguagePicker } from "@/components/i18n/language-provider";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OpportunityIntelligenceResponse, OpportunityResult } from "@/lib/api-contracts";
import { readOpportunityPage } from "@/lib/opportunity-pagination";
import styles from "./start.module.css";
import { PathIllustration } from './path-illustration';
import { entryKind, entryDeadlineLabel as deadlineLabel, entryLabels as kindLabels, entrySearchParams, entryCategories, type EntryKind as Kind } from './entry-paths';
import { BrandSymbol } from "@/components/design/research-art";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";
import { CountrySelect } from "@/components/forms/country-select";
import { OpportunityPager } from "@/components/forms/opportunity-pager";
import { ShareOpportunity } from '@/components/opportunities/share-opportunity';
import { DeadlineReminder } from '@/components/opportunities/deadline-reminder';
import { GrantTable } from '@/components/opportunities/grant-table';

type Step = "welcome" | "paths" | "browse" | "detail" | "next" | "institutions";

function kindOf(type: OpportunityResult["type"]): Kind {
  return type === "grant" || type === "masters-scholarship" || type === "phd-scholarship" ? type : "position";
}

function typeLabel(type: OpportunityResult["type"]): string {
  switch (type) {
    case "masters-scholarship": return "Master’s scholarship";
    case "phd-scholarship": return "PhD scholarship";
    case "phd":
      return "PhD position";
    case "postdoc":
      return "Postdoctoral researcher";
    case "fellowship":
      return "Research fellowship";
    case "research-assistantship":
      return "Research assistantship";
    case "collaboration":
      return "Collaboration";
    case "grant":
      return "Funding call";
    default:
      return type;
  }
}

function TopBar() {
  return (
    <header className={styles.topbar}>
        <Link className={styles.brand} href="/start" aria-label="Provenant home">
          <span className={styles.mark}><BrandSymbol /></span>
          <span>
            provenant<b>.</b>
          </span>
        </Link>
      <nav className={styles.topActions} aria-label="Site navigation">
        <LanguagePicker />
        <Link href="/main-site">Main site</Link>
        <Link className={styles.join} href="/auth/sign-in">Join free</Link>
      </nav>
    </header>
  );
}

function FootBar() {
  return (
    <footer className={styles.footbar}>
      <span>Provenant · medical research, worldwide</span>
      <Link href="/opportunities">Open the full opportunity search ↗</Link>
      <span><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></span>
    </footer>
  );
}

export function StartFlow() {
  return <Suspense fallback={<div className={styles.page}><TopBar /><main className={styles.wrap}><p role="status">Loading your page…</p></main></div>}><StartJourney /></Suspense>;
}

function StartJourney() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedStep = searchParams.get("step");
  const step: Step = requestedStep === "paths" || requestedStep === "browse" || requestedStep === "detail" || requestedStep === "next" || requestedStep === "institutions" ? requestedStep : "welcome";
  const requestedKind = searchParams.get("kind");
  const kind: Kind = entryKind(requestedKind);
  const query = searchParams.get("q") ?? "";
  const country = searchParams.get("country") ?? "";
  const page = readOpportunityPage(searchParams.get("page"));
  const opportunityId = searchParams.get("opportunity");
  const [browseResult, setBrowseResult] = useState<{ key: string; data?: OpportunityIntelligenceResponse; error?: string }>();
  const [selectedRecord, setSelected] = useState<OpportunityResult | null>(null);
  const selected = selectedRecord?.id === opportunityId ? selectedRecord : null;
  const [detailFailure, setDetailFailure] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const browseKey = JSON.stringify([kind, query, country, page, searchAttempt]);
  const loading = step === "browse" && browseResult?.key !== browseKey;
  const results = loading ? [] : browseResult?.data?.results ?? [];
  const total = loading ? 0 : browseResult?.data?.totalMatching ?? 0;
  const searchError = loading ? undefined : browseResult?.error;
  const pagination = loading ? undefined : browseResult?.data?.pagination;

  function setStep(nextStep: Step, changes: Record<string, string> = {}) {
    const params = nextStep === "welcome" ? new URLSearchParams() : new URLSearchParams(searchParams.toString());
    if (nextStep !== "welcome") params.set("step", nextStep);
    for (const [key, value] of Object.entries(changes)) value ? params.set(key, value) : params.delete(key);
    router.push(`/start${params.size ? `?${params}` : ""}`, { scroll: true });
  }

  function setFilter(key: "q" | "country", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    params.delete("page");
    window.history.replaceState(null, "", `/start?${params}`);
  }

  function pageHref(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    params.delete("opportunity");
    return `/start?${params}#browse-results`;
  }

  useEffect(() => {
    if ((step !== "detail" && step !== "next") || selected) return;
    if (!opportunityId) return;
    const controller = new AbortController();
    fetch(`/api/v1/opportunities?id=${encodeURIComponent(opportunityId)}&includeStale=true&limit=1`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body) => {
        if (controller.signal.aborted) return;
        const item = body?.success ? body.data.results.find((item: OpportunityResult) => item.id === opportunityId) : null;
        if (item) setSelected(item);
        setDetailFailure(item ? null : opportunityId);
      })
      .catch(() => { if (!controller.signal.aborted) setDetailFailure(opportunityId); });
    return () => controller.abort();
  }, [step, opportunityId, selected]);

  useEffect(() => {
    if (step !== "browse") return;
    const controller = new AbortController();
    const params = entrySearchParams(kind, query, country, page);

    const timeout = window.setTimeout(() => {
      fetch(`/api/v1/opportunities?${params.toString()}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body) => {
        if (controller.signal.aborted) return;
        if (!body?.success) throw new Error(body.error?.message || "The opportunity search could not be completed.");
        setBrowseResult({ key: browseKey, data: body.data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setBrowseResult({ key: browseKey, error: error instanceof Error ? error.message : "Connection interrupted. Try again." });
      });
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [step, kind, query, country, page, browseKey]);

  function openBrowse(nextKind: Kind) {
    setStep("browse", { kind: nextKind, q: "", country: "", opportunity: "", page: "" });
  }

  function openDetail(item: OpportunityResult) {
    setSelected(item);
    setDetailFailure(null);
    setStep("detail", { opportunity: item.id });
  }

  if (step === "welcome") {
    return (
      <div className={styles.page}>
        <ScientificBackdrop className={styles.scienceBackdrop} />
        <TopBar />
        <main className={styles.gatewayWelcome}>
          <div className={styles.gatewayIntro}>
            <span className={styles.eyebrow}>Research careers &amp; funding</span>
            <h1>Your next chapter in research.</h1>
            <p>Discover an opportunity that moves your work forward, or find the people who will shape your next project.</p>
          </div>
          <div className={styles.gatewayGrid}>
            <Link href="/start?step=paths" className={`${styles.gatewayCard} ${styles.gatewayFind}`}>
              <span className={styles.gatewayAudience}>For researchers &amp; future researchers</span>
              <span className={styles.gatewayArt}><PathIllustration /></span>
              <h2>Find grant &amp; position</h2>
              <p>Explore scholarships, research funding and roles for every stage of your research career.</p>
              <span className={styles.gatewayAction}>Explore opportunities <span aria-hidden="true">↗</span></span>
            </Link>
            <Link href="/start?step=institutions" className={`${styles.gatewayCard} ${styles.gatewayPost}`}>
              <span className={styles.gatewayAudience}>For laboratories &amp; institutions</span>
              <span className={styles.gatewayArt}><PathIllustration posting /></span>
              <h2>Post a position</h2>
              <p>Introduce your research team and invite qualified researchers to become part of its next chapter.</p>
              <span className={styles.gatewayAction}>Share an opportunity <span aria-hidden="true">↗</span></span>
            </Link>
          </div>
          <p className={styles.gatewayReassurance}>Explore freely. Create an account when you are ready to save an opportunity or publish a position.</p>
        </main>
        <FootBar />
      </div>
    );
  }

  if (step === "paths") {
    return (
      <div className={styles.page}>
        <ScientificBackdrop className={styles.scienceBackdrop} />
        <TopBar />
        <main className={`${styles.wrap} ${styles.pathwayPage}`}>
          <Link className={styles.back} href="/start">← Back to the entrance</Link>
          <header className={styles.pathwayHeading}>
            <span className={styles.eyebrow}>Find grant &amp; position</span>
            <h1>Choose the opportunity that fits your next step.</h1>
            <p>Start with your career stage. You can refine the subject, location and deadline as you explore.</p>
          </header>
          <div className={styles.pathwayGrid}>
            {entryCategories.map(category=>(
              <article className={styles.pathwayCard} key={category.kind}>
                <Link className={styles.pathwayMain} href={`/start?step=browse&kind=${category.kind}`}>
                  <span className={styles.pathwayAudience}>{category.audience}</span>
                  <h2>{category.title}<span aria-hidden="true">↗</span></h2>
                  <p>{category.description}</p>
                </Link>
                {category.kind==='phd-scholarship' && <Link className={styles.physicianPath} href="/start?step=browse&kind=md-phd-scholarship"><span>For physicians &amp; physician-scientists</span><strong>MD-PhD scholarships &amp; fellowships <span aria-hidden="true">↗</span></strong></Link>}
              </article>
            ))}
          </div>
          <div className={styles.pathwaySupport}><p>Not sure where to begin? Browse the source directories and compare the routes available to you.</p><Link href="/scanner">Explore funding &amp; career sources ↗</Link></div>
        </main>
        <FootBar />
      </div>
    );
  }


  if (step === "institutions") {
    return (
      <div className={styles.page}>
        <ScientificBackdrop className={styles.scienceBackdrop} />
        <TopBar />
        <main className={`${styles.wrap} ${styles.institutionPage} ${styles.fade}`}>
          <button type="button" className={styles.back} onClick={() => setStep("welcome")}>
            ← Back to choices
          </button>
          <span className={styles.eyebrow}>For institutions</span>
          <h1 className={styles.serif}>Introduce your lab’s next research opportunity.</h1>
          <p>
            Describe the role, the research and how to apply. An institutional profile helps candidates understand
            the team behind the opportunity. Laboratories, universities and other research institutions can manage
            their positions from one workspace.
          </p>
          <Link className={styles.primary} href="/auth/sign-up?kind=institution">
            Create an institutional profile ↗
          </Link>
          <Link className={styles.postingExisting} href="/organization/profile">Already have an institutional account? Open your posting workspace ↗</Link>
          <ul className={styles.postingNotes}><li>Introduce your institution and research focus.</li><li>Provide a clear role description, deadline and application route.</li><li>Review and publish positions from your organization profile.</li></ul>
        </main>
        <FootBar />
      </div>
    );
  }

  if (step === "browse") {
    const isGrant = kind === "grant";
    const isPosition = kind === "position";
    return (
      <div className={styles.page}>
        <ScientificBackdrop className={styles.scienceBackdrop} />
        <TopBar />
        <section className={styles.heroCompact}>
          <div className={styles.wrap}>
            <button type="button" className={styles.back} onClick={() => setStep("paths")}>
              ← Back to opportunity categories
            </button>
            <h1 className={styles.serif}>{kindLabels[kind]}</h1>
            <p>
              Search current listings freely. You only need an account to save an opportunity or keep track of its
              deadline.
            </p>
          </div>
        </section>
        <main className={`${styles.wrap} ${styles.browse} ${styles.fade}`}>
          <div className={styles.routeSwitch} role="tablist" aria-label="Opportunity type">
            <button
              type="button"
              role="tab"
              aria-selected={isPosition}
              className={`${styles.routeTile} ${isPosition ? styles.active : ""}`}
              onClick={() => openBrowse("position")}
            >
              <span>
                <b>Positions</b>
                <small>Research roles</small>
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isGrant}
              className={`${styles.routeTile} ${isGrant ? styles.active : ""}`}
              onClick={() => openBrowse("grant")}
            >
              <span>
                <b>Grants for group leaders &amp; PIs</b>
                <small>Research funding</small>
              </span>
            </button>
            {(["masters-scholarship", "phd-scholarship"] as const).map((value) => (
              <button type="button" role="tab" aria-selected={kind === value} className={`${styles.routeTile} ${kind === value ? styles.active : ""}`} onClick={() => openBrowse(value)} key={value}><span><b>{kindLabels[value]}</b><small>Degree funding</small></span></button>
            ))}
            {(kind==='phd-scholarship'||kind==='md-phd-scholarship') && <button type="button" role="tab" aria-selected={kind==='md-phd-scholarship'} className={`${styles.routeTile} ${kind==='md-phd-scholarship'?styles.active:''}`} onClick={()=>openBrowse('md-phd-scholarship')}><span><b>MD-PhD funding</b><small>Physician-scientist training</small></span></button>}
            <span className={styles.routeNote}>Browse freely · no account required</span>
          </div>

          {kind==='masters-scholarship' && <aside className={styles.sourceGuidance}><strong>Consider the programme as well as the award.</strong><p>DAAD programmes are included in these results. Erasmus Mundus funding is offered through individual consortia; check each programme’s current scholarship availability.</p><a href="https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en" target="_blank" rel="noopener noreferrer">Explore the official Erasmus Mundus catalogue ↗</a></aside>}
          {kind==='md-phd-scholarship' && <aside className={styles.sourceGuidance}><strong>Support for the physician-scientist route.</strong><p>NIH F30 fellowships support students already enrolled in eligible dual-degree programmes. Check citizenship or residency, enrolment and sponsor requirements. T32 awards fund institutions; trainee places are offered by the participating programmes.</p><a href="https://www.cancer.gov/grants-training/training/funding/f30" target="_blank" rel="noopener noreferrer">Understand the F30 route ↗</a><a href="https://grants.nih.gov/funding/activity-codes/T32" target="_blank" rel="noopener noreferrer">Explore institutional training through T32 ↗</a></aside>}

          <div className={styles.filterRow}>
            <input
              className={styles.searchbox}
              aria-label="Search opportunities"
              placeholder="Search a topic, role or institution"
              value={query}
              onChange={(event) => {
                setFilter("q", event.target.value);
              }}
            />
            <CountrySelect ariaLabel="Location" anyLabel="Any location" value={country}
              onChange={(value) => {
                setFilter("country", value);
              }} />
          </div>

          <div className={styles.listHead}>
            <div>
              <span className={styles.eyebrow}>{isGrant ? "Funding calls" : isPosition ? "Research roles" : "Degree scholarships"}</span>
              <h2>
                {loading ? "Searching…" : <>{total.toLocaleString("en")} <span>opportunities</span></>}
              </h2>
            </div>
            <p>{kind.includes("scholarship") ? "Funding programmes: confirm country-specific eligibility and application windows at the original source." : "Current listings, each linked to its original source."}</p>
          </div>

          <div className={styles.results} id="browse-results" aria-busy={loading}>
            {searchError ? <div className={styles.empty} role="alert">{searchError} <button type="button" className={styles.primary} onClick={() => setSearchAttempt((value) => value + 1)}>Retry search</button></div> : null}
            {!loading && !searchError && results.length === 0 ? (
              <div className={styles.empty}><p>{query.trim() || country.trim() ? "No opportunities match these filters. Try fewer filters or browse original sources." : `No current ${kindLabels[kind]} are listed.`}</p><Link href="/scanner">Explore official sources in Scanner →</Link></div>
            ) : (
              kind === 'grant' ? (!loading&&!searchError?<GrantTable items={results} params={entrySearchParams(kind,query,country,page).toString()} onReview={openDetail}/>:null) : results.map((item) => (
                <article className={styles.result} key={item.id}>
                  <div>
                    <div className={styles.tags}>
                      <span>{typeLabel(item.type)}</span>
                      <span data-original-content>{item.location}</span>
                    </div>
                    <h3 data-original-content>{item.title}</h3>
                    <p data-original-content>{item.organization}</p>
                  </div>
                  <div className={styles.resultSide}>
                    <small>{deadlineLabel(item)}</small>
                    <button type="button" onClick={() => openDetail(item)} aria-label={`Review ${item.title}`}>
                      Review details ↗
                    </button>
                    <ShareOpportunity item={item}/>
                    <DeadlineReminder items={[item]}/>
                  </div>
                </article>
              ))
            )}
            {pagination ? <OpportunityPager pagination={pagination} pageHref={pageHref} /> : null}
          </div>
        </main>
        <FootBar />
      </div>
    );
  }

  if (step === "detail" && selected) {
    const isGrant = kindOf(selected.type) === "grant";
    const isScholarship = selected.type.includes("scholarship") || kind === "md-phd-scholarship";
    const recordLabel = isScholarship ? "scholarship" : isGrant ? "grant" : "position";
    const applyHref = selected.applicationUrl || selected.sourceUrl;
    return (
      <div className={styles.page}>
        <ScientificBackdrop className={styles.scienceBackdrop} />
        <TopBar />
        <section className={styles.heroCompact}>
          <div className={styles.wrap}>
            <button type="button" className={styles.back} onClick={() => {
              setStep("browse");
            }}>
              ← Back to {kindLabels[kind]}
            </button>
            <h1 data-original-content className={styles.serif}>{selected.title}</h1>
            <p data-original-content>{[selected.organization, selected.location, deadlineLabel(selected)].filter(Boolean).join(" · ")}</p>
          </div>
        </section>
        <main className={`${styles.wrap} ${styles.detail} ${styles.fade}`}>
          <div className={styles.detailGrid}>
            <article className={styles.detailMain}>
              <span className={styles.eyebrow}>
                {typeLabel(selected.type)} / {selected.location}
              </span>
              {selected.description ? (
                <>
                  <h2>About this {isScholarship ? "scholarship" : isGrant ? "funding call" : "role"}</h2>
                  <p data-original-content>{selected.description}</p>
                </>
              ) : null}
              {selected.eligibilityReasons.length ? (
                <>
                  <h2>Eligibility at a glance</h2>
                  <ul>
                    {selected.eligibilityReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {selected.reasons.length ? (
                <>
                  <h2>Why this came up</h2>
                  <ul>
                    {selected.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <a className={styles.official} href={applyHref} target="_blank" rel="noopener noreferrer">
                Official {isScholarship ? "scholarship" : isGrant ? "funding call" : "vacancy"} / application route ↗
              </a>
              <p className={styles.smallprint}>
                Source: {selected.source.name} · last verified {new Date(selected.lastVerifiedAt).toLocaleDateString()}
              </p>
            </article>
            <aside className={styles.detailSide}>
              <span className={styles.eyebrow}>Your next move</span>
              <h3>Keep this on your radar.</h3>
              <p>
                Save this {recordLabel} to come back to it and keep an eye on the deadline. A free
                profile also keeps your CV ready for when you apply.
              </p>
              <div className={styles.detailActions}>
                <ShareOpportunity item={selected}/>
                <DeadlineReminder items={[selected]}/>
                <button type="button" className={styles.primary} onClick={() => setStep("next")}>
                  Track this {recordLabel} <span>↗</span>
                </button>
                <a className={styles.sub} href={applyHref} target="_blank" rel="noopener noreferrer">View contact details at source <span>↗</span></a>
              </div>
              <p className={styles.smallprint}>
                We only show contact details when the original listing includes them. Applications always go through
                the host&apos;s own portal.
              </p>
            </aside>
          </div>
        </main>
        <FootBar />
      </div>
    );
  }

  if (step === "next" && selected) {
    const isGrant = kindOf(selected.type) === "grant";
    const isScholarship = selected.type.includes("scholarship") || kind === "md-phd-scholarship";
    const trackingHref = `/opportunities/saved?save=${encodeURIComponent(selected.id)}`;
    return (
      <div className={styles.page}>
        <ScientificBackdrop className={styles.scienceBackdrop} />
        <TopBar />
        <main className={`${styles.next} ${styles.fade}`}>
          <button type="button" className={styles.back} onClick={() => setStep("detail")}>
            ← Back to opportunity
          </button>
          <div className={styles.nextHero}>
            <span className={styles.eyebrow}>A good next step</span>
            <h1 className={styles.serif}>
              Have your profile <em>ready</em> to go.
            </h1>
            <p>
              You can keep browsing without an account. You&apos;ll need one to save this{" "}
              {isScholarship ? "scholarship or fellowship" : isGrant ? "grant" : "position"}, store your documents or contact a researcher.
            </p>
          </div>
          <div className={styles.nextGrid}>
            <section className={styles.nextCard}>
              <h2>Your researcher profile</h2>
              <p>
                Add your CV{isGrant ? " or funder biosketch" : ""}, research interests and experience once, then reuse
                them for every application.
              </p>
              <p className={styles.smallprint}>Your documents remain private unless you choose to share them.</p>
            </section>
            <section className={styles.nextCard}>
              <h2>{isScholarship ? "Programme enquiries" : isGrant ? "Funder enquiry" : "Research enquiry"}</h2>
              <p>
                {isScholarship
                  ? "Check the programme’s eligibility and application instructions. Contact its named admissions or funding office if you need clarification."
                  : isGrant
                  ? "Contact the named Programme Officer when the funding call lists one."
                  : "If the vacancy invites it, send a concise Expression of Interest to the Principal Investigator or named lab contact."}
              </p>
              <p className={styles.smallprint}>
                Saving an opportunity does not apply for it. Apply through the official portal linked on the listing.
              </p>
            </section>
          </div>
          <div className={styles.planIntro}>
            <span className={styles.eyebrow}>Plans</span>
            <h2>Track what matters to you.</h2>
            <p>Your profile and application tracking are free. Pro adds research tools for when you need them.</p>
          </div>
          <div className={styles.plans}>
            <section className={styles.plan}>
              <span className={styles.label}>Free</span>
              <strong>Everything you need to start</strong>
              <div className={styles.big}>Profile and application tracking</div>
              <small>Save opportunities, track application stages and keep your research experience ready.</small>
              <Link className={styles.primary} href={trackingHref}>
                Continue with Free ↗
              </Link>
            </section>
            <section className={`${styles.plan} ${styles.premium}`}>
              <span className={styles.label}>Pro</span>
              <strong>Deeper research tools</strong>
              <div className={styles.big}>Assistant, Evidence Graph and introductions</div>
              <small>Ask the Research Assistant, see how a researcher&apos;s work connects and request introductions.</small>
              <Link className={styles.primary} href="/billing">View Pro plans ↗</Link>
            </section>
          </div>
        </main>
        <FootBar />
      </div>
    );
  }

  // Restore the selected public listing after refresh without changing the route.
  return (
    <div className={styles.page}>
      <ScientificBackdrop className={styles.scienceBackdrop} />
      <TopBar />
      <main className={`${styles.wrap} ${styles.fade}`} style={{ padding: "60px 0" }}>
        {opportunityId && detailFailure !== opportunityId ? <p role="status">Loading opportunity details…</p> : (
          <>
            <p role="alert">This opportunity is unavailable. You can return to your search or retry this page.</p>
            <button type="button" className={styles.primary} onClick={() => setStep("browse")}>Back to results ↗</button>
          </>
        )}
      </main>
      <FootBar />
    </div>
  );
}
