import type { ValidationResult } from "./types.js";

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
  "PLSS descriptions follow the pattern: [Quarter] [Section] [Township][N/S] " +
  "[Range][E/W] [Principal Meridian]. " +
  "Example: 'NW 25 24N 1E 6th Meridian' or 'T4N R5E Sec 12 NE'. " +
  "Ensure township/range direction letters (N/S, E/W) are present and a meridian name is included.";

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

  const normalized = normalizePlss(description);
  const valid = isValidPlss(normalized) || isValidPlss(description);

  if (valid) {
    return { valid: true, normalized };
  }

  return { valid: false, suggestion: INVALID_SUGGESTION };
}
