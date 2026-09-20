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
          <span className="eyebrow">Research Data Control Center</span>
          <h1>Control the data attached to your research activity.</h1>
          <p>
            Review private account activity, export a portable record, or permanently remove your account and
            Scientific Identity with the consequences stated before you act.
          </p>
          <Link href="/profile">← Back to Scientific Identity</Link>
        </header>
        <PrivacyControls />
      </div>
    </ProductShell>
  );
}
