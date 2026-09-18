"use client";

import { useState } from "react";
import type { ApiError, ApiSuccess } from "@/lib/api-contracts";

type SaveResponse = ApiSuccess<{ id: string; opportunityId: string }> | ApiError;

export function SaveOpportunityButton({ opportunityId, className }: { opportunityId: string; className?: string }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const response = await fetch("/api/v1/opportunities/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ opportunityId, deadlineAlert: true, alertLeadDays: 7 }),
      });
      const body = (await response.json()) as SaveResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Unable to save." : body.error.message);
      }
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <button className={className} disabled={state === "saving" || state === "saved"} onClick={save} type="button">
      {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : state === "error" ? "Retry save" : "Save + 7-day alert"}
    </button>
  );
}
