"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { opportunityPath, type ShareableOpportunity } from "@/lib/opportunity-actions";
import styles from "./opportunity-actions.module.css";

type Counts = { views: number; likes: number; liked: boolean };

async function engagement(id: string, payload: object) {
  const response = await fetch("/api/v1/opportunities/" + encodeURIComponent(id) + "/engagement", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (response.status === 401) return null;
  const body = await response.json() as { success: boolean; data?: Counts };
  if (!response.ok || !body.success || !body.data) throw new Error("Could not update this opportunity.");
  return body.data;
}

export function OpportunitySignals({ item, recordView = false }: { item: ShareableOpportunity; recordView?: boolean }) {
  const [latest, setLatest] = useState<Counts>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const seen = useRef<string | null>(null);
  const liked = latest?.liked ?? item.liked ?? false;
  const views = latest?.views ?? item.views;
  const likes = latest?.likes ?? item.likes ?? 0;

  useEffect(() => {
    if (!recordView) { seen.current = null; return; }
    if (seen.current === item.id) return;
    seen.current = item.id;
    let current = true;
    void engagement(item.id, { action: "view" }).then(data => {
      if (current && data) setLatest(previous => previous ? { ...previous, views: data.views } : data);
    }).catch(() => {});
    return () => { current = false; };
  }, [item.id, recordView]);

  async function toggle() {
    setBusy(true);
    setNotice("");
    try {
      const data = await engagement(item.id, { action: "like", liked: !liked });
      if (data) setLatest(data);
      setNotice(data ? data.liked ? "favorited" : "removed" : "signin");
    } catch {
      setNotice("error");
    } finally {
      setBusy(false);
    }
  }

  return <div className={styles.signals}>
    {views !== undefined ? <span aria-label={views + " total listing views"}>{views.toLocaleString()} views</span> : null}
    <button type="button" className={styles.trigger} aria-pressed={liked} aria-label={liked ? "Unlike opportunity" : "Like opportunity"} disabled={busy} onClick={() => void toggle()}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
        <path d="M20.8 8.6c0 4.1-8.8 9.8-8.8 9.8S3.2 12.7 3.2 8.6a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z" />
      </svg>
      {likes.toLocaleString()} {likes === 1 ? "like" : "likes"}
    </button>
    {notice === "favorited" ? <Link href="/opportunities/favorites">My Favorites</Link> : null}
    {notice === "signin" ? <Link href={"/auth/sign-in?callbackUrl=" + encodeURIComponent(opportunityPath(item))}>Sign in to like</Link> : null}
    {notice === "removed" ? <span role="status">Removed from My Favorites</span> : null}
    {notice === "error" ? <span role="status">Try again in a moment</span> : null}
  </div>;
}
