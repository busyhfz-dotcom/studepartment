import { ProductShell } from "@/components/shell/product-shell";
import type { ResearchAssistantTarget } from "@/lib/api-contracts";
import { ResearchAssistantWorkspace } from "./research-assistant-workspace";
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
  const params = await searchParams;
  const target = targetFromSearch(params);

  return (
    <ProductShell>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Research Assistant</span>
            <span className={styles.version}>v1.3</span>
          </div>
          <h1>Reason over your research evidence, not a generic chat history.</h1>
          <p>
            Ask about scientific fit, current opportunities, researchers, or institutions. Answers are constrained to a request-specific canonical source ledger and must cite the evidence they use.
          </p>
        </header>
        <ResearchAssistantWorkspace target={target} />
      </div>
    </ProductShell>
  );
}
