"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import styles from "./auth.module.css";

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
      <section className={styles.panel}>
        <Link className={styles.brand} href="/">Studepartment</Link>
        <span className="eyebrow">Trusted scientific identity</span>
        <h1>{isSignUp ? "Create your research account" : "Continue to your scientific workspace"}</h1>
        <p className={styles.intro}>
          {isSignUp
            ? "Your account is the private authorization boundary behind your scientific identity. Public profile data remains separately controlled."
            : "Sign in to edit identity data, manage availability, and access private scientific workflows."}
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

        <p className={styles.switcher}>
          {isSignUp ? "Already have an account? " : "New to Studepartment? "}
          <Link href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>

      <aside className={styles.context}>
        <span className="eyebrow">Privacy by design</span>
        <h2>Account identity is not a scientific ranking.</h2>
        <p>Authentication controls who may change private or user-owned data. Verification and provenance remain explicit scientific signals with their own sources.</p>
        <ul>
          <li>Session → canonical User.id</li>
          <li>User.id → owned ResearcherProfile</li>
          <li>External records → provenance, not silent truth</li>
        </ul>
      </aside>
    </main>
  );
}
