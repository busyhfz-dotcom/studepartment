"use client";

import { uploadedFileId, type FileCategory, type FileRecord, type FileLibrary } from "@/lib/files";
import { createContext, useContext, useState } from "react";
import { FileUpload } from "./file-upload";
import styles from "./files.module.css";
const BusyContext = createContext<((delta: number) => void) | undefined>(undefined);
export const FileUploadBusyProvider = BusyContext.Provider;

export function FileLinkUpload({ value, onChange, category, onBusyChange }: { value?: string | null; onChange: (url: string) => void; category: FileCategory; onBusyChange?: (delta: number) => void }) {
  const parentBusy = useContext(BusyContext);
  const [files, setFiles] = useState<FileRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function chooseExisting() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/v1/files?scope=profile", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to load your files.");
      setFiles((result.data as FileLibrary).files);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to load your files."); }
    finally { setLoading(false); }
  }
  return <div className={styles.inlineFile}>
    <FileUpload scope="profile" category={category} label="Upload supporting file" onUploaded={(file) => onChange(file.url)} onBusyChange={onBusyChange ?? parentBusy} />
    <button type="button" className={styles.textButton} disabled={loading} onClick={() => void chooseExisting()}>{loading ? "Loading…" : "Choose an existing document"}</button>
    {files ? <select aria-label="Existing supporting document" value={uploadedFileId(value) ? value! : ""} onChange={(event) => onChange(event.target.value)}><option value="">Choose a document…</option>{files.map((file) => <option value={file.url} key={file.id}>{file.name}{file.public ? " · public" : " · private"}</option>)}</select> : null}
    {files && !files.length ? <small>No profile documents yet. Upload a file above.</small> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {uploadedFileId(value) ? <a href={value!} download>Download attached document</a> : null}
    <small>Uploads are private. You can publish a selected file from Files &amp; Documents after saving your profile.</small>
  </div>;
}
