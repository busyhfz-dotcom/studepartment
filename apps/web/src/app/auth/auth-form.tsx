"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import styles from "./auth.module.css";
import { BrandSymbol, ResearchOrbit } from "@/components/design/research-art";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";

type Mode = "sign-in" | "sign-up";

function safeCallback(value: string | undefined, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function AuthForm({ mode, callbackUrl }: { mode: Mode; callbackUrl?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const destination = safeCallback(callbackUrl, mode === "sign-up" ? "/onboarding" : "/profile");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    try {
      const result = mode === "sign-up"
        ? await authClient.signUp.email({ name, email, password, callbackURL: destination })
        : await authClient.signIn.email({ email, password, callbackURL: destination });

      if (result.error) {
        setStatus("error");
        setMessage(result.error.message || "Authentication failed.");
        return;
      }

      router.push(destination);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  const isSignUp = mode === "sign-up";

  return (
    <main className={styles.page}>
      <ScientificBackdrop className={styles.motionLayer} tone="light" />
      <section className={styles.panel}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark} aria-hidden="true">
            <svg fill="none" viewBox="0 0 32 32">
              <path d="M9.2 8.8h8.4a5.2 5.2 0 0 1 0 10.4h-3.2a4.6 4.6 0 0 0 0 9.2h8.4" />
              <circle cx="9.2" cy="8.8" r="2.2" />
              <circle cx="22.8" cy="23.8" r="2.2" />
            </svg>
          </span>
          <span>
            <strong>Studepartment</strong>
            <small>Medical Research Intelligence</small>
          </span>
        </Link>
        <span className="eyebrow">Secure research access</span>
        <h1>{isSignUp ? "Create your scientific workspace" : "Return to your research workspace"}</h1>
        <p className={styles.intro}>
          {isSignUp
            ? "Create the private account boundary behind your Scientific Identity, evidence, saved opportunities, introductions, and research workflows."
            : "Sign in to continue your private Scientific Identity, evidence, opportunity, and introduction workflows."}
        </p>

        <form className={styles.form} onSubmit={submit}>
          {isSignUp ? (
            <label>
              <span>Name</span>
              <input name="name" autoComplete="name" maxLength={160} required />
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>Password</span>
            <input
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
            />
            {isSignUp ? <small>Use at least 12 characters.</small> : null}
          </label>

          {message ? <p className={styles.error} role="alert">{message}</p> : null}
          <button className="primaryButton" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        {isSignUp ? (
          <p className={styles.switcher}>
            Already have an account? <Link href="/auth/sign-in">Sign in</Link>
          </p>
        ) : null}
      </section>

      <aside className={styles.context}>
        <Link href="/" className={styles.contextBrand}><span><BrandSymbol /></span>Studepartment.</Link>
        <ResearchOrbit />
        <span className="eyebrow">Research trust architecture</span>
        <h2>Authentication protects identity. Evidence establishes trust.</h2>
        <p>Your account determines who can change user-owned research data. Scientific verification, provenance, and source confidence remain separate evidence layers.</p>
        <ul>
          <li>Session → canonical User.id</li>
          <li>User.id → owned ResearcherProfile</li>
          <li>External records → provenance, not silent truth</li>
        </ul>
      </aside>
    </main>
  );
}
