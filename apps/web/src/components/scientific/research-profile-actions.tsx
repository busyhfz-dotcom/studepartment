import { researchProfileSources, researchProfileUrl, type ResearchProfileSourceKey } from "@/lib/research-profile-sources";
import styles from "./research-profile-actions.module.css";

export function ResearchProfileActions({ sourceKey, value }: { sourceKey: ResearchProfileSourceKey; value?: string | null }) {
  const source = researchProfileSources.find((item) => item.key === sourceKey)!;
  const href = researchProfileUrl(sourceKey, value);
  return <div className={styles.actions}>
    <a href={source.entryUrl} target="_blank" rel="noopener noreferrer">Open {source.name} ↗</a>
    {href ? <a href={href} target="_blank" rel="noopener noreferrer">View saved {source.name} profile ↗</a> : null}
  </div>;
}
