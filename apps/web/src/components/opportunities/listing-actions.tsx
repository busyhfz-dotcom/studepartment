import type { ReactNode } from "react";
import type { ShareableOpportunity } from "@/lib/opportunity-actions";
import { DeadlineReminder } from "./deadline-reminder";
import { ShareOpportunity } from "./share-opportunity";
import styles from "./opportunity-actions.module.css";

export function ListingActions({ item, primary }: { item: ShareableOpportunity; primary: ReactNode }) {
  return (
    <div className={styles.listingActions} data-listing-actions="">
      <div className={styles.primaryRow}>{primary}</div>
      <ShareOpportunity item={item} />
      <DeadlineReminder items={[item]} />
    </div>
  );
}
