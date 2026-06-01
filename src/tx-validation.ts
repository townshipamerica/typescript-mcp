/** Lightweight Texas TXSS shape detection for local validate_description. */

const TXSS_MARKERS =
  /\babstract\b|\babs\.?\s*[0-9]|\ba\s*-\s*[0-9]+|\bblock\s+\d+\b|\bblk\.?\s*\d+\b|\bsurvey\b|\bleague\b|\blabor\b|\blabors\b/i;

const TX_COUNTY =
  /\b[a-z][\w.'-]*(?:\s+[a-z][\w.'-]*)*\s+(?:county|co\.?)(?:\s*,?\s*(?:tx|texas))?\b/i;

export function isValidTxss(description: string): boolean {
  const d = description.trim();
  if (!d) return false;
  return TXSS_MARKERS.test(d) || TX_COUNTY.test(d);
}

export function normalizeTxss(description: string): string {
  return description
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\ba\s*-\s*/gi, "A-")
    .replace(/\babstract\s*#?\s*/gi, "Abstract ")
    .replace(/\s+/g, " ")
    .trim();
}
