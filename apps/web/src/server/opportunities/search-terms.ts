const SEARCH_STOPWORDS = new Set(["the", "and", "for", "with", "from", "into", "within", "position", "positions", "opportunity", "opportunities", "job", "jobs", "research"]);

/**
 * Search terms worth filtering on: words of 3+ characters, without filler
 * words, with simple plurals folded ("grants" → "grant"), at most six.
 */
export function searchTerms(value: string): string[] {
  return Array.from(new Set(
    value.toLocaleLowerCase("en").normalize("NFKC")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length >= 3 && !SEARCH_STOPWORDS.has(token))
      .map((token) => (token.length > 4 && token.endsWith("s") && !token.endsWith("ss") ? token.slice(0, -1) : token)),
  )).slice(0, 6);
}
