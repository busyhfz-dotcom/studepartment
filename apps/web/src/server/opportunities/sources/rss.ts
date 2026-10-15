import { decodeEntities } from "./text";

export type FeedItem = {
  title: string;
  link: string;
  guid: string;
  publishedAt: string | null;
  description: string;
  content: string;
  categories: string[];
  creator: string;
};

function unwrap(value: string): string {
  const cdata = value.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return cdata ? cdata[1] : decodeEntities(value);
}

function tag(block: string, name: string): string {
  const escaped = name.replace(":", "\\:");
  const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)</${escaped}>`, "i"));
  return match ? unwrap(match[1]).trim() : "";
}

function tags(block: string, name: string): string[] {
  const escaped = name.replace(":", "\\:");
  return [...block.matchAll(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)</${escaped}>`, "gi"))]
    .map((match) => unwrap(match[1]).trim())
    .filter(Boolean);
}

function atomLink(block: string): string {
  const alternate = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
    ?? block.match(/<link[^>]*href=["']([^"']+)["']/i);
  return alternate ? decodeEntities(alternate[1]) : "";
}

function toIso(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** Minimal RSS 2.0 / Atom reader for publisher feeds. Tolerant of CDATA and entities. */
export function parseFeed(xml: string): FeedItem[] {
  const blocks = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  if (blocks.length) {
    return blocks.map((block) => {
      const link = tag(block, "link");
      return {
        title: tag(block, "title"),
        link,
        guid: tag(block, "guid") || link,
        publishedAt: toIso(tag(block, "pubDate") || tag(block, "dc:date")),
        description: tag(block, "description"),
        content: tag(block, "content:encoded"),
        categories: tags(block, "category"),
        creator: tag(block, "dc:creator"),
      };
    });
  }
  return [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)].map((match) => {
    const block = match[1];
    const link = atomLink(block);
    return {
      title: tag(block, "title"),
      link,
      guid: tag(block, "id") || link,
      publishedAt: toIso(tag(block, "published") || tag(block, "updated")),
      description: tag(block, "summary"),
      content: tag(block, "content"),
      categories: [...block.matchAll(/<category[^>]*term=["']([^"']+)["']/gi)].map((item) => decodeEntities(item[1])),
      creator: tag(block, "name"),
    };
  });
}
