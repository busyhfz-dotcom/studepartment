const namedEntities: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", bull: "•", middot: "·", eacute: "é", uuml: "ü",
  ouml: "ö", auml: "ä", szlig: "ß", aacute: "á", oacute: "ó", iacute: "í", ntilde: "ñ", ccedil: "ç",
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1]?.toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : match;
    }
    return namedEntities[entity.toLowerCase()] ?? match;
  });
}

/** Plain text from an HTML fragment, with paragraph breaks kept as single spaces. */
export function htmlToText(value: string | null | undefined): string {
  if (!value) return "";
  // Some APIs send HTML with its markup escaped ("&lt;p&gt;…").
  const source = /&lt;\/?[a-z!]/i.test(value) ? decodeEntities(value) : value;
  const withoutBlocks = source
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h\d|tr)>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(decodeEntities(withoutBlocks)).replace(/\s+/g, " ").trim();
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–-]+$/, "")}…`;
}

/** Cleaned listing description: plain text, no feed boilerplate, bounded length. */
export function cleanDescription(value: string | null | undefined, max = 1200): string | null {
  const text = htmlToText(value)
    .replace(/The post .{0,300}? appeared first on .{0,80}?\.?$/i, "")
    .trim();
  return text ? truncate(text, max) : null;
}
