import Link from "next/link";
import type { OpportunityPagination } from "@/lib/api-contracts";
import styles from "./opportunity-pager.module.css";

export function OpportunityPager({ pagination, pageHref }: {
  pagination: OpportunityPagination;
  pageHref: (page: number) => string;
}) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pager} aria-label="Opportunity results pages">
      {page > 1 ? <Link href={pageHref(page - 1)} rel="prev" prefetch={false}>← Previous page</Link> : null}
      <span>Page {page.toLocaleString("en")} of {totalPages.toLocaleString("en")}</span>
      {page < totalPages ? <Link href={pageHref(page + 1)} rel="next" prefetch={false}>Next page →</Link> : null}
    </nav>
  );
}
