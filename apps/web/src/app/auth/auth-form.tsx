"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { useRetryCooldown } from "@/lib/use-retry-cooldown";
import { safeReturnPath } from "@/lib/navigation";
import type { IndividualProfileRole, InstitutionalOrganizationType } from "@/lib/api-contracts";
import styles from "./auth.module.css";
import { BrandSymbol, ResearchOrbit } from "@/components/design/research-art";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";

type AuthMode = "sign-in" | "sign-up";
type AccountKind = "individual" | "institution";

const individualRoles: Array<[IndividualProfileRole, string, string]> = [
  ["student", "Student", "Degree, thesis and graduation details"],
  ["researcher", "Researcher", "Research role, methods and current work"],
  ["professor", "Professor / faculty", "Department, supervision and academic role"],
];

const organizationTypes: Array<[InstitutionalOrganizationType, string]> = [
  ["university", "University"],
  ["hospital", "Hospital"],
  ["laboratory", "Laboratory"],
  ["research-institute", "Research institute"],
  ["company", "Company"],
  ["foundation", "Foundation"],
];

export function AuthForm({
  callbackUrl,
  mode = "sign-in",
  initialKind = "individual",
  initialRole = "researcher",
  initialOrganizationType = "university",
  availability,
}: {
  callbackUrl?: string;
  mode?: AuthMode;
  initialKind?: AccountKind;
  initialRole?: IndividualProfileRole;
  initialOrganizationType?: InstitutionalOrganizationType;
  availability?: ReactNode;
}) {
  const router = useRouter();
  const { remaining, onError } = useRetryCooldown();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [signUpStep, setSignUpStep] = useState<"identity" | "credentials">("identity");
  const [accountKind, setAccountKind] = useState<AccountKind>(initialKind);
  const [accountRole, setAccountRole] = useState<IndividualProfileRole>(initialRole);
  const [organizationType, setOrganizationType] = useState<InstitutionalOrganizationType>(initialOrganizationType);
  const [showPassword, setShowPassword] = useState(false);
  const signInDestination = safeReturnPath(callbackUrl);
  const onboardingPath = accountKind === "individual"
    ? `/onboarding?role=${encodeURIComponent(accountRole)}`
    : `/onboarding/organization?type=${encodeURIComponent(organizationType)}`;
  const returnQuery = callbackUrl ? `callbackUrl=${encodeURIComponent(signInDestination)}` : "";
  const signUpDestination = onboardingPath + (returnQuery ? `&${returnQuery}` : "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading" || remaining > 0) return;
    setStatus("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    const passwordConfirmation = String(form.get("passwordConfirmation") ?? "");
    try {
      if (mode === "sign-up" && form.get("termsAccepted") !== "on") {
        setStatus("error");
        setMessage("Please accept the Terms of Use and acknowledge the Privacy Notice to create an account.");
        return;
      }

      if (mode === "sign-up" && password !== passwordConfirmation) {
        setStatus("error");
        setMessage("Passwords do not match.");
        return;
      }

      const result = mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name, callbackURL: signUpDestination }, { onError })
        : await authClient.signIn.email({ email, password, callbackURL: signInDestination }, { onError });

      if (result.error) {
        setStatus("error");
        setMessage(result.error.message || "Authentication failed.");
        return;
      }

      router.push(mode === "sign-up" ? signUpDestination : signInDestination);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  return (
    <main className={styles.page}>
      <ScientificBackdrop className={styles.motionLayer} tone="light" />
      <section className={styles.panel}>
        <Link className={styles.brand} href="/start">
          <span className={styles.brandMark} aria-hidden="true">
            <svg fill="none" viewBox="0 0 32 32">
              <path d="M9.2 8.8h8.4a5.2 5.2 0 0 1 0 10.4h-3.2a4.6 4.6 0 0 0 0 9.2h8.4" />
              <circle cx="9.2" cy="8.8" r="2.2" />
              <circle cx="22.8" cy="23.8" r="2.2" />
            </svg>
          </span>
          <span>
            <strong>Provenant</strong>
            <small>Medical Research Intelligence</small>
          </span>
        </Link>
        <span className="eyebrow">{mode === "sign-up" ? "Create your account" : "Sign in"}</span>
        <h1>{mode === "sign-up" ? "Who is this account for?" : "Welcome back"}</h1>
        <p className={styles.intro}>
          {mode === "sign-up"
            ? "Pick the account type that fits. We will only ask for details that matter for your role or organization."
            : "Sign in to pick up where you left off: your profile, saved opportunities and introductions."}
        </p>

        {mode === "sign-up" && signUpStep === "identity" ? (
          <div className={styles.identityFlow}>
            <div className={styles.kindGrid} aria-label="Account type">
              <button type="button" className={accountKind === "individual" ? styles.selectedCard : styles.identityCard} onClick={() => setAccountKind("individual")}>
                <strong>Individual</strong><span>Student, researcher or professor</span>
              </button>
              <button type="button" className={accountKind === "institution" ? styles.selectedCard : styles.identityCard} onClick={() => setAccountKind("institution")}>
                <strong>Organization</strong><span>University, lab, hospital or research organization</span>
              </button>
            </div>
            <div className={styles.roleChoices}>
              <span>{accountKind === "individual" ? "Your role" : "Organization type"}</span>
              {accountKind === "individual" ? individualRoles.map(([value, label, description]) => (
                <button key={value} type="button" className={accountRole === value ? styles.selectedRole : ""} onClick={() => setAccountRole(value)}>
                  <strong>{label}</strong><small>{description}</small>
                </button>
              )) : organizationTypes.map(([value, label]) => (
                <button key={value} type="button" className={organizationType === value ? styles.selectedRole : ""} onClick={() => setOrganizationType(value)}>
                  <strong>{label}</strong>
                </button>
              ))}
            </div>
            <button className="primaryButton" type="button" onClick={() => setSignUpStep("credentials")}>Continue</button>
          </div>
        ) : (
          <form className={styles.form} method="post" onSubmit={submit}>
            {mode === "sign-up" ? <label><span>{accountKind === "individual" ? "Full name" : "Representative name"}</span><input name="name" type="text" autoComplete="name" required /></label> : null}
            <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
            <label>
              <span>Password</span>
              <input name="password" type={showPassword ? "text" : "password"} minLength={12} maxLength={128} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} aria-describedby={mode === "sign-up" ? "password-requirements" : undefined} required />
              {mode === "sign-up" ? <small id="password-requirements">Use at least 12 characters. A short passphrase is easier to remember.</small> : null}
            </label>
            {mode === "sign-up" ? <label><span>Confirm password</span><input name="passwordConfirmation" type={showPassword ? "text" : "password"} minLength={12} maxLength={128} autoComplete="new-password" required /></label> : null}
            <label className={styles.checkRow}>
              <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
              <span>Show password</span>
            </label>
            {mode === "sign-up" ? (
              <label className={styles.checkRow}>
                <input name="termsAccepted" type="checkbox" required />
                <span>I agree to the <Link href="/terms" target="_blank">Terms of Use</Link> and have read the <Link href="/privacy" target="_blank">Privacy Notice</Link>.</span>
              </label>
            ) : null}
            {mode === "sign-up" ? <p className={styles.selectionSummary}>{accountKind === "individual" ? individualRoles.find(([value]) => value === accountRole)?.[1] : organizationTypes.find(([value]) => value === organizationType)?.[1]} account</p> : null}
            {message ? <p className={styles.error} role="alert">{message}</p> : null}
            {remaining > 0 ? <p role="status">Too many attempts. Retry in {remaining} seconds. Your entries are retained.</p> : null}
            <div className={styles.formActions}>
              {mode === "sign-up" ? <button className="secondaryButton" type="button" disabled={status === "loading"} onClick={() => setSignUpStep("identity")}>Back</button> : null}
              <button className="primaryButton" type="submit" disabled={status === "loading" || remaining > 0}>{remaining > 0 ? `Retry in ${remaining}s` : status === "loading" ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button>
            </div>
          </form>
        )}
        {availability}
        {mode === "sign-in" ? <p className={styles.switcher}><Link href="/auth/forgot-password">Forgot your password?</Link></p> : null}
        <p className={styles.switcher}>
          {mode === "sign-up" ? <>Already have an account? <Link href={`/auth/sign-in${returnQuery ? `?${returnQuery}` : ""}`}>Sign in</Link></> : <>New to Provenant? <Link href={`/auth/sign-up${returnQuery ? `?${returnQuery}` : ""}`}>Create an account</Link></>}
        </p>
      </section>

      <aside className={styles.context}>
        <Link href="/start" className={styles.contextBrand}><span><BrandSymbol /></span>Provenant.</Link>
        <ResearchOrbit />
        <span className="eyebrow">Why Provenant</span>
        <h2>Your account is private. Every listing is sourced.</h2>
        <p>Only you can edit your profile. Anything imported from outside, such as ORCID records, keeps a note of where it came from.</p>
        <ul>
          <li>Profiles stay private until you choose to publish them</li>
          <li>Each listing shows its source and when it was last checked</li>
          <li>Introductions follow each researcher&apos;s own settings</li>
        </ul>
      </aside>
    </main>
  );
}
