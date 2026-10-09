"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApiError, ApiSuccess } from "@/lib/api-contracts";

type SaveResponse = ApiSuccess<{ id: string; opportunityId: string }> | ApiError;

export function SaveOpportunityButton({ opportunityId, className, onSaved }: { opportunityId: string; className?: string; onSaved?: () => Promise<void> }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function save() {
    setState("saving");
    setError("");
    try {
      const response = await fetch("/api/v1/opportunities/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ opportunityId, deadlineAlert: true, alertLeadDays: 7 }),
      });
      if (response.status === 401) {
        router.push(`/auth/sign-in?callbackUrl=${encodeURIComponent(`/opportunities/saved?save=${opportunityId}`)}`);
        setState("idle");
        return;
      }
      const body = (await response.json()) as SaveResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Unable to save." : body.error.message);
      }
      setState("saved");
      await onSaved?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this opportunity.");
      setState("error");
    }
  }

  return <>{state === "saved" ? <Link className={className} href="/opportunities/saved">Saved · View tracker →</Link> : <button className={className} disabled={state === "saving"} onClick={save} type="button">
    {state === "saving" ? "Saving…" : state === "error" ? "Retry save" : "Save opportunity"}
  </button>}{error ? <small role="alert">{error}</small> : null}</>;
}
