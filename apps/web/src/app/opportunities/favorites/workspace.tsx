"use client";

import { useState } from "react";
import Link from "next/link";
import { csvCell, opportunityPath } from "@/lib/opportunity-actions";
import styles from "../saved/page.module.css";

type Favorite = { id: string; title: string; type: string; deadline: string | null; deadlinePrecision: string; organization: string; sourceUrl: string; applicationUrl: string | null; open: boolean };

export function Favorites({ initial }: { initial: Favorite[] }) {
  const [items, setItems] = useState(initial);
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState("");
  function exportList() {
    const rows = [["Title", "Type", "Institution", "Due date", "Status", "Source URL", "Application URL"],
      ...items.map(item => [item.title, item.type, item.organization, item.deadline?.slice(0, 10) ?? "", item.open ? "Open" : "Closed", item.sourceUrl, item.applicationUrl ?? item.sourceUrl])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-favorite-opportunities.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function remove(id: string) {
    setPending(id);
    setError("");
    try {
      const result = await fetch("/api/v1/opportunities/" + encodeURIComponent(id) + "/engagement", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"like",liked:false}),
      });
      if (!result.ok) throw new Error("Unable to remove this favorite.");
      setItems(current => current.filter(item => item.id !== id));
    } catch {
      setError("Unable to remove this favorite. Try again.");
    } finally {
      setPending(undefined);
    }
  }
  if (!items.length) return <section className={styles.empty}><p>Like an opportunity to add it here.</p><Link href="/start?step=browse">Browse opportunities ↗</Link></section>;
  return <section className={styles.list} aria-label="My favorite opportunities">
    <button type="button" className="secondary" onClick={exportList}>Export CSV for Excel</button>
    {error ? <p role="alert">{error}</p> : null}
    {items.map(item => <article key={item.id} className={styles.empty}>
      <h2>{item.title}</h2>
      <p>{item.organization} · {item.open ? "Open" : "Closed"}{item.deadline ? " · Due " + item.deadline.slice(0,10) : ""}</p>
      <div className={styles.actions}>
        {item.open ? <Link href={opportunityPath(item)}>Review details ↗</Link> : null}
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Official source ↗</a>
        <button type="button" disabled={pending === item.id} onClick={() => void remove(item.id)}>Remove favorite</button>
      </div>
    </article>)}
  </section>;
}
