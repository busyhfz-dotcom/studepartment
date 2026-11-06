import { createPublicKey, verify } from "node:crypto";

const publicKey = createPublicKey(`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAfTYHZPPaF2kU9JprKsI6eesJHL7AuUEwsszC3smSBHw=
-----END PUBLIC KEY-----`);
const MAX_CLOCK_SKEW_MS = 3 * 60_000;

export type ScheduledJob = "opportunity-sync" | "email-digest";

export function schedulerMessage(timestamp: string, invocationId: string, job: ScheduledJob = "opportunity-sync") {
  return Buffer.from(`provenant:${job}:${timestamp}:${invocationId}`);
}

export function hasSchedulerSignature(headers: Headers, job: ScheduledJob = "opportunity-sync", now = Date.now()) {
  const timestamp = headers.get("x-provenant-scheduler-time") ?? "";
  const id = headers.get("x-provenant-scheduler-id") ?? "";
  const signature = headers.get("x-provenant-scheduler-signature") ?? "";
  if (!/^\d{13}$/.test(timestamp) || Math.abs(now - Number(timestamp)) > MAX_CLOCK_SKEW_MS ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(id) || !/^[a-zA-Z0-9_-]{86}$/.test(signature)) return false;
  return verify(null, schedulerMessage(timestamp, id, job), publicKey, Buffer.from(signature, "base64url"));
}
