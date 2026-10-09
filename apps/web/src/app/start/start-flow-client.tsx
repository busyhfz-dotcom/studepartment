"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OpportunityResult } from "@/lib/api-contracts";
import styles from "./start.module.css";
import { BrandSymbol, ResearchOrbit } from "@/components/design/research-art";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";

type Kind = "position" | "grant";
type Step = "welcome" | "browse" | "detail" | "next" | "institutions";

const POSITION_TYPES = ["phd", "postdoc", "fellowship", "research-assistantship", "collaboration"] as const;

function kindOf(type: OpportunityResult["type"]): Kind {
  return type === "grant" ? "grant" : "position";
}

function typeLabel(type: OpportunityResult["type"]): string {
  switch (type) {
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

function deadlineLabel(item: OpportunityResult): string {
  if (!item.deadline) return "Rolling / no fixed deadline";
  try {
    return new Date(item.deadline).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "See source for deadline";
  }
}

function makeRoomForLocationPicker(select: HTMLSelectElement) {
  const pickerHeight = Math.min(320, window.innerHeight * .55, select.options.length * 38 + 14);
  const overflow = select.getBoundingClientRect().bottom + pickerHeight + 12 - window.innerHeight;
  if (overflow > 0) window.scrollBy({ top: overflow, behavior: "instant" });
}

function Stage({ n }: { n: 1 | 2 | 3 | 4 }) {
  const labels = ["Choose", "Explore", "Review", "Next step"];
  return (
    <div className={styles.stage} aria-label="Journey progress">
      {labels.map((label, index) => {
        const step = index + 1;
        const state = step === n ? styles.active : step < n ? styles.done : "";
        return (
          <span key={label}>
            <span className={state}>
              {String(step).padStart(2, "0")} {label}
            </span>
            {index < labels.length - 1 ? <i /> : null}
          </span>
        );
      })}
    </div>
  );
}

function TopBar() {
  return (
    <header className={styles.topbar}>
        <Link className={styles.brand} href="/start" aria-label="Studepartment entry">
          <span className={styles.mark}><BrandSymbol /></span>
          <span>
            studepartment<b>.</b>
          </span>
        </Link>
      <nav className={styles.topActions} aria-label="Site navigation">
        <Link href="/main-site">Main site</Link>
        <Link className={styles.join} href="/auth/sign-in">Join free</Link>
      </nav>
    </header>
  );
}

function FootBar() {
  return (
    <footer className={styles.footbar}>
      <span>Studepartment · medical research, worldwide</span>
      <Link href="/opportunities">Open the full Opportunity Intelligence workspace ↗</Link>
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
  const step: Step = requestedStep === "browse" || requestedStep === "detail" || requestedStep === "next" || requestedStep === "institutions" ? requestedStep : "welcome";
  const kind: Kind = searchParams.get("kind") === "grant" ? "grant" : "position";
  const query = searchParams.get("q") ?? "";
  const country = searchParams.get("country") ?? "";
  const opportunityId = searchParams.get("opportunity");
  const [results, setResults] = useState<OpportunityResult[]>([]);
  const [loading, setLoading] = useState(step === "browse");
  const [selectedRecord, setSelected] = useState<OpportunityResult | null>(null);
  const selected = selectedRecord?.id === opportunityId ? selectedRecord : null;
  const [detailFailure, setDetailFailure] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searchAttempt, setSearchAttempt] = useState(0);

  function setStep(nextStep: Step, changes: Record<string, string> = {}) {
    const params = nextStep === "welcome" ? new URLSearchParams() : new URLSearchParams(searchParams.toString());
    if (nextStep !== "welcome") params.set("step", nextStep);
    for (const [key, value] of Object.entries(changes)) value ? params.set(key, value) : params.delete(key);
    router.push(`/start${params.size ? `?${params}` : ""}`, { scroll: true });
  }

  function setFilter(key: "q" | "country", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    window.history.replaceState(null, "", `/start?${params}`);
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
    const params = new URLSearchParams();
    if (kind === "grant") {
      params.set("type", "grant");
    } else {
      POSITION_TYPES.forEach((type) => params.append("type", type));
    }
    if (query.trim()) params.set("q", query.trim());
    if (country.trim()) params.set("country", country.trim());
    params.set("limit", "24");

    fetch(`/api/v1/opportunities?${params.toString()}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body) => {
        if (controller.signal.aborted) return;
        if (!body?.success) throw new Error(body.error?.message || "The opportunity search could not be completed.");
        setResults(body.data.results as OpportunityResult[]); setSearchError("");
      })
      .catch((error) => {
        if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : "Connection interrupted. Try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [step, kind, query, country, searchAttempt]);

  const countries = useMemo(
    () => Array.from(new Set(results.map((item) => item.location).filter(Boolean))).slice(0, 40),
    [results],
  );

  function openBrowse(nextKind: Kind) {
    setLoading(true);
    setStep("browse", { kind: nextKind, q: "", country: "", opportunity: "" });
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
        <main className={`${styles.welcome} ${styles.fade}`}>
          <div className={styles.wrap}>
            <Stage n={1} />
            <div className={styles.entryHead}>
              <ResearchOrbit />
              <span className={styles.eyebrow}>Welcome / choose your path</span>
              <h1 className={styles.serif}>
                What are you looking for <em>today?</em>
              </h1>
              <p>Pick a path and start browsing. No account needed to explore.</p>
            </div>
            <div className={styles.entryCards}>
              <button type="button" className={styles.choice} onClick={() => openBrowse("position")}>
                <span className={styles.over}>
                  <span>01 / Research roles</span>
                  <span>↗</span>
                </span>
                <strong>Find a position</strong>
                <small>PhD · postdoc · fellowships · research roles</small>
                <span className={styles.foot}>
                  <span>Browse positions</span>
                  <span>→</span>
                </span>
              </button>
              <button type="button" className={styles.choice} onClick={() => openBrowse("grant")}>
                <span className={styles.over}>
                  <span>02 / Funding calls</span>
                  <span>↗</span>
                </span>
                <strong>Find a grant</strong>
                <small>Funding for your next research project</small>
                <span className={styles.foot}>
                  <span>Browse grants</span>
                  <span>→</span>
                </span>
              </button>
            </div>
            <div className={styles.entryFoot}>
              <span>Explore freely. Save or contact a research lead when you&apos;re ready.</span>
              <span className={styles.entryFootLinks}>
                <Link href="/main-site">View the full site ↗</Link>
                <button type="button" onClick={() => setStep("institutions")}>
                  For labs and institutions: post an opportunity ↗
                </button>
              </span>
            </div>
          </div>
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
          <h1 className={styles.serif}>Bring an opportunity to the research community.</h1>
          <p>
            Institutional posting follows its own account route, separate from the applicant journey. Register an
            institutional profile to post positions and grants — including a directory listing in{" "}
            <Link href="/discover/institutions">Institution discovery</Link>.
          </p>
          <Link className={styles.primary} href="/auth/sign-up?kind=institution">
            Create an institutional profile ↗
          </Link>
        </main>
        <FootBar />
      </div>
    );
  }

  if (step === "browse") {
    const isGrant = kind === "grant";
    return (
      <div className={styles.page}>
        <ScientificBackdrop className={styles.scienceBackdrop} />
        <TopBar />
        <section className={styles.heroCompact}>
          <div className={styles.wrap}>
            <Stage n={2} />
            <button type="button" className={styles.back} onClick={() => setStep("welcome")}>
              ← Back to choices
            </button>
            <h1 className={styles.serif}>Explore {isGrant ? <em>grants</em> : <em>research positions</em>}.</h1>
            <p>
              Search live, published opportunities freely. A profile is only needed when you decide to track an
              opportunity or use personal tools.
            </p>
          </div>
        </section>
        <main className={`${styles.wrap} ${styles.browse} ${styles.fade}`}>
          <div className={styles.routeSwitch} role="tablist" aria-label="Opportunity type">
            <button
              type="button"
              role="tab"
              aria-selected={!isGrant}
              className={`${styles.routeTile} ${!isGrant ? styles.active : ""}`}
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
                <b>Grants</b>
                <small>Funding calls</small>
              </span>
            </button>
            <span className={styles.routeNote}>Browse freely · no account required</span>
          </div>

          <div className={styles.filterRow}>
            <input
              className={styles.searchbox}
              aria-label="Search opportunities"
              placeholder="Search a topic, role or institution"
              value={query}
              onChange={(event) => {
                setLoading(true);
                setFilter("q", event.target.value);
              }}
            />
            <select aria-label="Location" data-picker-direction="down" value={country}
              onPointerDown={(event) => makeRoomForLocationPicker(event.currentTarget)}
              onKeyDown={(event) => {
                if ([" ", "Enter", "ArrowDown"].includes(event.key)) makeRoomForLocationPicker(event.currentTarget);
              }}
              onChange={(event) => {
                setLoading(true);
                setFilter("country", event.target.value);
              }}>
              <option value="">Any location</option>
              {countries.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.listHead}>
            <div>
              <span className={styles.eyebrow}>{isGrant ? "Funding calls" : "Research roles"}</span>
              <h2>
                {loading ? "Searching…" : `${results.length} ${isGrant ? "grants" : "positions"} to explore`}
              </h2>
            </div>
            <p>Live listings from Studepartment&apos;s opportunity feed.</p>
          </div>

          <div className={styles.results}>
            {searchError && !loading ? <div className={styles.empty} role="alert">{searchError} <button type="button" className={styles.primary} onClick={() => { setLoading(true); setSearchAttempt((value) => value + 1); }}>Retry search</button></div> : null}
            {!loading && !searchError && results.length === 0 ? (
              <div className={styles.empty}>No opportunities match this search yet. Try a broader term.</div>
            ) : (
              results.map((item) => (
                <article className={styles.result} key={item.id}>
                  <div>
                    <div className={styles.tags}>
                      <span>{typeLabel(item.type)}</span>
                      <span>{item.location}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.organization}</p>
                  </div>
                  <div className={styles.resultSide}>
                    <small>{deadlineLabel(item)}</small>
                    <button type="button" onClick={() => openDetail(item)} aria-label={`Review ${item.title}`}>
                      Review details ↗
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>
        <FootBar />
      </div>
    );
  }

  if (step === "detail" && selected) {
    const isGrant = kindOf(selected.type) === "grant";
    const applyHref = selected.applicationUrl || selected.sourceUrl;
    return (
      <div className={styles.page}>
        <ScientificBackdrop className={styles.scienceBackdrop} />
        <TopBar />
        <section className={styles.hero}>
          <div className={styles.wrap}>
            <Stage n={3} />
            <button type="button" className={styles.back} onClick={() => {
              setLoading(true);
              setStep("browse");
            }}>
              ← Back to {isGrant ? "grants" : "positions"}
            </button>
            <h1 className={styles.serif}>
              The details, <em>before the decision.</em>
            </h1>
            <p>Read the published context first. Your account can come later.</p>
          </div>
        </section>
        <main className={`${styles.wrap} ${styles.detail} ${styles.fade}`}>
          <div className={styles.detailGrid}>
            <article className={styles.detailMain}>
              <span className={styles.eyebrow}>
                {typeLabel(selected.type)} / {selected.location}
              </span>
              <h2 className={styles.detailTitle}>{selected.title}</h2>
              <div className={styles.detailMeta}>
                <span>{selected.organization}</span>
                <span>·</span>
                <span>{selected.location}</span>
                <span>·</span>
                <span>{deadlineLabel(selected)}</span>
              </div>
              {selected.description ? (
                <>
                  <h2>About this {isGrant ? "funding call" : "role"}</h2>
                  <p>{selected.description}</p>
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
                Official {isGrant ? "funding call" : "vacancy"} / application route ↗
              </a>
              <p className={styles.smallprint}>
                Source: {selected.source.name} · last verified {new Date(selected.lastVerifiedAt).toLocaleDateString()}
              </p>
            </article>
            <aside className={styles.detailSide}>
              <span className={styles.eyebrow}>Your next move</span>
              <h3>Keep this on your radar.</h3>
              <p>
                Tracking helps you return to this {isGrant ? "grant" : "position"} and manage deadlines. Creating a
                profile also lets you prepare your academic CV for relevant outreach.
              </p>
              <button type="button" className={styles.primary} onClick={() => setStep("next")}>
                Track this {isGrant ? "grant" : "position"} <span>↗</span>
              </button>
              <a className={styles.sub} href={applyHref} target="_blank" rel="noopener noreferrer">View contact details at source <span>↗</span></a>
              <p className={styles.smallprint}>
                Contact is offered only where the original listing provides an appropriate route. Formal
                applications use the host&apos;s application portal.
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
    const trackingHref = `/opportunities/saved?save=${encodeURIComponent(selected.id)}`;
    return (
      <div className={styles.page}>
        <ScientificBackdrop className={styles.scienceBackdrop} />
        <TopBar />
        <main className={`${styles.next} ${styles.fade}`}>
          <Stage n={4} />
          <button type="button" className={styles.back} onClick={() => setStep("detail")}>
            ← Back to opportunity
          </button>
          <div className={styles.nextHero}>
            <span className={styles.eyebrow}>A good next step</span>
            <h1 className={styles.serif}>
              Make your research <em>context</em> ready.
            </h1>
            <p>
              You can keep browsing freely. An account is needed when you choose to track this{" "}
              {isGrant ? "grant" : "position"}, prepare your materials, or use an available research contact.
            </p>
          </div>
          <div className={styles.nextGrid}>
            <section className={styles.nextCard}>
              <h2>Your researcher profile</h2>
              <p>
                Add an academic CV{isGrant ? " or funder-specific biosketch" : ""}, research interests and relevant
                experience once, then keep them ready for future opportunities.
              </p>
              <p className={styles.smallprint}>Your documents remain private unless you choose to share them.</p>
            </section>
            <section className={styles.nextCard}>
              <h2>{isGrant ? "Funder enquiry" : "Research enquiry"}</h2>
              <p>
                {isGrant
                  ? "Contact the named Programme Officer when the funding call lists one."
                  : "If the vacancy invites it, send a concise Expression of Interest to the Principal Investigator or named lab contact."}
              </p>
              <p className={styles.smallprint}>
                Tracking is never a formal application — apply through the official portal linked on the opportunity.
              </p>
            </section>
          </div>
          <div className={styles.planIntro}>
            <span className={styles.eyebrow}>Choose your pace</span>
            <h2>Track what matters to you.</h2>
            <p>Build your profile and manage applications for free. Explore evidence intelligence only when you need it.</p>
          </div>
          <div className={styles.plans}>
            <section className={styles.plan}>
              <span className={styles.label}>Free</span>
              <strong>Get started at your pace</strong>
              <div className={styles.big}>Profile and application tracking</div>
              <small>Save opportunities, track application stages and keep your research experience ready.</small>
              <Link className={styles.primary} href={trackingHref}>
                Continue with Free ↗
              </Link>
            </section>
            <section className={`${styles.plan} ${styles.premium}`}>
              <span className={styles.label}>Pro intelligence</span>
              <strong>Reason over scientific evidence</strong>
              <div className={styles.big}>Evidence Graph and research tools</div>
              <small>Explore source-grounded research assistance, scientific relationships and controlled introductions.</small>
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
