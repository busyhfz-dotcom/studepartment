import { createPrivateKey, sign } from "node:crypto";
import { schedulerMessage } from "./scheduler-signature";

const TARGET = "https://provenant-web.onrender.com/api/internal/jobs/opportunity-sync";
const REQUEST_TIMEOUT_MS = 180_000;
const RETRY_DELAY_MS = 15_000;

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/scan") {
      return new Response(null, { status: 404 });
    }

    // Neon's ingress strips external x-neon-* headers and adds this one
    // only for a delivery from its own trigger service.
    const invocationId = request.headers.get("x-neon-trigger-invocation-id");
    if (!invocationId) return new Response(null, { status: 401 });
    const delivery = await request.json().catch(() => null);
    if (delivery?.version !== 1 || delivery.invocation_id !== invocationId ||
        delivery.trigger?.type !== "schedule" || delivery.trigger.name !== "opportunity-sync" ||
        !Number.isFinite(Date.parse(delivery.data?.scheduled_at)) ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(invocationId)) {
      return new Response(null, { status: 400 });
    }

    try {
      const key = createPrivateKey(process.env.PROVENANT_SCANNER_PRIVATE_KEY ?? "");
      for (let attempt = 0; attempt < 2; attempt++) {
        const timestamp = Date.now().toString();
        const signature = sign(null, schedulerMessage(timestamp, invocationId), key).toString("base64url");
        const response = await fetch(TARGET, {
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
          console.info("[opportunity-sync] scheduled request completed", status);
          return Response.json({ accepted: true });
        }
        if (status !== undefined && status < 500 && status !== 408) {
          console.error("[opportunity-sync] scheduled request rejected", status);
          break;
        }
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
      return new Response(null, { status: 503 });
    } catch (error) {
      console.error("[opportunity-sync] scheduled run failed", error instanceof Error ? error.name : "UnknownError");
      return new Response(null, { status: 503 });
    }
  },
};
