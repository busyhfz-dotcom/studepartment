"use client";

import { useEffect, useRef, useState } from "react";
import { FILE_ACCEPT, FILE_MAX_BYTES, type FileCategory, type FileRecord, type FileScope } from "@/lib/files";
import styles from "./files.module.css";

type Props = {
  category?: FileCategory;
  scope?: FileScope;
  contextId?: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  onUploaded: (file: FileRecord) => void;
  onBusyChange?: (delta: number) => void;
};
export function FileUpload({ category = "other", scope = "profile", contextId, multiple, disabled, label = "Upload document", onUploaded, onBusyChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<XMLHttpRequest | null>(null);
  const callbacks = useRef({ onUploaded, onBusyChange });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => { callbacks.current = { onUploaded, onBusyChange }; }, [onUploaded, onBusyChange]);

  async function upload(files: FileList | null) {
    if (!files?.length || busy) return;
    const selected = Array.from(files);
    if (selected.some((file) => !file.size || file.size > FILE_MAX_BYTES)) { setMessage("Choose non-empty files up to 20 MB each."); if (inputRef.current) inputRef.current.value = ""; return; }
    if (selected.length > 10) { setMessage("Choose up to 10 files at a time."); if (inputRef.current) inputRef.current.value = ""; return; }
    setBusy(true); setMessage(""); onBusyChange?.(1);
    let completed = 0;
    try {
      for (const file of selected) {
        setProgress(0);
        const form = new FormData();
        form.set("file", file); form.set("category", category); form.set("scope", scope);
        if (contextId) form.set("contextId", contextId);
        const uploaded = await new Promise<FileRecord>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          requestRef.current = xhr;
          xhr.open("POST", "/api/v1/files"); xhr.timeout = 120_000;
          xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 95)); };
          xhr.onload = () => {
            try {
              const result = JSON.parse(xhr.responseText);
              if (xhr.status !== 201 || !result.success) reject(new Error(result.error?.message || "Upload failed. Please try again."));
              else resolve(result.data as FileRecord);
            } catch { reject(new Error("The upload could not be completed. Please try again.")); }
          };
          xhr.onerror = () => reject(new Error("Connection interrupted. Please try again."));
          xhr.ontimeout = () => reject(new Error("Upload timed out. Try a smaller file or a stronger connection."));
          xhr.onabort = () => reject(new Error("Upload cancelled. Completed files remain in your library."));
          xhr.send(form);
        });
        callbacks.current.onUploaded(uploaded); completed++; setProgress(100);
      }
      setMessage(completed + (completed === 1 ? " file uploaded privately." : " files uploaded privately."));
    } catch (error) { setMessage((completed ? completed + " uploaded. " : "") + (error instanceof Error ? error.message : "Upload failed.")); }
    finally { requestRef.current = null; setBusy(false); onBusyChange?.(-1); if (inputRef.current) inputRef.current.value = ""; }
  }
  return <div className={styles.upload}>
    <input ref={inputRef} className={styles.fileInput} type="file" accept={FILE_ACCEPT} multiple={multiple} disabled={busy || disabled} aria-label={label} onChange={(event) => void upload(event.target.files)} />
    <div className={styles.uploadActions}>
      <button type="button" className={styles.uploadButton} disabled={busy || disabled} onClick={() => inputRef.current?.click()}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" /></svg>
        {busy ? "Uploading… " + progress + "%" : label}
      </button>
      {busy ? <button type="button" className={styles.textButton} onClick={() => requestRef.current?.abort()}>Cancel upload</button> : null}
    </div>
    {busy ? <progress className={styles.progress} max={100} value={progress} aria-label="Upload progress" /> : null}
    {message ? <p className={styles.message} role="status">{message}</p> : null}
  </div>;
}
