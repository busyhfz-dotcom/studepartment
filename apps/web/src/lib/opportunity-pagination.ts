import type { OpportunityPagination, OpportunitySort } from "./api-contracts";

export function readOpportunityPage(value: string | null): number {
  if (!value || !/^\d{1,9}$/.test(value)) return 1;
  return Math.max(1, Number(value));
}

export function readOpportunitySort(value: string | null): OpportunitySort {
  return value === "deadline" ? "deadline" : "newest";
}

export function opportunityPagination(total: number, requestedPage: number, pageSize: number): OpportunityPagination {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { page: Math.min(requestedPage, totalPages), pageSize, totalPages };
}
