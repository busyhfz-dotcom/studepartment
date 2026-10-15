import { runOpportunitySync } from "./sync";

const TICK_MINUTES = 10;
const FIRST_RUN_DELAY_MS = 90_000;

const state = globalThis as unknown as { opportunitySyncTimer?: ReturnType<typeof setInterval> };

/**
 * Whether this server process should collect listings by itself. On in
 * production and staging; off in CI, tests and local development unless
 * OPPORTUNITY_SYNC=on. OPPORTUNITY_SYNC=off turns it off anywhere (for example
 * when an external scheduler calls /api/internal/jobs/opportunity-sync).
 */
export function opportunitySyncEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env.OPPORTUNITY_SYNC?.trim().toLowerCase();
  if (flag === "off" || flag === "false" || flag === "0") return false;
  if (flag === "on" || flag === "true" || flag === "1") return true;
  const deployment = env.DEPLOYMENT_ENV?.trim().toLowerCase() || (env.NODE_ENV === "production" ? "production" : "development");
  return (deployment === "production" || deployment === "staging") && Boolean(env.DATABASE_URL);
}

/**
 * Runs around the clock: every 10 minutes it checks which sources are due
 * (most are read hourly) and reads only those, so a new listing usually
 * reaches the site within an hour of being published.
 */
export function startOpportunitySync() {
  if (state.opportunitySyncTimer || !opportunitySyncEnabled()) return;
  const tick = async () => {
    try {
      await runOpportunitySync();
    } catch (error) {
      console.error("[opportunity-sync] run failed; will retry on the next tick", error instanceof Error ? error.message : error);
    }
  };
  state.opportunitySyncTimer = setInterval(() => void tick(), TICK_MINUTES * 60_000);
  state.opportunitySyncTimer.unref();
  setTimeout(() => void tick(), FIRST_RUN_DELAY_MS).unref();
}
