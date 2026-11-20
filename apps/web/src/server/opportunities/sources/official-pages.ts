import { requestText, requestWithRetry, SourceRequestError } from "./http";
import { robotsAllows } from "./programme-registry";
import type { FetchLike } from "./types";

/** Gives each collector one robots check per publisher per run. */
export async function openPublisher(fetchImpl: FetchLike, homepage: string) {
  const origin = new URL(homepage).origin;
  const robots = await requestText(fetchImpl, origin + "/robots.txt", { redirect: "error" }).catch((error: unknown) => {
    if (error instanceof SourceRequestError && error.status === 404) return "";
    throw error;
  });
  return async (url: string) => {
    const target = new URL(url, origin);
    if (target.origin !== origin || !robotsAllows(robots, target.pathname + target.search)) {
      throw new Error("This resource is outside the publisher's permitted public pages");
    }
    const response = await requestWithRetry(fetchImpl, target.href, {
      redirect: "error",
      headers: { accept: "text/html" },
    }, { timeoutMs: 20_000, retries: 0 });
    return response.text();
  };
}

/** Public dates in the publisher's English-language pages. */
export function englishDate(value: string) {
  const normalized = value.replace(/(\d)\s*(?:st|nd|rd|th)\b/gi, "$1").replace(/\s+,/g, ",");
  const milliseconds = Date.parse(normalized + " UTC");
  return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString().slice(0, 10) : null;
}
