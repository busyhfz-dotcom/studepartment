import { ProductShell } from "@/components/shell/product-shell";
import type { ResearchAssistantTarget } from "@/lib/api-contracts";
import { ResearchAssistantWorkspace } from "./research-assistant-workspace";
import { ProGate } from "@/components/billing/pro-gate";
import { ProPreviewNotice } from "@/components/billing/pro-preview-notice";
import { canUseProFeature, getCurrentUser } from "@/server/auth/current-user";
import styles from "./page.module.css";

function targetFromSearch(searchParams: {
  institution?: string;
  researcher?: string;
  opportunity?: string;
}): ResearchAssistantTarget | undefined {
  if (searchParams.institution) return { type: "institution", id: searchParams.institution };
  if (searchParams.researcher) return { type: "researcher", id: searchParams.researcher };
  if (searchParams.opportunity) return { type: "opportunity", id: searchParams.opportunity };
  return undefined;
}

export default async function ResearchAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string; researcher?: string; opportunity?: string }>;
}) {
  const user = await getCurrentUser();
  if (!canUseProFeature(user)) return <ProductShell><ProGate feature="Citation-grounded Research Assistant" /></ProductShell>;
  const params = await searchParams;
  const target = targetFromSearch(params);

  return (
    <ProductShell>
      <div className={styles.shell}>
        <ProPreviewNotice user={user} />
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Research Assistant</span>
            <span className={styles.version}>Citation-grounded</span>
          </div>
          <h1>Reason over evidence you can inspect.</h1>
          <p>
            Ask about scientific fit, current opportunities, researchers, or institutions. Every answer is constrained to a request-specific Studepartment source ledger and must cite the evidence it uses.
          </p>
        </header>
        <ResearchAssistantWorkspace target={target} />
      </div>
    </ProductShell>
  );
}
