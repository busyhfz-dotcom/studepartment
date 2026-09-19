"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  ApiError,
  ApiSuccess,
  IntroductionPurpose,
  ScientificIntroductionPreview,
} from "@/lib/api-contracts";
import styles from "./page.module.css";

type PreviewResponse = ApiSuccess<ScientificIntroductionPreview> | ApiError;
type SendResponse = ApiSuccess<{ id: string; status: "pending"; expiresAt: string }> | ApiError;

const purposeOptions: Array<{ value: IntroductionPurpose; label: string }> = [
  { value: "research-discussion", label: "Research discussion" },
  { value: "collaboration", label: "Collaboration" },
  { value: "mentorship", label: "Mentorship" },
  { value: "position-inquiry", label: "Position inquiry" },
  { value: "grant-partnership", label: "Grant partnership" },
  { value: "clinical-project", label: "Clinical project" },
];

export function IntroductionComposer({ receiverId }: { receiverId: string }) {
  const [purpose, setPurpose] = useState<IntroductionPurpose>("collaboration");
  const [context, setContext] = useState("");
  const [preview, setPreview] = useState<ScientificIntroductionPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ id: string; expiresAt: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreview() {
      setPreviewLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ researcher: receiverId, purpose });
        const response = await fetch("/api/v1/introductions/preview?" + params.toString(), {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const body = (await response.json()) as PreviewResponse;
        if (!response.ok || !body.success) {
          throw new Error(body.success ? "Introduction preview failed." : body.error.message);
        }
        setPreview(body.data);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setPreview(null);
        setError(requestError instanceof Error ? requestError.message : "Introduction preview failed.");
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false);
      }
    }

    void loadPreview();
    return () => controller.abort();
  }, [receiverId, purpose]);

  const remaining = 1200 - context.length;
  const canSend = Boolean(preview?.requestAllowed && context.trim().length >= 80 && context.length <= 1200 && !sendLoading);

  const relevanceLabel = useMemo(() => {
    if (!preview) return "Evaluating scientific context";
    if (preview.relevance === "strong") return "Strong scientific context";
    if (preview.relevance === "relevant") return "Relevant scientific context";
    return "Limited recorded overlap";
  }, [preview]);

  async function sendRequest() {
    if (!canSend) return;
    setSendLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/introductions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ receiverId, purpose, context }),
      });
      const body = (await response.json()) as SendResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Introduction request failed." : body.error.message);
      }
      setSent({ id: body.data.id, expiresAt: body.data.expiresAt });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Introduction request failed.");
    } finally {
      setSendLoading(false);
    }
  }

  if (sent) {
    return (
      <section className={styles.successCard}>
        <span className={styles.successMark}>✓</span>
        <div>
          <span className="sectionLabel">Request created</span>
          <h2>Your scientific introduction is now pending.</h2>
          <p>
            The recipient controls whether the request is accepted. If there is no response, the request expires on{" "}
            {new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(sent.expiresAt))}.
          </p>
          <div className={styles.successActions}>
            <Link className="primaryButton" href="/introductions?box=outbox">Open outbox</Link>
            <Link className="secondary" href="/discover">Return to Discovery</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <section className={styles.previewCard}>
        <div className={styles.personBlock}>
          <span className="sectionLabel">Recipient</span>
          {previewLoading ? (
            <div className={styles.previewSkeleton} />
          ) : preview ? (
            <>
              <h2>{preview.receiver.fullName}</h2>
              <p>{preview.receiver.headline} · {preview.receiver.institution}</p>
              <div className={styles.badgeRow}>
                <span className={styles.availability}>{preview.receiver.availability} availability</span>
                <span className={styles.relevance}>{relevanceLabel}</span>
              </div>
            </>
          ) : (
            <p>Recipient context could not be loaded.</p>
          )}
        </div>

        <div className={styles.contextBlock}>
          <span className="sectionLabel">Why this introduction is relevant</span>
          {previewLoading ? (
            <div className={styles.reasonSkeleton} />
          ) : (
            <ul>
              {(preview?.reasons ?? []).map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          )}
        </div>
      </section>

      <section className={styles.formCard}>
        <label className={styles.field}>
          <span>Purpose</span>
          <select onChange={(event) => setPurpose(event.target.value as IntroductionPurpose)} value={purpose}>
            {purposeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className={styles.field}>
          <span>Specific scientific context</span>
          <textarea
            maxLength={1200}
            onChange={(event) => setContext(event.target.value)}
            placeholder="Explain the specific scientific overlap, what you are working on, and what you are asking this researcher to consider."
            rows={7}
            value={context}
          />
          <small className={styles.counter}>
            {context.trim().length < 80 ? "Minimum 80 characters · " : ""}
            {remaining} characters remaining
          </small>
        </label>

        <div className={preview?.requestAllowed ? styles.guardrail : styles.guardrailBlocked}>
          <strong>{preview?.requestAllowed ? "Request guardrails" : "Request currently blocked"}</strong>
          {preview?.blockReason ? <p>{preview.blockReason}</p> : null}
          <ul>
            {(preview?.guardrails ?? [
              "Availability, recipient policy, duplicate checks, cooldowns, and rate limits are evaluated before sending.",
            ]).map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
          </ul>
        </div>

        <div className={styles.actions}>
          <Link className="secondary" href={"/researchers/" + receiverId}>Cancel</Link>
          <button className="primaryButton" disabled={!canSend} onClick={sendRequest} type="button">
            {sendLoading ? "Sending…" : "Send introduction request"}
          </button>
        </div>
      </section>
    </>
  );
}
