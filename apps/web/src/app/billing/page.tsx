import { redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { ProGate } from "@/components/billing/pro-gate";
import { getCurrentUser, hasProAccess } from "@/server/auth/current-user";
import styles from "./page.module.css";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/billing");
  if (!hasProAccess(user)) return <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}><ProGate feature="Advanced research intelligence" /></ProductShell>;
  return <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}><section className={styles.card}><span className="eyebrow">Studepartment Pro</span><h1>Your Pro membership is active.</h1><p>Evidence Graph, Research Assistant and scientific introductions are available in your workspace.</p>{user.subscriptionExpiresAt ? <p>Current access through {new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(user.subscriptionExpiresAt)}.</p> : null}</section></ProductShell>;
}
