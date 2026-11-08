"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import styles from "./private-conversation.module.css";

type Message = { id: string; body: string; createdAt: string; mine: boolean };
type ConversationData = {
  messages: Message[];
  counterpartName: string;
  blocked: boolean;
  pausedByMe: boolean;
  pausedByOther: boolean;
};
type ApiResult<T> = { success: true; data: T } | { success: false; error?: { message?: string } };

const POLL_MS = 8000;
const MAX_LENGTH = 4000;

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  let json: ApiResult<T> | null = null;
  try {
    json = (await response.json()) as ApiResult<T>;
  } catch {
    throw new Error(fallback);
  }
  if (!response.ok || !json || !json.success) {
    throw new Error((json && !json.success && json.error?.message) || fallback);
  }
  return json.data;
}

function fetchConversation(requestId: string) {
  return fetch(`/api/v1/conversations/${encodeURIComponent(requestId)}`, { cache: "no-store" }).then((response) =>
    readJson<ConversationData>(response, "Conversation unavailable."),
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function PrivateConversation({ requestId }: { requestId: string }) {
  const [data, setData] = useState<ConversationData | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingPause, setUpdatingPause] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastMessageId = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchConversation(requestId);
      setData(next);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Conversation unavailable.");
    }
  }, [requestId]);

  // Poll while the tab is visible; refresh as soon as the reader returns to it.
  useEffect(() => {
    let active = true;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      fetchConversation(requestId)
        .then((next) => {
          if (!active) return;
          setData(next);
          setError("");
        })
        .catch((reason) => {
          if (active) setError(reason instanceof Error ? reason.message : "Conversation unavailable.");
        });
    };
    tick();
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [requestId]);

  // Keep the newest message in view when one arrives.
  useEffect(() => {
    const newest = data?.messages.at(-1)?.id ?? null;
    if (newest && newest !== lastMessageId.current) {
      lastMessageId.current = newest;
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }
  }, [data]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = body.trim();
    if (!text || sending || !data || data.blocked) return;
    setSending(true);
    try {
      const response = await fetch(`/api/v1/conversations/${encodeURIComponent(requestId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, clientId: crypto.randomUUID() }),
      });
      await readJson(response, "Message could not be sent.");
      setBody("");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void send();
  }

  async function togglePause() {
    if (updatingPause) return;
    setUpdatingPause(true);
    try {
      const response = await fetch(`/api/v1/conversations/${encodeURIComponent(requestId)}`, { method: "PATCH" });
      await readJson(response, "Unable to update conversation.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update conversation.");
    } finally {
      setUpdatingPause(false);
    }
  }

  if (!data) {
    return (
      <section className={styles.panel}>
        {error ? (
          <div className={styles.unavailable} role="alert">
            <strong>{error}</strong>
            <p>Private conversations open only after an introduction is accepted, and only the two researchers involved can read them.</p>
            <Link className={styles.secondaryAction} href="/introductions">Back to introductions</Link>
          </div>
        ) : (
          <p className={styles.loading}>Loading conversation…</p>
        )}
      </section>
    );
  }

  const pauseNotice = data.pausedByMe
    ? "You paused this conversation. Neither of you can send messages until you resume it."
    : data.pausedByOther
      ? `${data.counterpartName} paused this conversation. You can read earlier messages, but new messages are on hold.`
      : null;

  return (
    <section className={styles.panel} aria-label={`Private conversation with ${data.counterpartName}`}>
      <header className={styles.header}>
        <div>
          <span className={styles.lock} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
              <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
            </svg>
          </span>
          <div>
            <strong>{data.counterpartName}</strong>
            <small>Visible only to the two of you</small>
          </div>
        </div>
        <button className={styles.secondaryAction} disabled={updatingPause || (data.pausedByOther && !data.pausedByMe)} onClick={togglePause} type="button">
          {data.pausedByMe ? "Resume conversation" : "Pause conversation"}
        </button>
      </header>

      <div aria-live="polite" className={styles.messages} ref={listRef}>
        {data.messages.length === 0 ? (
          <p className={styles.empty}>No messages yet. Start with what you would like to discuss.</p>
        ) : (
          data.messages.map((message) => (
            <article className={`${styles.message} ${message.mine ? styles.mine : styles.theirs}`} key={message.id}>
              <small>
                {message.mine ? "You" : data.counterpartName} · <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
              </small>
              <p>{message.body}</p>
            </article>
          ))
        )}
      </div>

      {pauseNotice ? <p className={styles.notice}>{pauseNotice}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <form className={styles.composer} onSubmit={send}>
        <textarea
          aria-label={`Message ${data.counterpartName}`}
          disabled={data.blocked}
          maxLength={MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={data.blocked ? "Messaging is paused" : "Write a message…"}
          rows={3}
          value={body}
        />
        <div className={styles.composerFooter}>
          <small>{body.length > MAX_LENGTH - 400 ? `${MAX_LENGTH - body.length} characters left` : "Ctrl + Enter to send"}</small>
          <button className="primaryButton" disabled={!body.trim() || sending || data.blocked} type="submit">
            {sending ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>
    </section>
  );
}
