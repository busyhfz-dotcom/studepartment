"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PublicOpportunityTicker } from "@/server/opportunities/public-ticker";
import { OpportunityLocationPicker } from "@/components/forms/opportunity-location-picker";
import { OpportunityFilterSelect } from "@/components/forms/opportunity-filter-select";
import { deadlineClosingSoon, opportunitySubjects } from "@/lib/opportunity-filters";
import { ControlIcon } from "@/components/design/control-icon";
import { ShareOpportunity } from "./share-opportunity";
import { ListingActions } from "./listing-actions";
import { Institution } from "./brand-mark";
import { setMotion, useMotionPreference } from "@/lib/motion-preference";
import { useTickerScroll } from "./use-ticker-scroll";
import styles from "./opportunity-ticker.module.css";

type TickerEntry = {
  id: string;
  kind: "Position" | "Grant";
  title: string;
  organization: string;
  organizationWebsite?: string | null;
  deadline: string | null;
  deadlinePrecision?: string;
  deadlineLabel: string;
  isNew: boolean;
};

function buildEntries(ticker: PublicOpportunityTicker): TickerEntry[] {
  const positions: TickerEntry[] = ticker.positions.map((item) => ({
    id: item.id,
    kind: "Position",
    title: item.title,
    organization: item.countryCode ? `${item.organization} · ${item.countryCode}` : item.organization,
    organizationWebsite: item.organizationWebsite,
    deadline: item.deadline,
    deadlinePrecision: item.deadlinePrecision,
    deadlineLabel: item.deadlineLabel,
    isNew: Boolean(item.isNew),
  }));
  const grants: TickerEntry[] = ticker.grants.map((item) => ({
    id: item.id,
    kind: "Grant",
    title: item.title,
    organization: item.countryCode ? `${item.organization} · ${item.countryCode}` : item.organization,
    organizationWebsite: item.organizationWebsite,
    deadline: item.deadline,
    deadlinePrecision: item.deadlinePrecision,
    deadlineLabel: item.deadlineLabel,
    isNew: Boolean(item.isNew),
  }));
  const merged: TickerEntry[] = [];
  const max = Math.max(positions.length, grants.length);
  for (let i = 0; i < max; i += 1) {
    if (positions[i]) merged.push(positions[i]);
    if (grants[i]) merged.push(grants[i]);
  }
  return merged.slice(0, 12);
}

function badgeStatus(deadline: string | null): "urgent" | "soon" | "open" {
  if (!deadline) return "open";
  const days = (new Date(deadline).getTime() - Date.now()) / 86_400_000;
  if (days <= 7) return "urgent";
  if (days <= 42) return "soon";
  return "open";
}

const REFRESH_MS = 3 * 60_000;

function tickerSignature(ticker: PublicOpportunityTicker) {
  return [ticker.stats.totalPositions, ticker.stats.totalGrants, ...ticker.positions.map((item) => item.id), ...ticker.grants.map((item) => item.id)].join("|");
}

function updatedLabel(value: string | null, now: number) {
  if (!value) return null;
  const minutes = Math.max(0, Math.round((now - new Date(value).getTime()) / 60_000));
  if (minutes < 2) return "updated just now";
  if (minutes < 90) return `updated ${minutes} min ago`;
  return `updated ${Math.round(minutes / 60)} h ago`;
}

/**
 * Keeps the feed current while the page is open: re-reads it every few
 * minutes while the tab is visible, and as soon as the tab is shown again.
 */
function useLiveTicker(initial: PublicOpportunityTicker, location: string, subject: string) {
  const requestParams = new URLSearchParams({ location, subject }).toString();
  const [shown, setShown] = useState("");
  const [failed, setFailed] = useState("");
  const [ticker, setTicker] = useState(initial);
  const [now, setNow] = useState<number | null>(null);
  const lastFetch = useRef(0);
  const signature = useRef(tickerSignature(initial));

  useEffect(() => {
    let cancelled = false;
    lastFetch.current = Date.now();
    async function refresh() {
      lastFetch.current = Date.now();
      try {
        const response = await fetch("/api/v1/opportunities/ticker?" + requestParams, { cache: "no-store" });
        if (!response.ok) throw new Error("The opportunity feed is unavailable.");
        const body = await response.json() as { success: boolean; data?: PublicOpportunityTicker };
        if (cancelled) return;
        if (!body.success || !body.data?.available) throw new Error("The opportunity feed is unavailable.");
        setFailed("");
        setShown(requestParams);
        const next = requestParams + tickerSignature(body.data);
        if (next !== signature.current) {
          signature.current = next;
          setTicker(body.data);
        } else {
          setTicker((current) => ({ ...current, lastCollectedAt: body.data!.lastCollectedAt }));
        }
      } catch {
        if (!cancelled && shown !== requestParams) setFailed(requestParams);
      } finally {
        if (!cancelled) setNow(Date.now());
      }
    }
    if (location || subject || shown) void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_MS);
    const clock = setInterval(() => setNow(Date.now()), 60_000);
    function onVisible() {
      if (document.visibilityState === "visible" && Date.now() - lastFetch.current > REFRESH_MS) void refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    const first = setTimeout(() => setNow(Date.now()), 0);
    return () => {
      cancelled = true;
      clearInterval(timer);
      clearInterval(clock);
      clearTimeout(first);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [requestParams, location, subject]);

  const unavailable = failed === requestParams;
  return {
    ticker: unavailable ? { ...ticker, available: false } : ticker,
    filtering: !unavailable && (Boolean(location || subject) || Boolean(shown)) && shown !== requestParams,
    updated: now === null ? null : updatedLabel(ticker.lastCollectedAt, now),
  };
}

/**
 * The hero "desk" widget: a continuously scrolling list of real live
 * opportunities pulled from the public ticker, click-to-expand into a
 * detail panel — same interaction as the design concept, real data instead
 * of the concept's illustrative sample rows.
 */
export function OpportunityTicker({ ticker: initialTicker }: { ticker: PublicOpportunityTicker }) {
  const [personalize, setPersonalize] = useState(false);
  const [preferences, setPreferences] = useState<{ location:string; subject:string }>();
  useEffect(() => { try {
    const raw=localStorage.getItem("provenant.ticker-filters");
    const saved=raw?JSON.parse(raw):null;
    if(typeof saved?.location==="string"&&typeof saved?.subject==="string") setPreferences(saved);
  } catch {} }, []);
  const location = preferences?.location ?? "";
  const activeSubject = preferences?.subject ?? "";
  const { ticker, updated, filtering } = useLiveTicker(initialTicker, location, activeSubject);
  const entries = filtering || !ticker.available ? [] : buildEntries(ticker);
  const [selected, setSelected] = useState<TickerEntry | null>(null);
  const [paused, setPaused] = useState(false);
  const motionEnabled = useMotionPreference("opportunities");
  const playing = motionEnabled && !paused && !selected;
  const scroll = useTickerScroll(playing, entries.length);

  const countryQuery = location ? "&country=" + encodeURIComponent(location) : "";
  function setFeedFilter(key:"location"|"subject", value:string) {
    const next={location,subject:activeSubject,[key]:value};
    setPreferences(next);
    setSelected(null);
    try {localStorage.setItem("provenant.ticker-filters",JSON.stringify(next));} catch {}
  }

  return (
    <aside className={styles.heroDesk} aria-label="Latest position and grant preview">
      <div className={styles.deskHeading}>
        <span className={styles.liveLabel}>{ticker.available ? <i className={styles.liveDot} aria-hidden="true" /> : null}Latest opportunities</span>
        <span>{filtering ? "Updating feed…" : ticker.available ? `${ticker.stats.totalPositions} positions · ${ticker.stats.totalGrants} grants` : "Feed unavailable"}</span>
        <div className={styles.headingControls} role="group" aria-label="Latest opportunities controls">
        <button type="button" className={styles.personalizeButton} aria-label="Personalize latest opportunities" title="Personalize latest opportunities" aria-expanded={personalize} onClick={()=>setPersonalize(!personalize)}><ControlIcon name="filter" /></button>
        {scroll.overflowing ? <button
          type="button"
          className={styles.tickerMotionToggle}
          aria-label={playing ? "Pause opportunity motion" : motionEnabled ? "Resume opportunity motion" : "Play opportunity motion"}
          onClick={() => {
            if (playing) {
              setPaused(true);
            } else {
              setSelected(null);
              setPaused(false);
              if (!motionEnabled) setMotion("opportunities", true);
            }
          }}
        >
          <ControlIcon name={playing ? "pause" : "play"} />
        </button> : null}
        </div>
      </div>
      {personalize ? <div className={styles.personalize}>
        <OpportunityLocationPicker label="Latest opportunities location" value={location} onChange={value=>setFeedFilter("location",value)} />
        <OpportunityFilterSelect icon="subject" aria-label="Latest opportunities subject" value={activeSubject} onChange={event=>setFeedFilter("subject",event.target.value)}>
          <option value="">All subjects</option>{opportunitySubjects.map(([id,label])=><option key={id} value={id}>{label}</option>)}
        </OpportunityFilterSelect>
      </div> : null}
      {entries.length ? (
        <div
          ref={scroll.viewport}
          className={styles.latestList}
          data-manual={scroll.overflowing && !playing}
          data-dragging={scroll.dragging}
          role="group"
          aria-label="Latest opportunities. Drag left or right to browse, or select an opportunity for details."
          tabIndex={scroll.overflowing ? 0 : undefined}
          onPointerEnter={event => { if (event.pointerType === "mouse") scroll.setHovered(true); }}
          onPointerLeave={event => {
            if (event.pointerType === "mouse") scroll.setHovered(false);
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) scroll.endDrag(event);
          }}
          onFocus={() => scroll.setFocused(true)}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) scroll.setFocused(false); }}
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0) return;
            setPaused(true);
            scroll.startDrag(event);
          }}
          onPointerMove={scroll.moveDrag}
          onPointerUp={scroll.endDrag}
          onPointerCancel={scroll.endDrag}
          onLostPointerCapture={scroll.endDrag}
          onClickCapture={scroll.blockDragClick}
          onWheel={event => { if (event.deltaX || event.shiftKey) setPaused(true); }}
          onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") setPaused(true); }}
        >
          <div className={styles.latestTrack}>
            {(motionEnabled && scroll.overflowing ? [false, true] : [false]).map((duplicate) => (
              <div className={styles.latestGroup} ref={duplicate ? undefined : scroll.firstGroup} aria-hidden={duplicate || undefined} key={duplicate ? "dup" : "orig"}>
                {entries.map((entry, index) => {
                  const status = badgeStatus(entry.deadline);
                  const label = status === "urgent" ? "Closing soon" : status === "soon" ? "Plan ahead" : "Time to prepare";
                  return (
                    <div className={styles.tickerItem} key={`${duplicate ? "dup-" : ""}${entry.id}-${index}`}>
                    <button
                      type="button"
                      className={styles.latestRow}
                      tabIndex={duplicate ? -1 : undefined}
                      aria-label={`${entry.kind}: ${entry.title}, ${entry.deadlineLabel}`}
                      onClick={() => setSelected(entry)}
                    >
                      <span>
                        <span className={styles.kind}>{entry.kind}{entry.isNew ? <b className={styles.newChip}>New</b> : null}</span>
                        <strong data-original-content>{entry.title}</strong>
                        <small><Institution name={entry.organization} website={entry.organizationWebsite} /></small>
                      </span>
                      <span className={`${styles.deadline} ${styles[status]}`}>
                        <span className={styles.badge} data-urgent={deadlineClosingSoon(entry.deadline, entry.deadlinePrecision)}>{label}</span>
                        <time>{entry.deadlineLabel}</time>
                      </span>
                    </button>
                    <span className={styles.tickerShare}><ShareOpportunity item={{id:entry.id,title:entry.title,type:entry.kind==='Grant'?'grant':'position'}} tabIndex={duplicate?-1:0}/></span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.latestLoading}>{filtering ? "Loading your feed…" : ticker.available ? "No recent opportunities match this feed." : "The opportunity feed is unavailable right now."} <Link href="/scanner">Explore official sources in Scanner</Link></p>
      )}

      {selected ? (
        <div className={styles.opportunityDetail} role="region" aria-label="Selected opportunity" aria-live="polite">
          <div className={styles.detailTop}>
            <span>{selected.kind}</span>
            <button type="button" aria-label="Close opportunity details" onClick={() => setSelected(null)}>
              <span className={styles.mobileControl} aria-hidden="true">×</span>
              <ControlIcon name="close" className={styles.desktopControl} />
            </button>
          </div>
          <h3>{selected.title}</h3>
          <p><Institution name={selected.organization} website={selected.organizationWebsite} /></p>
          <div className={styles.detailDeadline}>{selected.deadlineLabel}</div>
          <div className={styles.detailActions}>
            <ListingActions
              item={{id:selected.id,title:selected.title,type:selected.kind==='Grant'?'grant':'position',deadline:selected.deadline,deadlinePrecision:selected.deadlinePrecision}}
              primary={<Link href={`/start?step=detail&kind=${selected.kind === "Grant" ? "grant" : "position"}&opportunity=${encodeURIComponent(selected.id)}${countryQuery}`}>Review this opportunity</Link>}
            />
          </div>
        </div>
      ) : null}

      <div className={styles.deskFooter}>
        <span>Published in the past 30 days{updated ? `, ${updated}` : ""}. <Link href="/sources">See sources</Link></span>
        <Link href="/opportunities">Full search</Link>
      </div>
    </aside>
  );
}

