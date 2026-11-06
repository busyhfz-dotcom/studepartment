import { createPrivateKey, sign } from "node:crypto";
import { schedulerMessage, type ScheduledJob } from "./scheduler-signature";

const origin = "https://provenant-web.onrender.com";
const targets = new Map<string, { job: ScheduledJob; route: string }>([
  ["/scan", { job: "opportunity-sync", route: "/api/internal/jobs/opportunity-sync" }],
  ["/digest", { job: "email-digest", route: "/api/internal/jobs/weekly-digest" }],
]);
const REQUEST_TIMEOUT_MS = 180_000;
const RETRY_DELAY_MS = 15_000;

export default {
  async fetch(request: Request): Promise<Response> {
    const target = targets.get(new URL(request.url).pathname);
    if (request.method !== "POST" || !target) {
      return new Response(null, { status: 404 });
    }

    // Neon's ingress strips external x-neon-* headers and adds this one
    // only for a delivery from its own trigger service.
    const invocationId = request.headers.get("x-neon-trigger-invocation-id");
    if (!invocationId) return new Response(null, { status: 401 });
    const delivery = await request.json().catch(() => null);
    if (delivery?.version !== 1 || delivery.invocation_id !== invocationId ||
        delivery.trigger?.type !== "schedule" || delivery.trigger.name !== target.job ||
        !Number.isFinite(Date.parse(delivery.data?.scheduled_at)) ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(invocationId)) {
      return new Response(null, { status: 400 });
    }

    try {
      const key = createPrivateKey(process.env.PROVENANT_SCANNER_PRIVATE_KEY ?? "");
      for (let attempt = 0; attempt < 2; attempt++) {
        const timestamp = Date.now().toString();
        const signature = sign(null, schedulerMessage(timestamp, invocationId, target.job), key).toString("base64url");
        const response = await fetch(origin + target.route, {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          headers: {
            "x-provenant-scheduler-time": timestamp,
            "x-provenant-scheduler-id": invocationId,
            "x-provenant-scheduler-signature": signature,
          },
        }).catch(() => null);
        const status = response?.status;
        await response?.body?.cancel();
        if (status === 200 || status === 409) {
          console.info(`[${target.job}] scheduled request completed`, status);
          return Response.json({ accepted: true });
        }
        if (status !== undefined && status < 500 && status !== 408) {
          console.error(`[${target.job}] scheduled request rejected`, status);
          break;
        }
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
      return new Response(null, { status: 503 });
    } catch (error) {
      console.error(`[${target.job}] scheduled run failed`, error instanceof Error ? error.name : "UnknownError");
      return new Response(null, { status: 503 });
    }
  },
};
