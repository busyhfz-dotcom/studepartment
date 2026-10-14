import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { NotificationPreferences } from "./notification-preferences";
import { PrivacyControls } from "./privacy-controls";
import styles from "./page.module.css";

export default async function PrivacySettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?next=/settings/privacy");

  return (
    <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className="eyebrow">Privacy and data</span>
          <h1>Your data, your decisions.</h1>
          <p>
            See your account activity, download a copy of your data, or permanently delete your account and
            Scientific Identity. We explain exactly what happens before you confirm.
          </p>
          <Link href={user.accountKind === "INSTITUTION" ? "/organization/profile" : "/profile"}>← Back to your profile</Link>
        </header>
        <NotificationPreferences />
        <PrivacyControls />
      </div>
    </ProductShell>
  );
}
