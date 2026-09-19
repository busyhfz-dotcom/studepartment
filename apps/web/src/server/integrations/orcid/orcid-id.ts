const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

export function normalizeOrcid(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?orcid\.org\//i, "")
    .toUpperCase();
}

export function isValidOrcid(value: string) {
  const normalized = normalizeOrcid(value);
  if (!ORCID_PATTERN.test(normalized)) return false;

  const compact = normalized.replaceAll("-", "");
  const body = compact.slice(0, 15);
  const providedCheckDigit = compact.at(-1);

  let total = 0;
  for (const digit of body) {
    total = (total + Number(digit)) * 2;
  }

  const remainder = total % 11;
  const result = (12 - remainder) % 11;
  const expectedCheckDigit = result === 10 ? "X" : String(result);

  return providedCheckDigit === expectedCheckDigit;
}

export function assertValidOrcid(value: string) {
  const normalized = normalizeOrcid(value);
  if (!isValidOrcid(normalized)) {
    throw new Error("Invalid ORCID iD.");
  }
  return normalized;
}
