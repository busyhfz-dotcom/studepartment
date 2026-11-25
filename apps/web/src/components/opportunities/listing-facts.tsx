import type { OpportunityResult } from "@/lib/api-contracts";
import { deadlineClosingSoon } from "@/lib/opportunity-filters";
import { entryDeadlineLabel } from "@/app/start/entry-paths";
import styles from "./opportunity-actions.module.css";

export function DueDate({ item }: { item: Pick<OpportunityResult, "deadline" | "deadlinePrecision"> }) {
  const urgent = deadlineClosingSoon(item.deadline, item.deadlinePrecision);
  const exact = item.deadlinePrecision === "exact" && item.deadline && Number.isFinite(Date.parse(item.deadline))
    ? new Intl.DateTimeFormat("en", { month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit", timeZone:"UTC", timeZoneName:"short" }).format(new Date(item.deadline))
    : null;
  return <span className={styles.due} data-urgent={urgent}>
    {urgent ? <span className={styles.dueDot} aria-hidden="true" /> : null}
    {item.deadline ? "Due " : ""}{exact ?? entryDeadlineLabel(item, "en")}
  </span>;
}

export function Competition({ item }: { item: OpportunityResult }) {
  const competition = item.competition;
  return competition ? <a className={styles.competition} href={competition.url} target="_blank" rel="noopener noreferrer" title={competition.basis}>
    {competition.label} · {competition.rate}% <small>{competition.basis}</small>
  </a> : <span>Rate not available</span>;
}

export function ListingEligibility({ item }: { item: OpportunityResult }) {
  return <span className={styles.eligibility}>{item.publishedEligibility || "Check official eligibility"}</span>;
}
