"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  ApiError,
  ApiSuccess,
  IntroductionAction,
  IntroductionListResponse,
  IntroductionPolicyResponse,
  IntroductionPurpose,
  IntroductionRequestRecord,
} from "@/lib/api-contracts";
import styles from "./page.module.css";

type BoxName = "inbox" | "outbox";
type ListApiResponse = ApiSuccess<IntroductionListResponse> | ApiError;
type PolicyApiResponse = ApiSuccess<IntroductionPolicyResponse> | ApiError;
type ActionApiResponse = ApiSuccess<{ id: string; status: string }> | ApiError;

const purposeLabels: Record<IntroductionPurpose, string> = {
  "research-discussion": "Research discussion",
  collaboration: "Collaboration",
  mentorship: "Mentorship",
  "position-inquiry": "Position inquiry",
  "grant-partnership": "Grant partnership",
  "clinical-project": "Clinical project",
};

const allPurposes = Object.keys(purposeLabels) as IntroductionPurpose[];

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function statusClass(status: IntroductionRequestRecord["status"]) {
  return styles["status_" + status] ?? "";
}

async function fetchIntroductionList(targetBox: BoxName) {
  const response = await fetch("/api/v1/introductions?box=" + targetBox, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = (await response.json()) as ListApiResponse;
  if (!response.ok || !body.success) {
    throw new Error(body.success ? "Unable to load introductions." : body.error.message);
  }
  return body.data.requests;
}

async function fetchIntroductionPolicy() {
  const response = await fetch("/api/v1/introduction-policy", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = (await response.json()) as PolicyApiResponse;
  if (!response.ok || !body.success) {
    throw new Error(body.success ? "Unable to load recipient controls." : body.error.message);
  }
  return body.data;
}

export function IntroductionWorkspace({ initialBox }: { initialBox: BoxName }) {
  const [box, setBox] = useState<BoxName>(initialBox);
  const [requests, setRequests] = useState<IntroductionRequestRecord[]>([]);
  const [policy, setPolicy] = useState<IntroductionPolicyResponse | null>(null);
  const [draftPolicy, setDraftPolicy] = useState<IntroductionPolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchIntroductionList(box)
      .then((nextRequests) => {
        if (!active) return;
        setRequests(nextRequests);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setRequests([]);
        setError(requestError instanceof Error ? requestError.message : "Unable to load introductions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [box]);

  useEffect(() => {
    let active = true;

    void fetchIntroductionPolicy()
      .then((nextPolicy) => {
        if (!active) return;
        setPolicy(nextPolicy);
        setDraftPolicy(nextPolicy);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load recipient controls.");
      })
      .finally(() => {
        if (active) setPolicyLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function changeBox(nextBox: BoxName) {
    if (nextBox === box) return;
    setError(null);
    setLoading(true);
    setBox(nextBox);
  }

  async function performAction(request: IntroductionRequestRecord, action: IntroductionAction) {
    setActionId(request.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/v1/introductions/" + request.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await response.json()) as ActionApiResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Unable to update introduction." : body.error.message);
      }
      setNotice(
        action === "accept"
          ? "Introduction accepted."
          : action === "decline"
            ? "Introduction declined."
            : "Introduction withdrawn.",
      );
      const nextRequests = await fetchIntroductionList(box);
      setRequests(nextRequests);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update introduction.");
    } finally {
      setActionId(null);
    }
  }

  function togglePurpose(purpose: IntroductionPurpose) {
    if (!draftPolicy) return;
    const exists = draftPolicy.allowedPurposes.includes(purpose);
    const allowedPurposes = exists
      ? draftPolicy.allowedPurposes.filter((item) => item !== purpose)
      : [...draftPolicy.allowedPurposes, purpose];
    setDraftPolicy({ ...draftPolicy, allowedPurposes });
  }

  async function savePolicy() {
    if (!draftPolicy) return;
    if (!draftPolicy.allowedPurposes.length) {
      setError("Select at least one introduction purpose.");
      return;
    }
    setSavingPolicy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/v1/introduction-policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(draftPolicy),
      });
      const body = (await response.json()) as PolicyApiResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Unable to save recipient controls." : body.error.message);
      }
      setPolicy(body.data);
      setDraftPolicy(body.data);
      setNotice("Recipient controls updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save recipient controls.");
    } finally {
      setSavingPolicy(false);
    }
  }

  const pendingCount = requests.filter((request) => request.status === "pending").length;

  return (
    <>
      {error ? <div className={styles.errorBanner}>{error}</div> : null}
      {notice ? <div className={styles.noticeBanner}>{notice}</div> : null}

      <section className={styles.controlStrip}>
        <div className={styles.boxTabs} role="tablist" aria-label="Introduction mailbox">
          <button
            aria-selected={box === "inbox"}
            className={box === "inbox" ? styles.tabActive : styles.tab}
            onClick={() => changeBox("inbox")}
            role="tab"
            type="button"
          >
            Inbox
          </button>
          <button
            aria-selected={box === "outbox"}
            className={box === "outbox" ? styles.tabActive : styles.tab}
            onClick={() => changeBox("outbox")}
            role="tab"
            type="button"
          >
            Outbox
          </button>
        </div>

        <div className={styles.queueMeta}>
          <strong>{loading ? "…" : requests.length}</strong>
          <span>{box === "inbox" ? "received requests" : "sent requests"} · {pendingCount} pending</span>
        </div>

        <Link className={styles.discoveryLink} href="/discover">Find researchers</Link>
      </section>

      <div className={styles.workspaceGrid}>
        <section className={styles.requestArea}>
          <div className={styles.sectionHeading}>
            <div>
              <span className="sectionLabel">{box === "inbox" ? "Incoming requests" : "Sent requests"}</span>
              <h2>{box === "inbox" ? "Decide which conversations should open." : "Track controlled outreach without chasing people."}</h2>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingStack}>
              <div className={styles.loadingCard} />
              <div className={styles.loadingCard} />
            </div>
          ) : requests.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>{box === "inbox" ? "No scientific introduction requests yet." : "No introduction requests sent yet."}</strong>
              <p>
                {box === "inbox"
                  ? "Requests will appear here only after they pass your recipient policy and platform guardrails."
                  : "Use Scientific Discovery to find a relevant researcher and review the introduction context before sending."}
              </p>
              {box === "outbox" ? <Link className="primaryButton" href="/discover">Open Discovery</Link> : null}
            </div>
          ) : (
            <div className={styles.requestList}>
              {requests.map((request) => (
                <article className={styles.requestCard} key={request.id}>
                  <div className={styles.requestHeader}>
                    <div>
                      <span className={styles.direction}>{request.direction === "incoming" ? "From" : "To"}</span>
                      <h3>{request.counterpart.fullName}</h3>
                      <p>{request.counterpart.headline} · {request.counterpart.institution}</p>
                    </div>
                    <span className={styles.status + " " + statusClass(request.status)}>{request.status}</span>
                  </div>

                  <div className={styles.requestMeta}>
                    <span>{purposeLabels[request.purpose]}</span>
                    <span>Created {formatDate(request.createdAt)}</span>
                    {request.status === "pending" && request.expiresAt ? <span>Expires {formatDate(request.expiresAt)}</span> : null}
                  </div>

                  <div className={styles.contextQuote}>{request.context}</div>

                  <div className={styles.requestActions}>
                    <Link className={styles.profileLink} href={"/researchers/" + request.counterpart.id}>View scientific profile</Link>
                    {request.status === "pending" && box === "inbox" ? (
                      <>
                        <button
                          className={styles.declineButton}
                          disabled={actionId === request.id}
                          onClick={() => performAction(request, "decline")}
                          type="button"
                        >
                          Decline
                        </button>
                        <button
                          className={styles.acceptButton}
                          disabled={actionId === request.id}
                          onClick={() => performAction(request, "accept")}
                          type="button"
                        >
                          {actionId === request.id ? "Updating…" : "Accept introduction"}
                        </button>
                      </>
                    ) : null}
                    {request.status === "pending" && box === "outbox" ? (
                      <button
                        className={styles.withdrawButton}
                        disabled={actionId === request.id}
                        onClick={() => performAction(request, "withdraw")}
                        type="button"
                      >
                        {actionId === request.id ? "Updating…" : "Withdraw request"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className={styles.policyPanel}>
          <div className={styles.policyHeading}>
            <span className="sectionLabel">Recipient controls</span>
            <h2>Decide what can reach you.</h2>
            <p>These controls apply before a new scientific introduction can be created.</p>
          </div>

          {policyLoading || !draftPolicy ? (
            <div className={styles.policySkeleton} />
          ) : (
            <div className={styles.policyForm}>
              <label className={styles.toggleRow}>
                <span>
                  <strong>Accept introduction requests</strong>
                  <small>Turn off all new incoming requests.</small>
                </span>
                <input
                  checked={draftPolicy.allowIntroductions}
                  onChange={(event) => setDraftPolicy({ ...draftPolicy, allowIntroductions: event.target.checked })}
                  type="checkbox"
                />
              </label>

              <label className={styles.toggleRow}>
                <span>
                  <strong>Verified senders only</strong>
                  <small>Require a verified scientific identity.</small>
                </span>
                <input
                  checked={draftPolicy.requireVerifiedSender}
                  onChange={(event) => setDraftPolicy({ ...draftPolicy, requireVerifiedSender: event.target.checked })}
                  type="checkbox"
                />
              </label>

              <div className={styles.policyField}>
                <span>Accepted purposes</span>
                <div className={styles.purposeGrid}>
                  {allPurposes.map((purpose) => (
                    <label key={purpose}>
                      <input
                        checked={draftPolicy.allowedPurposes.includes(purpose)}
                        onChange={() => togglePurpose(purpose)}
                        type="checkbox"
                      />
                      <span>{purposeLabels[purpose]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className={styles.policyField}>
                <span>Same-sender cooldown</span>
                <div className={styles.numberField}>
                  <input
                    max={180}
                    min={1}
                    onChange={(event) => setDraftPolicy({ ...draftPolicy, cooldownDays: Number(event.target.value) })}
                    type="number"
                    value={draftPolicy.cooldownDays}
                  />
                  <small>days</small>
                </div>
              </label>

              <label className={styles.policyField}>
                <span>Maximum new inbound requests</span>
                <div className={styles.numberField}>
                  <input
                    max={50}
                    min={1}
                    onChange={(event) => setDraftPolicy({ ...draftPolicy, maxInboundPerDay: Number(event.target.value) })}
                    type="number"
                    value={draftPolicy.maxInboundPerDay}
                  />
                  <small>per 24h</small>
                </div>
              </label>

              <button
                className={styles.savePolicyButton}
                disabled={savingPolicy || JSON.stringify(policy) === JSON.stringify(draftPolicy)}
                onClick={savePolicy}
                type="button"
              >
                {savingPolicy ? "Saving…" : "Save recipient controls"}
              </button>

              <p className={styles.policyFootnote}>Subscription level never bypasses recipient controls or anti-spam rules.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
