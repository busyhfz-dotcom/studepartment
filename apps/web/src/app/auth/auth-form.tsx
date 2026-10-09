"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
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
}: {
  callbackUrl?: string;
  mode?: AuthMode;
  initialKind?: AccountKind;
  initialRole?: IndividualProfileRole;
  initialOrganizationType?: InstitutionalOrganizationType;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [signUpStep, setSignUpStep] = useState<"identity" | "credentials">("identity");
  const [accountKind, setAccountKind] = useState<AccountKind>(initialKind);
  const [accountRole, setAccountRole] = useState<IndividualProfileRole>(initialRole);
  const [organizationType, setOrganizationType] = useState<InstitutionalOrganizationType>(initialOrganizationType);
  const signInDestination = safeReturnPath(callbackUrl);
  const onboardingPath = accountKind === "individual"
    ? `/onboarding?role=${encodeURIComponent(accountRole)}`
    : `/onboarding/organization?type=${encodeURIComponent(organizationType)}`;
  const returnQuery = callbackUrl ? `callbackUrl=${encodeURIComponent(signInDestination)}` : "";
  const signUpDestination = onboardingPath + (returnQuery ? `&${returnQuery}` : "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    const passwordConfirmation = String(form.get("passwordConfirmation") ?? "");
    try {
      if (mode === "sign-up" && password !== passwordConfirmation) {
        setStatus("error");
        setMessage("Passwords do not match.");
        return;
      }

      const result = mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name, callbackURL: signUpDestination })
        : await authClient.signIn.email({ email, password, callbackURL: signInDestination });

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
            <strong>Studepartment</strong>
            <small>Medical Research Intelligence</small>
          </span>
        </Link>
        <span className="eyebrow">{mode === "sign-up" ? "Create your scientific identity" : "Secure research access"}</span>
        <h1>{mode === "sign-up" ? "Who are you?" : "Return to your research workspace"}</h1>
        <p className={styles.intro}>
          {mode === "sign-up"
            ? "Choose the account that represents you. The next form will ask only for information relevant to your role or organization."
            : "Sign in to continue your private Scientific Identity, evidence, opportunity, and introduction workflows."}
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
          <form className={styles.form} onSubmit={submit}>
            {mode === "sign-up" ? <label><span>{accountKind === "individual" ? "Full name" : "Representative name"}</span><input name="name" type="text" autoComplete="name" required /></label> : null}
            <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
            <label>
              <span>Password</span>
              <input name="password" type="password" minLength={12} maxLength={128} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} required />
            </label>
            {mode === "sign-up" ? <label><span>Confirm password</span><input name="passwordConfirmation" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label> : null}
            {mode === "sign-up" ? <p className={styles.selectionSummary}>{accountKind === "individual" ? individualRoles.find(([value]) => value === accountRole)?.[1] : organizationTypes.find(([value]) => value === organizationType)?.[1]} account</p> : null}
            {message ? <p className={styles.error} role="alert">{message}</p> : null}
            <div className={styles.formActions}>
              {mode === "sign-up" ? <button className="secondaryButton" type="button" disabled={status === "loading"} onClick={() => setSignUpStep("identity")}>Back</button> : null}
              <button className="primaryButton" type="submit" disabled={status === "loading"}>{status === "loading" ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button>
            </div>
          </form>
        )}
        <p className={styles.switcher}>
          {mode === "sign-up" ? <>Already have an account? <Link href={`/auth/sign-in${returnQuery ? `?${returnQuery}` : ""}`}>Sign in</Link></> : <>New to Studepartment? <Link href={`/auth/sign-up${returnQuery ? `?${returnQuery}` : ""}`}>Create an account</Link></>}
        </p>
      </section>

      <aside className={styles.context}>
        <Link href="/start" className={styles.contextBrand}><span><BrandSymbol /></span>Studepartment.</Link>
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
