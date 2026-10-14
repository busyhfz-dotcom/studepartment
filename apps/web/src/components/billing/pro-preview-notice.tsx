import Link from "next/link";
import type { CurrentUser } from "@/server/auth/current-user";
import { hasProAccess } from "@/server/auth/current-user";
import styles from "./pro-preview-notice.module.css";

export function ProPreviewNotice({ user }: { user: CurrentUser | null }) {
  if (hasProAccess(user) || process.env.PRO_ACCESS_ENFORCED === "true") return null;
  return <aside className={styles.notice}><div><span>Pro preview</span><p>This Pro feature is free while in preview. Try it before paid plans launch.</p></div><Link href="/billing">See planned plans ↗</Link></aside>;
}
