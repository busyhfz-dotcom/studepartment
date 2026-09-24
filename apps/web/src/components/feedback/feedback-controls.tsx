"use client";

import { useState } from "react";
import type {
  ApiError,
  ApiSuccess,
  FeedbackEntityTypeValue,
  FeedbackRecord,
  FeedbackSignalValue,
} from "@/lib/api-contracts";
import styles from "./feedback-controls.module.css";

type FeedbackResponse = ApiSuccess<FeedbackRecord> | ApiError;

const labels: Record<FeedbackSignalValue, string> = {
  relevant: "Relevant",
  "not-relevant": "Not relevant",
  "already-know": "Already know",
  "wrong-career-stage": "Wrong career stage",
  "wrong-field": "Wrong field",
  "not-available": "Not available",
};

function options(entityType: FeedbackEntityTypeValue): FeedbackSignalValue[] {
  if (entityType === "researcher") {
    return ["relevant", "not-relevant", "already-know", "wrong-career-stage", "wrong-field", "not-available"];
  }
  if (entityType === "opportunity") {
    return ["relevant", "not-relevant", "wrong-career-stage", "wrong-field"];
  }
  return ["relevant", "not-relevant", "wrong-field"];
}

export function FeedbackControls({
  entityType,
  entityId,
}: {
  entityType: FeedbackEntityTypeValue;
  entityId: string;
}) {
  const [signal, setSignal] = useState<FeedbackSignalValue | "">("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function save(nextSignal: FeedbackSignalValue) {
    setSignal(nextSignal);
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ entityType, entityId, signal: nextSignal }),
      });
      const body = (await response.json()) as FeedbackResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Feedback could not be saved." : body.error.message);
      }
      setStatus("saved");
      setMessage("Private preference saved.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Feedback could not be saved.");
    }
  }

  return (
    <div className={styles.wrap}>
      <label>
        <span>Private result preference</span>
        <select
          aria-label={"Private feedback for " + entityType}
          disabled={status === "saving"}
          onChange={(event) => {
            const value = event.target.value as FeedbackSignalValue | "";
            if (value) void save(value);
          }}
          value={signal}
        >
          <option value="">Adjust future results…</option>
          {options(entityType).map((value) => <option key={value} value={value}>{labels[value]}</option>)}
        </select>
      </label>
      {message ? <small className={status === "error" ? styles.error : styles.message}>{message}</small> : null}
    </div>
  );
}
