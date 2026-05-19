import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError, QuotaError, extractSearchResult } from "../api-client.js";
import type { ApiClient } from "../api-client.js";
import type { GeoJSONFeatureCollection } from "../types.js";
import { ok, err } from "../tool-helpers.js";

export const plssToCoordinatesTool: Tool = {
  name: "plss_to_coordinates",
  description:
    "Convert a PLSS (Public Land Survey System) legal land description to GPS coordinates. " +
    "Supports US legal descriptions such as 'NW 25 24N 1E 6th Meridian', 'T4N R5E Sec 12 NE¼', etc.",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description:
          "PLSS legal land description, e.g. 'NW 25 24N 1E 6th Meridian' or 'T4N R5E Sec 12 NE¼'"
      }
    },
    required: ["description"]
  }
};

export async function runPlssToCoordinates(
  client: ApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const description = args.description;
  if (typeof description !== "string" || description.trim().length === 0) {
    return err("Error: 'description' must be a non-empty string.");
  }

  try {
    const params = new URLSearchParams({ location: description.trim() });
    const data = await client.request<GeoJSONFeatureCollection | Record<string, never>>(
      `/search/legal-location?${params}`
    );

    if (!("features" in data) || !data.features?.length) {
      return err(`No results found for description: "${description}". Verify the PLSS format and try again.`);
    }

    const result = extractSearchResult(data as GeoJSONFeatureCollection);
    return ok(JSON.stringify(result, null, 2));
  } catch (e) {
    const text = e instanceof QuotaError
      ? e.message
      : e instanceof ApiError
        ? `API error (${e.statusCode}): ${e.message}`
        : `Unexpected error: ${String(e)}`;
    return err(text);
  }
}
