import { getSiteUrl } from "@/lib/site";
import type { FetchLike } from "./types";

/** Identifies the indexer to publishers, with a page explaining what it collects. */
export function indexerUserAgent() {
  return `ProvenantBot/1.0 (+${getSiteUrl()}/sources; research opportunity index)`;
}

export class SourceRequestError extends Error {
  constructor(readonly url: string, readonly status: number, message: string) {
    super(message);
    this.name = "SourceRequestError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GET/POST with a timeout, an identifying User-Agent and a short retry on
 * transient failures (network errors, 429 and 5xx). Never retries 4xx.
 */
export async function requestWithRetry(
  fetchImpl: FetchLike,
  url: string,
  init: RequestInit = {},
  { timeoutMs = 25_000, retries = 2 }: { timeoutMs?: number; retries?: number } = {},
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers = new Headers(init.headers);
      if (!headers.has("user-agent")) headers.set("user-agent", indexerUserAgent());
      const response = await fetchImpl(url, { ...init, headers, signal: controller.signal });
      if (response.ok) return response;
      if (response.status !== 429 && response.status < 500) {
        throw new SourceRequestError(url, response.status, `${response.status} from ${new URL(url).host}`);
      }
      lastError = new SourceRequestError(url, response.status, `${response.status} from ${new URL(url).host}`);
    } catch (error) {
      if (error instanceof SourceRequestError && error.status !== 429 && error.status < 500) throw error;
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < retries) await sleep(1_000 * 2 ** attempt);
  }
  throw lastError instanceof Error ? lastError : new Error(`Request failed: ${url}`);
}

export async function requestJson<T>(fetchImpl: FetchLike, url: string, init?: RequestInit): Promise<T> {
  const response = await requestWithRetry(fetchImpl, url, init);
  return await response.json() as T;
}

export async function requestText(fetchImpl: FetchLike, url: string, init?: RequestInit): Promise<string> {
  const response = await requestWithRetry(fetchImpl, url, init);
  return await response.text();
}

/** Runs `worker` over `items` with at most `limit` in flight, preserving order. */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}
