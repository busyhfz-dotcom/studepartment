import type { ComponentProps } from "react";
import { ControlIcon } from "@/components/design/control-icon";
import styles from "./opportunity-filter-select.module.css";

export function OpportunityFilterSelect({ icon, ...props }: ComponentProps<"select"> & { icon: "subject" | "role" }) {
  return <span className={styles.field} data-opportunity-filter={icon}>
    <ControlIcon name={icon} className={styles.icon} />
    <select {...props} />
  </span>;
}
