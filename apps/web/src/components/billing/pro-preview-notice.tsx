import Link from "next/link";
import type { CurrentUser } from "@/server/auth/current-user";
import { hasProAccess } from "@/server/auth/current-user";
import styles from "./pro-preview-notice.module.css";

export function ProPreviewNotice({ user }: { user: CurrentUser | null }) {
  if (hasProAccess(user) || process.env.PRO_ACCESS_ENFORCED === "true") return null;
  return <aside className={styles.notice}><div><span>Pro preview</span><p>This Studepartment intelligence feature is open during preview. Explore it before paid subscriptions launch.</p></div><Link href="/billing">See planned plans ↗</Link></aside>;
}
