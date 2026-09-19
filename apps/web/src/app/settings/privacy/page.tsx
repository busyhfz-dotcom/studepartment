import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { PrivacyControls } from "./privacy-controls";
import styles from "./page.module.css";

export default async function PrivacySettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?next=/settings/privacy");

  return (
    <ProductShell>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className="eyebrow">Privacy & Data · v1.4</span>
          <h1>Your data stays controllable.</h1>
          <p>Review private product activity, export your account data, or permanently remove your account and Scientific Identity.</p>
          <Link href="/profile">← Back to Scientific Identity</Link>
        </header>
        <PrivacyControls />
      </div>
    </ProductShell>
  );
}
