import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError, QuotaError } from "../api-client.js";
import type { ApiClient } from "../api-client.js";
import type { GeoJSONFeatureCollection } from "../types.js";
import { ok, err } from "../tool-helpers.js";

export const plssToGeojsonTool: Tool = {
  name: "plss_to_geojson",
  description:
    "Get the GeoJSON boundary polygon for a PLSS legal land description. " +
    "Returns a FeatureCollection with the polygon footprint of the section or quarter-section.",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "PLSS legal land description, e.g. 'NW 25 24N 1E 6th Meridian'"
      }
    },
    required: ["description"]
  }
};

export async function runPlssToGeojson(
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
      return err(`No GeoJSON found for description: "${description}".`);
    }

    const fc = data as GeoJSONFeatureCollection;
    const polygonFeatures = fc.features.filter((f) => f.geometry.type === "Polygon");

    const result: GeoJSONFeatureCollection = {
      type: "FeatureCollection",
      features: polygonFeatures
    };

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
