import { NextResponse } from "next/server";
import { getCoreRuntimeConfig } from "@/server/config/environment";

export function GET() {
  const runtime = getCoreRuntimeConfig();
  return NextResponse.json(
    {
      status: "ok",
      service: "studepartment-web",
      environment: runtime.deploymentEnvironment,
      release: runtime.releaseSha ?? null,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
