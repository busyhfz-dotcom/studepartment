import { getDb } from "@studepartment/db";
import { NextResponse } from "next/server";
import { getCoreRuntimeConfig, integrationConfiguration } from "@/server/config/environment";

export async function GET() {
  const runtime = getCoreRuntimeConfig();
  const startedAt = Date.now();

  try {
    await getDb().$queryRaw<Array<{ ready: number }>>`SELECT 1 AS ready`;
    return NextResponse.json(
      {
        status: "ready",
        service: "studepartment-web",
        environment: runtime.deploymentEnvironment,
        release: runtime.releaseSha ?? null,
        database: "ready",
        integrations: integrationConfiguration(),
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Readiness check failed", error);
    return NextResponse.json(
      {
        status: "degraded",
        service: "studepartment-web",
        environment: runtime.deploymentEnvironment,
        release: runtime.releaseSha ?? null,
        database: "unavailable",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
