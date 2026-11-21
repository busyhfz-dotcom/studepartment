import { gunzipSync } from "node:zlib";
import { diseaseTermData } from "./human-disease-terms.data";

let dictionary: { terms: ReadonlySet<string>; prefixes: ReadonlySet<string>; maxWords: number } | undefined;

function loadDiseaseTerms() {
  if (dictionary) return dictionary;
  const phrases = gunzipSync(Buffer.from(diseaseTermData, "base64")).toString("utf8").split("\n");
  const prefixes = new Set(phrases.map((phrase) => phrase.split(" ", 1)[0]));
  const maxWords = phrases.reduce((max, phrase) => Math.max(max, phrase.split(" ").length), 0);
  dictionary = { terms: new Set(phrases), prefixes, maxWords };
  return dictionary;
}

export function hasHumanDisease(text: string) {
  const { terms, prefixes, maxWords } = loadDiseaseTerms();
  const words = text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  for (let start = 0; start < words.length; start++) {
    if (!prefixes.has(words[start])) continue;
    let phrase = words[start];
    if (terms.has(phrase)) return true;
    for (let end = start + 1; end < words.length && end - start < maxWords; end++) {
      phrase += " " + words[end];
      if (terms.has(phrase)) return true;
    }
  }
  return false;
}
