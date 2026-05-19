import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ValidationResult } from "../types.js";
import { ok, err } from "../tool-helpers.js";

// PLSS regex patterns (re-implemented from server/utils/land-description/regexRules.js)
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
  "south west": "SW"
};

function isValidPlss(description: string): boolean {
  const d = description.trim();
  return (
    SECOND_DIVISION_PATTERN.test(d) ||
    FIRST_DIVISION_PATTERN.test(d) ||
    TWP_PATTERN.test(d)
  );
}

function normalize(description: string): string {
  let d = description.trim().toUpperCase();

  for (const [long, short] of Object.entries(QUARTER_ALIASES)) {
    d = d.replace(new RegExp(`\\b${long}\\b`, "gi"), short);
  }

  d = d.replace(/¼/g, " 1/4");
  d = d.replace(/\s+/g, " ").trim();

  return d;
}

export const validateDescriptionTool: Tool = {
  name: "validate_description",
  description:
    "Validate and normalize a PLSS legal land description string. " +
    "Returns whether the input matches known PLSS patterns, a normalized form, and suggestions if invalid. " +
    "No API call is made — this runs locally.",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "PLSS description to validate, e.g. 'NW 25 24N 1E 6th Meridian'"
      }
    },
    required: ["description"]
  }
};

export async function runValidateDescription(
  _client: unknown,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const description = args.description;
  if (typeof description !== "string" || description.trim().length === 0) {
    return err("Error: 'description' must be a non-empty string.");
  }

  const normalized = normalize(description);
  const valid = isValidPlss(normalized) || isValidPlss(description);

  const result: ValidationResult = { valid };

  if (valid) {
    result.normalized = normalized;
  } else {
    result.suggestion =
      "PLSS descriptions follow the pattern: [Quarter] [Section] [Township][N/S] [Range][E/W] [Principal Meridian]. " +
      "Example: 'NW 25 24N 1E 6th Meridian' or 'T4N R5E Sec 12 NE'. " +
      "Ensure township/range direction letters (N/S, E/W) are present and a meridian name is included.";
  }

  return ok(JSON.stringify(result, null, 2));
}
