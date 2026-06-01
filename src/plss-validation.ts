import type { ValidationResult } from "./types.js";
import { isValidTxss, normalizeTxss } from "./tx-validation.js";

// PLSS regex patterns (from web-app land-description rules; shared with python-mcp)
const TWP_PATTERN =
  /(?:\d{1,2}|1\d{2}|200)(\.5)?[NSE](-|\s+)(?:\d{1,2}|1\d{2}|200)(\.5)?[NEW](-|\s+)(?:\b\w+\b\s*)+/i;

const FIRST_DIVISION_PATTERN =
  /(\d{1,4}[a-z]?|[a-z]{1,4}(\d{1,2})?)(-|\s+)(?:\d{1,2}|1\d{2}|200)(\.5)?[NSE](-|\s+)(?:\d{1,2}|1\d{2}|200)(\.5)?[NEW](-|\s+)(?:\b\w+\b\s*)+/i;

const SECOND_DIVISION_PATTERN =
  /(l\s*(\d{1,3})?|(nw|ne|sw|se){1,4}|[news]{1}(\d{1})?(nw|ne|sw|se){2,4}|\d{1,3}|(\w{1}))(-|\s+)(0?\d{1,6}[a-z]?|(nw|ne|sw|se){2}|[a-z]{1,2}(\d{1,3})?)(-|\s+)(?:\d{1,2}|1\d{2}|200)(\.5)?[NSE](-|\s+)(?:\d{1,2}|1\d{2}|200)(\.5)?[NEW](-|\s+)(?:\b\w+\b\s*)+/i;

const QUARTER_ALIASES: Record<string, string> = {
  northeast: "NE",
  northwest: "NW",
  southeast: "SE",
  southwest: "SW",
  "north east": "NE",
  "north west": "NW",
  "south east": "SE",
  "south west": "SW",
};

const INVALID_SUGGESTION =
  "Legal descriptions follow PLSS or Texas TXSS patterns. " +
  "PLSS example: 'NW 25 24N 1E 6th Meridian' or 'T4N R5E Sec 12 NE'. " +
  "Texas example: 'A-175 Reeves County' or 'Block 25 Section 14 Pecos County'. " +
  "Ensure PLSS inputs include township/range direction letters and a meridian name.";

export function isValidPlss(description: string): boolean {
  const d = description.trim();
  return (
    SECOND_DIVISION_PATTERN.test(d) ||
    FIRST_DIVISION_PATTERN.test(d) ||
    TWP_PATTERN.test(d)
  );
}

export function normalizePlss(description: string): string {
  let d = description.trim().toUpperCase();

  for (const [long, short] of Object.entries(QUARTER_ALIASES)) {
    d = d.replace(new RegExp(`\\b${long}\\b`, "gi"), short);
  }

  d = d.replace(/¼/g, " 1/4");
  return d.replace(/\s+/g, " ").trim();
}

export function validatePlssDescription(description: string): ValidationResult {
  if (typeof description !== "string" || description.trim().length === 0) {
    throw new Error("description must not be empty");
  }

  const plssNormalized = normalizePlss(description);
  if (isValidPlss(plssNormalized) || isValidPlss(description)) {
    return { valid: true, normalized: plssNormalized, survey_system: "PLSS" };
  }

  const txNormalized = normalizeTxss(description);
  if (isValidTxss(txNormalized) || isValidTxss(description)) {
    return { valid: true, normalized: txNormalized, survey_system: "TXSS" };
  }

  return { valid: false, suggestion: INVALID_SUGGESTION };
}
