"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { useRetryCooldown } from "@/lib/use-retry-cooldown";
import styles from "./auth.module.css";

export function PasswordForm({ mode, available = true, token, invalidToken = false }: {
  mode: "request" | "reset"; available?: boolean; token?: string; invalidToken?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const { remaining, onError } = useRetryCooldown();
  const blocked = mode === "request" ? !available : !token || invalidToken;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked || busy || remaining > 0 || done) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (mode === "reset" && password !== String(form.get("confirmation") ?? "")) {
      setMessage("Passwords do not match."); return;
    }
    setBusy(true); setMessage("");
    try {
      const result = mode === "request"
        ? await authClient.requestPasswordReset({ email: String(form.get("email") ?? "").trim(), redirectTo: `${window.location.origin}/auth/reset-password` }, { onError })
        : await authClient.resetPassword({ newPassword: password, token: token! }, { onError });
      if (result.error) setMessage(result.error.message || "The request could not be completed. Please try again.");
      else setDone(true);
    } catch { setMessage("Connection interrupted. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className={styles.page}><section className={styles.panel}>
    <Link href="/start">Provenant</Link>
    <h1>{mode === "request" ? "Recover your password" : "Choose a new password"}</h1>
    {blocked ? <p role="status">{mode === "request" ? "Password recovery is unavailable because email delivery is not enabled. Please return when delivery has been enabled." : "This reset link is missing, invalid or expired. Request a new link."}</p> : null}
    {done ? <p role="status">{mode === "request" ? "If an account exists for this email, a reset link will be sent. Check your inbox and spam folder." : "Your password has been changed. Sign in with the new password."}</p> : <form className={styles.form} method="post" onSubmit={submit}>
      {mode === "request" ? <label><span>Email</span><input name="email" type="email" autoComplete="email" required disabled={blocked} /></label> : <>
        <label><span>New password</span><input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={blocked} /></label>
        <label><span>Confirm new password</span><input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={blocked} /></label>
      </>}
      {message ? <p className={styles.error} role="alert">{message}</p> : null}
      {remaining > 0 ? <p role="status">Retry in {remaining} seconds. Your entries are retained.</p> : null}
      <button className="primaryButton" disabled={blocked || busy || remaining > 0} type="submit">{remaining > 0 ? `Retry in ${remaining}s` : busy ? "Please wait…" : mode === "request" ? "Send reset link" : "Reset password"}</button>
    </form>}
    <p className={styles.switcher}><Link href="/auth/sign-in">Return to sign in</Link>{mode === "reset" && blocked ? <> · <Link href="/auth/forgot-password">Request a new reset link</Link></> : null}</p>
  </section></main>;
}
