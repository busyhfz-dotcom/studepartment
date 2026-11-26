"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { pendingOpportunityBookmark, type ShareableOpportunity } from "@/lib/opportunity-actions";
import styles from "./opportunity-actions.module.css";

type Counts = { views: number; saves: number; saved: boolean };
type BookmarkUpdate = { id: string; counts: Counts };
const bookmarkChanged = "provenant:opportunity-bookmark-changed";
const compactCount = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

async function engagement(id: string, payload: { action: "view" } | { action: "save"; saved: boolean }) {
  const response = await fetch("/api/v1/opportunities/" + encodeURIComponent(id) + "/engagement", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (response.status === 401) return null;
  const body = await response.json() as { success: boolean; data?: Counts };
  if (!response.ok || !body.success || !body.data) throw new Error("Bookmark could not be updated.");
  return body.data;
}

export function OpportunitySignals({ item, recordView = false }: { item: ShareableOpportunity; recordView?: boolean }) {
  const router = useRouter();
  const [latest, setLatest] = useState<BookmarkUpdate>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const viewRequest = useRef<{ id: string; result: ReturnType<typeof engagement> } | null>(null);
  const counts = latest?.id === item.id ? latest.counts : undefined;
  const saved = counts?.saved ?? item.saved ?? false;
  const views = counts?.views ?? item.views;
  const saves = counts?.saves ?? item.saves ?? 0;

  useEffect(() => {
    function sync(event: Event) {
      const update = (event as CustomEvent<BookmarkUpdate>).detail;
      if (update.id === item.id) setLatest(update);
    }
    window.addEventListener(bookmarkChanged, sync);
    return () => window.removeEventListener(bookmarkChanged, sync);
  }, [item.id]);

  useEffect(() => {
    if (!recordView) { viewRequest.current = null; return; }
    if (viewRequest.current?.id !== item.id) viewRequest.current = { id: item.id, result: engagement(item.id, { action: "view" }) };
    let active = true;
    void viewRequest.current.result.then(data => {
      if (active && data) setLatest(previous => ({
        id: item.id,
        counts: previous?.id === item.id ? { ...previous.counts, views: data.views } : data,
      }));
    }).catch(() => {});
    return () => { active = false; };
  }, [item.id, recordView]);

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const data = await engagement(item.id, { action: "save", saved: !saved });
      if (data) {
        window.dispatchEvent(new CustomEvent<BookmarkUpdate>(bookmarkChanged, { detail: { id: item.id, counts: data } }));
        return;
      }
      try { sessionStorage.setItem(pendingOpportunityBookmark, item.id); } catch { /* The Saved page can ask for confirmation. */ }
      const destination = "/opportunities/saved?" + new URLSearchParams({ save: item.id });
      router.push("/auth/sign-in?" + new URLSearchParams({ callbackUrl: destination }));
    } catch {
      setError("Could not update the bookmark. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const countLabel = saves + (saves === 1 ? " save" : " saves");
  return <div className={styles.signals}>
    {views !== undefined ? <span aria-label={views + " total listing views"}>{views.toLocaleString("en")} views</span> : null}
    <button type="button" className={styles.bookmark} aria-pressed={saved} aria-label="Save opportunity"
      title={error || (saved ? "Remove from Saved" : "Save opportunity") + " · " + countLabel}
      aria-busy={busy} disabled={busy} onClick={() => void toggle()}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill={saved ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M6.5 5.5a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v14l-5.5-3.7-5.5 3.7Z" />
      </svg>
      <span aria-hidden="true">{compactCount.format(saves)}</span>
    </button>
    <span className={styles.signalAnnouncement} role="status">{error || countLabel}</span>
  </div>;
}
