"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./organization-profile.module.css";

type RecordItem = { id: string; title: string; type: string; status: string; deadline: string | null; sourceUrl: string };
type Option = { slug: string; name: string };
type Data = { opportunities: RecordItem[]; topics: Option[]; methods: Option[]; organizationVerified: boolean };
const types = [
  ["phd", "PhD position"], ["postdoc", "Postdoctoral position"], ["fellowship", "Fellowship"],
  ["grant", "Grant"], ["collaboration", "Collaboration"], ["research-assistantship", "Research assistantship"],
] as const;

export function OrganizationOpportunities() {
  const [data, setData] = useState<Data | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/v1/organization/opportunities", { cache: "no-store" });
    const body = await response.json() as { success: boolean; data?: Data; error?: { message: string } };
    if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message ?? "Could not load postings.");
    setData(body.data);
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/v1/organization/opportunities", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { success: boolean; data?: Data; error?: { message: string } }) => {
        if (!body.success || !body.data) throw new Error(body.error?.message ?? "Could not load postings.");
        if (active) setData(body.data);
      })
      .catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Could not load postings."); });
    return () => { active = false; };
  }, []);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const fields = new FormData(form);
    const payload = {
      title: String(fields.get("title") ?? ""),
      type: String(fields.get("type") ?? ""),
      description: String(fields.get("description") ?? ""),
      city: String(fields.get("city") ?? ""),
      deadline: String(fields.get("deadline") ?? ""),
      sourceUrl: String(fields.get("sourceUrl") ?? ""),
      applicationUrl: String(fields.get("applicationUrl") ?? ""),
      topicSlugs: fields.getAll("topicSlugs").map(String),
      methodSlugs: fields.getAll("methodSlugs").map(String),
    };
    try {
      const response = await fetch("/api/v1/organization/opportunities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as { success: boolean; error?: { message: string } };
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Could not publish opportunity.");
      form.reset();
      await load();
      setMessage("Opportunity published with self-reported source provenance.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not publish opportunity.");
    } finally { setSaving(false); }
  }

  async function changeStatus(id: string, status: "ACTIVE" | "CLOSED", refresh = false) {
    setMessage("");
    try {
      const response = await fetch("/api/v1/organization/opportunities", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      const body = await response.json() as { success: boolean; error?: { message: string } };
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Could not update status.");
      await load();
      setMessage(refresh ? "Posting refreshed." : status === "CLOSED" ? "Posting closed." : "Posting reactivated.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update status."); }
  }

  return <section className={styles.postings}>
    <div className={styles.postingsHeader}><div><span className="sectionLabel">Opportunity publishing · free</span><h2>Publish positions, grants and collaborations</h2><p>Postings are linked to your institutional profile and appear in opportunity discovery. Source evidence remains self-reported until independently verified.</p></div><span>{data?.opportunities.length ?? 0} postings</span></div>
    {message ? <p className={styles.postingMessage} role="status">{message}</p> : null}
    {data?.opportunities.length ? <div className={styles.postingList}>{data.opportunities.map((item) => <article key={item.id}><div><strong>{item.title}</strong><small>{item.type.replaceAll("_", " ")} · {item.status.toLowerCase()} {item.deadline ? " · deadline " + new Date(item.deadline).toLocaleDateString() : ""}</small></div><div><a href={item.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>{item.status === "ACTIVE" ? <button type="button" onClick={() => void changeStatus(item.id, "ACTIVE", true)}>Refresh</button> : null}<button type="button" onClick={() => void changeStatus(item.id, item.status === "ACTIVE" ? "CLOSED" : "ACTIVE")}>{item.status === "ACTIVE" ? "Close" : "Reactivate"}</button></div></article>)}</div> : null}
    <form className={styles.postingForm} onSubmit={publish}>
      <h3>New opportunity</h3>
      <div className={styles.grid}>
        <label><span>Title</span><input name="title" maxLength={220} required placeholder="Postdoctoral Researcher in Immuno-Oncology" /></label>
        <label><span>Type</span><select name="type">{types.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label><span>City</span><input name="city" maxLength={120} placeholder="Optional" /></label>
        <label><span>Deadline</span><input name="deadline" type="date" /></label>
        <label><span>Official posting URL</span><input name="sourceUrl" type="url" required placeholder="https://your-organization.org/careers/..." /></label>
        <label><span>Application URL</span><input name="applicationUrl" type="url" placeholder="Leave blank to use official posting URL" /></label>
      </div>
      <label className={styles.fullField}><span>Description and eligibility</span><textarea name="description" minLength={30} maxLength={6000} rows={5} required placeholder="Explain the work, responsibilities, qualifications, funding and how to apply." /></label>
      {data?.topics.length ? <fieldset className={styles.postingChoices}><legend>Research topics</legend>{data.topics.map((option) => <label key={option.slug}><input name="topicSlugs" type="checkbox" value={option.slug} />{option.name}</label>)}</fieldset> : null}
      {data?.methods.length ? <fieldset className={styles.postingChoices}><legend>Methods</legend>{data.methods.map((option) => <label key={option.slug}><input name="methodSlugs" type="checkbox" value={option.slug} />{option.name}</label>)}</fieldset> : null}
      <button className="primaryButton" type="submit" disabled={saving || !data}>{saving ? "Publishing…" : "Publish opportunity"}</button>
    </form>
  </section>;
}
