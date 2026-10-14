import Link from "next/link";
import { effectiveMonthlyPrice, lowestMonthlyPlan, freeFeatures, proFeatures, proPlans } from "@/lib/plans";
import styles from "./pro-gate.module.css";

export function ProGate({ feature }: { feature: string }) {
  return <section className={styles.shell}>
    <div className={styles.hero}>
      <span className="eyebrow">Provenant Pro</span>
      <h1>Go deeper when your research needs it.</h1>
      <p><strong>{feature}</strong> is part of Provenant Pro. Your profile, public search and opportunity tracking stay free.</p>
      <div className={styles.heroActions}><Link className="secondary" href="/profile">Return to free profile</Link><Link className="secondary" href="/opportunities">Explore opportunities</Link></div>
    </div>
    <div className={styles.features}>
      <section><span className="sectionLabel">Always free</span><ul>{freeFeatures.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></section>
      <section><span className="sectionLabel">Pro intelligence</span><ul>{proFeatures.map((feature) => <li key={feature}>✦ {feature}</li>)}</ul></section>
    </div>
    <div className={styles.pricingHeading}><span className="sectionLabel">Planned pricing</span><h2>One Pro membership. Four billing options.</h2><p>Prices are in USD. Paid subscriptions are not available yet.</p></div>
    <div className={styles.plans}>{proPlans.map((plan) => <article className={styles.plan} key={plan.id}><span>{plan.label}</span><strong>{plan.price}</strong><small>{plan.cadence} · {plan.intervalMonths} month{plan.intervalMonths > 1 ? "s" : ""} total</small><p>{effectiveMonthlyPrice(plan)} per month equivalent</p>{plan.id === lowestMonthlyPlan.id ? <small>Lowest monthly equivalent in current planned pricing</small> : null}<Link className={styles.planLink} href={`/billing/checkout?plan=${plan.id}`}>View plan details →</Link></article>)}</div>
    <p className={styles.availability}>Longer billing periods do not currently have a lower monthly price than the three-month option. Compare the monthly equivalents before choosing.</p>
    <p className={styles.availability}>There is no charge or payment form now. Existing research tools are available during the Pro preview.</p>
  </section>;
}
