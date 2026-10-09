"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OrcidImportButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function importProfile() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/v1/profile/orcid/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: true }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message ?? "ORCID import could not finish.");
      router.push(`/profile?orcid=${result.data.partial ? "import-partial" : "public-imported"}`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "ORCID import could not finish."); }
    finally { setBusy(false); }
  }
  return <div><button className="secondary" type="button" disabled={busy} onClick={() => void importProfile()}>{busy ? "Importing public information…" : "Import public ORCID information"}</button>{message ? <p role="alert">{message}</p> : null}</div>;
}
