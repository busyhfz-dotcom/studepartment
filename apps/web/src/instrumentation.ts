export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { startFileCleanup } = await import("./server/files/cleanup");
    startFileCleanup();
    const { startOpportunitySync } = await import("./server/opportunities/sources/scheduler");
    startOpportunitySync();
  }
}
