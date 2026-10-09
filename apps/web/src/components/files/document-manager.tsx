"use client";

import { useCallback, useEffect, useState } from "react";
import { FILE_CATEGORIES, fileSize, type FileCategory, type FileLibrary, type FileRecord, type FileScope } from "@/lib/files";
import { FileUpload } from "./file-upload";
import styles from "./files.module.css";

function FileRow({ file, onChanged }: { file: FileRecord; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(file.name);
  const [error, setError] = useState("");
  async function mutate(method: "PATCH" | "DELETE", body?: object) {
    setBusy(true); setError("");
    try {
      const response = await fetch(file.url, { method, headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to update file.");
      setEditing(false); setConfirmDelete(false); onChanged();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to update file."); }
    finally { setBusy(false); }
  }
  return <li className={styles.fileRow}>
    <span className={styles.fileIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8m-8 4h5" /></svg></span>
    <div className={styles.fileCopy}>
      <strong>{file.name}</strong>
      <small>{FILE_CATEGORIES[file.category]} · {fileSize(file.size)} · {file.public ? "Public profile document" : "Private"} · {file.scope}</small>
      <div className={styles.rowActions}>
        <a href={file.url} download>Download</a>
        <button type="button" disabled={busy} onClick={() => setEditing(!editing)}>Rename</button>
        <button type="button" disabled={busy} onClick={() => setConfirmDelete(!confirmDelete)}>Delete</button>
        <button type="button" disabled={busy} onClick={() => void mutate("PATCH", { revokeShares: true })}>Revoke shared access</button>
      </div>
      {editing ? <div className={styles.inlineActions}><input aria-label="Document title" maxLength={180} value={name} onChange={(event) => setName(event.target.value)} /><button type="button" disabled={busy || !name.trim()} onClick={() => void mutate("PATCH", { name })}>Save title</button></div> : null}
      {["profile", "organization"].includes(file.scope) ? <label className={styles.visibility}><input type="checkbox" checked={file.public} disabled={busy} onChange={(event) => void mutate("PATCH", { public: event.target.checked })} /><span>Show on public profile and allow anyone with its link to download</span></label> : null}
      {confirmDelete ? <div className={styles.confirm} role="group" aria-label="Confirm file deletion"><span>Delete this file? Links and attachments will stop working.</span><button type="button" disabled={busy} onClick={() => void mutate("DELETE")}>Delete permanently</button><button type="button" disabled={busy} onClick={() => setConfirmDelete(false)}>Keep file</button></div> : null}
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </div>
  </li>;
}
export function DocumentManager({ scope = "profile", contextId, title = "Documents & evidence", all = false, onBusyChange }: { scope?: FileScope; contextId?: string; title?: string; all?: boolean; onBusyChange?: (delta: number) => void }) {
  const [data, setData] = useState<FileLibrary | null>(null);
  const [category, setCategory] = useState<FileCategory>(scope === "application" ? "application" : scope === "organization" ? "organization" : "cv");
  const [uploadScope, setUploadScope] = useState<FileScope>(scope);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (!all) params.set("scope", scope);
    if (contextId) params.set("contextId", contextId);
    void fetch("/api/v1/files?" + params, { cache: "no-store", signal: controller.signal })
      .then(async (response) => { const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to load files."); return result.data as FileLibrary; })
      .then((result) => { setData(result); setError(""); })
      .catch((error) => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load files."); });
    return () => controller.abort();
  }, [scope, contextId, all, version]);
  const files = data?.files.filter((file) => (file.name + " " + FILE_CATEGORIES[file.category]).toLowerCase().includes(search.toLowerCase())) ?? [];
  return <section className={styles.manager}>
    <div className={styles.header}><div><span className={styles.eyebrow}>Your research files · free</span><h2>{title}</h2><p>Upload from your phone, tablet or computer. Files stay private until you choose to share them.</p></div></div>
    <div className={styles.controls}>
      <label><span>Document type</span><select value={category} disabled={busy} onChange={(event) => setCategory(event.target.value as FileCategory)}>{Object.entries(FILE_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {all ? <label><span>Upload to</span><select value={uploadScope} disabled={busy} onChange={(event) => setUploadScope(event.target.value as FileScope)}><option value="profile">Personal profile</option><option value="organization">Organization profile</option><option value="library">Private library</option></select></label> : null}
      <FileUpload category={category} scope={uploadScope} contextId={contextId} multiple label="Choose files" onUploaded={reload} onBusyChange={(delta) => { setBusy(delta > 0); onBusyChange?.(delta); }} />
    </div>
    <p className={styles.hint}>PDF, Word, Excel, PowerPoint, TXT, CSV and photos · up to 20 MB per file. Uploads are self-reported documents; they do not grant verification.</p>
    {data ? <div className={styles.quota}><span>{fileSize(data.usage.bytes)} of 250 MB · {data.usage.count} / {data.usage.maxCount} files</span><progress aria-label="Storage used" value={data.usage.bytes} max={data.usage.maxBytes} /></div> : null}
    <label className={styles.search}><span>Find a document</span><input type="search" placeholder="Search by title or document type" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    {error ? <p className={styles.error} role="alert">{error} <button type="button" onClick={reload}>Try again</button></p> : null}
    {!data && !error ? <p role="status">Loading your files…</p> : null}
    <ul className={styles.list}>{files.map((file) => <FileRow file={file} key={file.id} onChanged={reload} />)}</ul>
    {data && !files.length ? <p className={styles.empty}>{search ? "No matching documents." : "Your documents will appear here. Choose files above to get started."}</p> : null}
  </section>;
}
