import { runOpportunitySync } from "./sync";

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
        !Number.isFinite(Date.parse(delivery.data?.scheduled_at))) {
      return new Response(null, { status: 400 });
    }

    try {
      if (new URL(process.env.DATABASE_URL ?? "").pathname !== "/provenant") {
        throw new Error("Unexpected scanner database");
      }
      const result = await runOpportunitySync();
      console.info("[opportunity-sync] scheduled run", result.results.map(({ id, status, durationMs }) => ({ id, status, durationMs })));
      return Response.json({ ran: result.ran });
    } catch (error) {
      console.error("[opportunity-sync] scheduled run failed", error instanceof Error ? error.name : "UnknownError");
      return new Response(null, { status: 503 });
    }
  },
};
