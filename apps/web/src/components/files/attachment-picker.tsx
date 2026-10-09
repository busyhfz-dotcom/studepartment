"use client";

import { useEffect, useState } from "react";
import { fileSize, type FileLibrary, type FileRecord } from "@/lib/files";
import { FileUpload } from "./file-upload";
import styles from "./files.module.css";

export function AttachmentPicker({ selected, onChange, onBusyChange, disabled }: { selected: string[]; onChange: (ids: string[]) => void; onBusyChange: (delta: number) => void; disabled?: boolean }) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/v1/files", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to load documents.");
      return result.data as FileLibrary;
    }).then((data) => { setFiles(data.files); setError(""); }).catch((error) => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load documents."); });
    return () => controller.abort();
  }, [version]);
  return <div className={styles.attachmentPicker}>
    <h3>Supporting documents (optional)</h3>
    <p>Select up to 5 files. Sending this request gives this recipient download access to the selected files. Files remain private to everyone else unless you publish them separately.</p>
    <FileUpload scope="library" category="other" disabled={disabled} onUploaded={(file) => setFiles((current) => [file, ...current])} onBusyChange={onBusyChange} />
    {error ? <p className={styles.error} role="alert">{error} <button type="button" onClick={() => setVersion((v) => v + 1)}>Try again</button></p> : null}
    {files.map((file) => <label className={styles.attachmentOption} key={file.id}><input type="checkbox" checked={selected.includes(file.id)} disabled={disabled || (!selected.includes(file.id) && selected.length >= 5)} onChange={(event) => onChange(event.target.checked ? [...selected, file.id] : selected.filter((id) => id !== file.id))} /><span>{file.name} · {fileSize(file.size)}</span></label>)}
    <small>{selected.length} / 5 selected. You can revoke shared access from Files &amp; Documents.</small>
  </div>;
}
