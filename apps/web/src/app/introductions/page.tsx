import { ProductShell } from "@/components/shell/product-shell";
import { IntroductionWorkspace } from "./introduction-workspace";
import styles from "./page.module.css";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function IntroductionsPage({
  searchParams,
}: {
  searchParams: Promise<{ box?: string }>;
}) {
  const { box } = await searchParams;
  const initialBox = box === "outbox" ? "outbox" : "inbox";
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(`/introductions?box=${initialBox}`)}`);

  return (
    <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Scientific Introductions</span>
            <span className={styles.versionPill}>Recipient-controlled outreach</span>
          </div>
          <h1>Fewer messages. Better conversations.</h1>
          <p className="lede">
            Each request follows the recipient&apos;s preferences and has to state its scientific purpose. It is a way to meet the right researchers, not an open inbox.
          </p>
        </header>
        <IntroductionWorkspace initialBox={initialBox} />
      </div>
    </ProductShell>
  );
}
