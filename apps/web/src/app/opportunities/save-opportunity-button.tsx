"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pendingOpportunityBookmark } from "@/lib/opportunity-actions";

export function SaveOpportunityButton({ opportunityId, className, onSaved }: { opportunityId: string; className?: string; onSaved?: () => Promise<void> }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function save() {
    setState("saving");
    setError("");
    try {
      const response = await fetch("/api/v1/opportunities/" + encodeURIComponent(opportunityId) + "/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "save", saved: true }),
      });
      if (response.status === 401) {
        try { sessionStorage.setItem(pendingOpportunityBookmark, opportunityId); } catch { /* The Saved page can ask for confirmation. */ }
        const destination = "/opportunities/saved?" + new URLSearchParams({ save: opportunityId });
        router.push("/auth/sign-in?" + new URLSearchParams({ callbackUrl: destination }));
        setState("idle");
        return;
      }
      if (!response.ok) throw new Error("Unable to save this opportunity.");
      setState("saved");
      await onSaved?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this opportunity.");
      setState("error");
    }
  }

  return <><button className={className} disabled={state === "saving" || state === "saved"} onClick={save} type="button">
    {state === "saved" ? "Saved" : state === "saving" ? "Saving…" : state === "error" ? "Retry save" : "Save opportunity"}
  </button>{error ? <small role="alert">{error}</small> : null}</>;
}
