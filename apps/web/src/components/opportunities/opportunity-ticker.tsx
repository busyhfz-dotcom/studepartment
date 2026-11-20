"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PublicOpportunityTicker } from "@/server/opportunities/public-ticker";
import { ShareOpportunity } from "./share-opportunity";
import { setMotion, useMotionPreference } from "@/lib/motion-preference";
import styles from "./opportunity-ticker.module.css";

type TickerEntry = {
  id: string;
  kind: "Position" | "Grant";
  title: string;
  organization: string;
  deadline: string | null;
  deadlineLabel: string;
  isNew: boolean;
};

function buildEntries(ticker: PublicOpportunityTicker): TickerEntry[] {
  const positions: TickerEntry[] = ticker.positions.map((item) => ({
    id: item.id,
    kind: "Position",
    title: item.title,
    organization: item.countryCode ? `${item.organization} · ${item.countryCode}` : item.organization,
    deadline: item.deadline,
    deadlineLabel: item.deadlineLabel,
    isNew: Boolean(item.isNew),
  }));
  const grants: TickerEntry[] = ticker.grants.map((item) => ({
    id: item.id,
    kind: "Grant",
    title: item.title,
    organization: item.countryCode ? `${item.organization} · ${item.countryCode}` : item.organization,
    deadline: item.deadline,
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
  if (days <= 14) return "urgent";
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
function useLiveTicker(initial: PublicOpportunityTicker) {
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
        const response = await fetch("/api/v1/opportunities/ticker", { cache: "no-store" });
        if (!response.ok) return;
        const body = await response.json() as { success: boolean; data?: PublicOpportunityTicker };
        if (cancelled || !body.success || !body.data?.available) return;
        const next = tickerSignature(body.data);
        if (next !== signature.current) {
          signature.current = next;
          setTicker(body.data);
        } else {
          setTicker((current) => ({ ...current, lastCollectedAt: body.data!.lastCollectedAt }));
        }
      } catch {
        // Keep showing the current feed; the next refresh will try again.
      } finally {
        if (!cancelled) setNow(Date.now());
      }
    }
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
  }, []);

  return { ticker, updated: now === null ? null : updatedLabel(ticker.lastCollectedAt, now) };
}

/**
 * The hero "desk" widget: a continuously scrolling list of real live
 * opportunities pulled from the public ticker, click-to-expand into a
 * detail panel — same interaction as the design concept, real data instead
 * of the concept's illustrative sample rows.
 */
export function OpportunityTicker({ ticker: initialTicker, country }: { ticker: PublicOpportunityTicker; country: string }) {
  const { ticker, updated } = useLiveTicker(initialTicker);
  const entries = buildEntries(ticker);
  const [selected, setSelected] = useState<TickerEntry | null>(null);
  const [paused, setPaused] = useState(false);
  const motionEnabled = useMotionPreference("opportunities");
  const playing = motionEnabled && !paused && !selected;

  const countryQuery = country ? "&country=" + encodeURIComponent(country) : "";

  return (
    <aside className={`${styles.heroDesk} ${selected ? styles.isSelected : ""} ${paused ? styles.tickerPaused : ""}`} aria-label="Latest position and grant preview">
      <div className={styles.deskHeading}>
        <span className={styles.liveLabel}>{ticker.available ? <i className={styles.liveDot} aria-hidden="true" /> : null}Latest opportunities</span>
        <span>{ticker.available ? `${ticker.stats.totalPositions} positions · ${ticker.stats.totalGrants} grants` : "Feed unavailable"}</span>
        {entries.length ? <button
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
        >{playing ? "Ⅱ Pause" : motionEnabled ? "▶ Resume" : "▶ Play"}</button> : null}
      </div>
      {entries.length ? (
        <div className={styles.latestList} data-motion={motionEnabled ? "on" : "off"} aria-label="Latest opportunities; touch to pause or select a listing for details" onPointerDown={() => setPaused(true)}>
          <div className={styles.latestTrack} data-user-motion={motionEnabled ? "true" : undefined} style={{ animationDuration: `${entries.length * 8}s` }}>
            {[false, true].map((duplicate) => (
              <div className={styles.latestGroup} aria-hidden={duplicate || undefined} key={duplicate ? "dup" : "orig"}>
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
                        <small data-original-content>{entry.organization}</small>
                      </span>
                      <span className={`${styles.deadline} ${styles[status]}`}>
                        <span className={styles.badge}>{label}</span>
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
        <p className={styles.latestLoading}>{ticker.available ? "No open positions or grants were added in the last 30 days." : "The opportunity feed is unavailable right now."} <Link href="/scanner">Explore official sources in Scanner ↗</Link></p>
      )}

      {selected ? (
        <div className={styles.opportunityDetail} role="region" aria-label="Selected opportunity" aria-live="polite">
          <div className={styles.detailTop}>
            <span>{selected.kind}</span>
            <button type="button" aria-label="Close opportunity details" onClick={() => setSelected(null)}>
              ×
            </button>
          </div>
          <h3>{selected.title}</h3>
          <p>{selected.organization}</p>
          <div className={styles.detailDeadline}>{selected.deadlineLabel}</div>
          <Link className={styles.detailAction} href={`/start?step=detail&kind=${selected.kind === "Grant" ? "grant" : "position"}&opportunity=${encodeURIComponent(selected.id)}${countryQuery}`}>Review this opportunity ↗</Link>
          <ShareOpportunity item={{id:selected.id,title:selected.title,type:selected.kind==='Grant'?'grant':'position'}}/>
        </div>
      ) : null}

      <div className={styles.deskFooter}>
        <span>Published or first listed in the past 30 days{updated ? `, ${updated}` : ""}. <Link href="/sources">See sources</Link></span>
        <Link href="/opportunities">Full search ↗</Link>
      </div>
    </aside>
  );
}

