import { createHash } from "node:crypto";
import { getDb } from "@studepartment/db";
import { NextResponse, type NextRequest } from "next/server";
import type { ApiError } from "@/lib/api-contracts";
import { getCoreRuntimeConfig } from "@/server/config/environment";

export class RateLimitExceededError extends Error {
  constructor(
    readonly scope: string,
    readonly retryAfterSeconds: number,
  ) {
    super("Too many requests. Try again later.");
    this.name = "RateLimitExceededError";
  }
}

type RateLimitRule = {
  windowSeconds: number;
  max: number;
};

function digestSubject(subject: string) {
  const runtime = getCoreRuntimeConfig();
  return createHash("sha256")
    .update(runtime.betterAuthSecret)
    .update("|")
    .update(subject)
    .digest("hex")
    .slice(0, 32);
}

function bucket(nowMs: number, windowSeconds: number) {
  return Math.floor(nowMs / (windowSeconds * 1000));
}

function retryAfter(nowMs: number, windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  return Math.max(1, Math.ceil((windowMs - (nowMs % windowMs)) / 1000));
}

export function clientFingerprint(request: NextRequest) {
  const runtime = getCoreRuntimeConfig();
  const forwarded = request.headers.get(runtime.authIpHeader)?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent")?.slice(0, 160) ?? "unknown-agent";
  return digestSubject((forwarded || "unknown-ip") + "|" + userAgent);
}

export async function consumeRateLimit(
  scope: string,
  subject: string,
  rule: RateLimitRule,
) {
  const nowMs = Date.now();
  const key = [
    "app",
    scope,
    digestSubject(subject),
    String(bucket(nowMs, rule.windowSeconds)),
  ].join(":");

  const row = await getDb().rateLimit.upsert({
    where: { key },
    create: {
      key,
      count: 1,
      lastRequest: BigInt(nowMs),
    },
    update: {
      count: { increment: 1 },
      lastRequest: BigInt(nowMs),
    },
    select: { count: true },
  });

  if (row.count > rule.max) {
    throw new RateLimitExceededError(scope, retryAfter(nowMs, rule.windowSeconds));
  }
}

export async function consumeClientRateLimit(
  request: NextRequest,
  scope: string,
  rule: RateLimitRule,
) {
  return consumeRateLimit(scope, "client:" + clientFingerprint(request), rule);
}

export function rateLimitErrorResponse(error: RateLimitExceededError) {
  const body: ApiError = {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Try again later.",
    },
  };
  return NextResponse.json(body, {
    status: 429,
    headers: {
      "Retry-After": String(error.retryAfterSeconds),
      "Cache-Control": "private, no-store",
    },
  });
}
