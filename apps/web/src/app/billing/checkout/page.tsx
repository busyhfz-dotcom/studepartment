import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { proFeatures, proPlans } from "@/lib/plans";
import { getCurrentUser } from "@/server/auth/current-user";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Pro plan details", robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: selectedPlan } = await searchParams;
  const plan = proPlans.find((item) => item.id === selectedPlan);
  if (!plan) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(`/billing/checkout?plan=${plan.id}`)}`);

  return <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}>
    <div className={styles.shell}>
      <Link className={styles.back} href="/billing">← All plans</Link>
      <section className={styles.hero}>
        <div>
          <span className="eyebrow">Studepartment Pro · plan details</span>
          <h1>{plan.label} plan</h1>
          <p>Unlock Studepartment&apos;s evidence intelligence when your research needs it. Your profile, public discovery and opportunity tracking stay free.</p>
        </div>
        <div className={styles.price}><strong>{plan.price}</strong><span>{plan.cadence}</span></div>
      </section>
      <div className={styles.columns}>
        <section className={styles.card}><span className="sectionLabel">Included in Pro</span><ul>{proFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul></section>
        <section className={styles.card}><span className="sectionLabel">Payment status</span><h2>Checkout is being prepared.</h2><p>No payment details are collected and no charge can be made on this page. The research tools remain available during the Pro preview.</p><Link className={styles.action} href="/profile">Continue to your profile →</Link></section>
      </div>
    </div>
  </ProductShell>;
}
