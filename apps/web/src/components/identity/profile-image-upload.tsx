"use client";

import { useId, useState, type ChangeEvent } from "react";
import styles from "./profile-image-upload.module.css";

async function preparePhoto(file: File): Promise<Blob> {
  if (file.size < 512 * 1024) return file;
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob && blob.size < file.size ? blob : file), "image/webp", .85));
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfileImageUpload({ value, onChange, onBusyChange, disabled = false, kind = "person" }: {
  value?: string | null;
  onChange: (url: string | null) => void;
  onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
  kind?: "person" | "organization";
}) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    if (file.size > 10 * 1024 * 1024) {
      setError("Choose a photo smaller than 10 MB.");
      input.value = "";
      return;
    }
    setBusy(true);
    onBusyChange(true);
    try {
      const photo = await preparePhoto(file);
      const form = new FormData();
      form.set("file", photo, photo.type === "image/webp" ? "profile.webp" : file.name);
      const response = await fetch("/api/v1/profile-images", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok || !body.success || !body.data?.url) throw new Error(body.error?.message || "The photo could not be uploaded. Try again.");
      onChange(body.data.url);
      setMessage("Photo ready. Save your profile to publish this change.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The photo could not be uploaded. Try again.");
    } finally {
      input.value = "";
      setBusy(false);
      onBusyChange(false);
    }
  }

  return <fieldset className={styles.field} disabled={disabled || busy} aria-busy={busy}>
    <label htmlFor={inputId}>{kind === "organization" ? "Organization photo or logo" : "Profile photo"}</label>
    <input id={inputId} className={styles.fileInput} type="file" accept="image/*" onChange={upload} aria-describedby={`${inputId}-help`} />
    <small id={`${inputId}-help`}>Choose a photo from your phone, tablet or computer. Up to 10 MB; images are optimized automatically.</small>
    {value ? <button type="button" className={styles.remove} onClick={() => { onChange(null); setError(""); setMessage("Photo removed. Save your profile to confirm."); }}>Remove photo</button> : null}
    {busy ? <p role="status">Uploading photo…</p> : message ? <p role="status">{message}</p> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </fieldset>;
}
