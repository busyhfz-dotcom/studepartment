"use client";

import { FormEvent, useMemo, useState } from "react";
import type {
  ApiError,
  ApiSuccess,
  ResearchAssistantResponse,
  ResearchAssistantTarget,
} from "@/lib/api-contracts";
import styles from "./page.module.css";

type AssistantApiResponse = ApiSuccess<ResearchAssistantResponse> | ApiError;

const suggestions = [
  "Which researchers in my current evidence context look scientifically complementary, and why?",
  "Which current opportunities overlap my recorded topics or methods, and what eligibility information is still missing?",
  "What institutions in the available evidence have the strongest documented overlap with my research focus?",
];

function targetLabel(target?: ResearchAssistantTarget) {
  if (!target) return "My research workspace";
  if (target.type === "institution") return "Institution-focused context";
  if (target.type === "researcher") return "Researcher-focused context";
  return "Opportunity-focused context";
}

export function ResearchAssistantWorkspace({ target }: { target?: ResearchAssistantTarget }) {
  const [question, setQuestion] = useState(
    target?.type === "institution"
      ? "How does this institution overlap with my Scientific Identity, and what should I review before deciding whether to pursue its researchers or opportunities?"
      : "",
  );
  const [data, setData] = useState<ResearchAssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = question.trim().length >= 8 && !loading;
  const ledgerLabel = useMemo(() => targetLabel(target), [target]);

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/assistant/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          question: question.trim(),
          ...(target ? { target } : {}),
        }),
      });
      const body = (await response.json()) as AssistantApiResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Research Assistant request failed." : body.error.message);
      }
      setData(body.data);
    } catch (requestError) {
      setData(null);
      setError(requestError instanceof Error ? requestError.message : "Research Assistant request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className={styles.composer}>
        <div className={styles.composerMeta}>
          <div>
            <span className="sectionLabel">Grounded assistant</span>
            <strong>{ledgerLabel}</strong>
          </div>
          <div className={styles.guardrails}>
            <span>Canonical context only</span>
            <span>Inline source IDs</span>
            <span>No hidden ranking</span>
          </div>
        </div>

        <form onSubmit={ask}>
          <textarea
            aria-label="Research Assistant question"
            maxLength={1200}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about scientific fit, researchers, institutions, opportunities, or evidence gaps…"
            rows={6}
            value={question}
          />
          <div className={styles.composerFooter}>
            <span>{question.length}/1200</span>
            <button className="primaryButton" disabled={!canSubmit} type="submit">
              {loading ? "Analyzing evidence…" : "Ask Research Assistant"}
            </button>
          </div>
        </form>

        {!target ? (
          <div className={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <button onClick={() => setQuestion(suggestion)} type="button" key={suggestion}>
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.privacyNote}>
        <strong>Provider boundary</strong>
        <p>
          When configured, this request sends your question and the displayed Studepartment source context to the configured AI provider. The server requests non-persistent generation and does not enable external web browsing for this assistant.
        </p>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}

      {data ? (
        <section className={styles.answerGrid}>
          <article className={styles.answer}>
            <div className={styles.answerTopline}>
              <span className="sectionLabel">Grounded answer</span>
              <span>{data.model}</span>
            </div>
            <div className={styles.answerText}>{data.answer}</div>
            <div className={styles.limits}>
              {data.limitations.map((item) => <p key={item}>{item}</p>)}
            </div>
          </article>

          <aside className={styles.sources}>
            <div className={styles.sourceHeader}>
              <span className="sectionLabel">Referenced evidence</span>
              <strong>{data.citations.length} sources</strong>
            </div>
            <div className={styles.sourceList}>
              {data.citations.map((citation) => (
                <article key={citation.id}>
                  <div>
                    <span className={styles.sourceId}>[{citation.id}]</span>
                    <span className={styles["evidence_" + citation.evidence]}>{citation.evidence}</span>
                  </div>
                  <h3>{citation.label}</h3>
                  <p>{citation.detail}</p>
                  <footer>
                    <span>{citation.type}</span>
                    {citation.href ? (
                      <a href={citation.href} rel={citation.href.startsWith("/") ? undefined : "noreferrer"} target={citation.href.startsWith("/") ? undefined : "_blank"}>
                        Open source ↗
                      </a>
                    ) : null}
                  </footer>
                </article>
              ))}
            </div>
          </aside>
        </section>
      ) : (
        <section className={styles.empty}>
          <strong>{loading ? "Building a source-limited answer…" : "No answer generated yet."}</strong>
          <p>The assistant will only use evidence that appears in the returned source ledger. Missing evidence stays missing instead of being filled from model memory.</p>
        </section>
      )}
    </>
  );
}
