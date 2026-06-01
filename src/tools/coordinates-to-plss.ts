import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError, QuotaError, extractSearchResult } from "../api-client.js";
import type { ApiClient } from "../api-client.js";
import type { GeoJSONFeatureCollection } from "../types.js";
import { ok, err } from "../tool-helpers.js";

export const coordinatesToPlssTool: Tool = {
  name: "coordinates_to_plss",
  description:
    "Find the PLSS (Public Land Survey System) legal land description for given GPS coordinates. " +
    "Returns the section, township, range, and principal meridian for any US location covered by PLSS.",
  inputSchema: {
    type: "object",
    properties: {
      lat: {
        type: "number",
        description: "Latitude in decimal degrees (e.g. 44.5)"
      },
      lng: {
        type: "number",
        description: "Longitude in decimal degrees (e.g. -110.3)"
      }
    },
    required: ["lat", "lng"]
  }
};

export async function runCoordinatesToPlss(
  client: ApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const lat = args.lat;
  const lng = args.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return err("Error: 'lat' and 'lng' must be numbers.");
  }

  if (lat < -90 || lat > 90) {
    return err("Error: 'lat' must be between -90 and 90.");
  }

  if (lng < -180 || lng > 180) {
    return err("Error: 'lng' must be between -180 and 180.");
  }

  try {
    const params = new URLSearchParams({ location: `${lng},${lat}` });
    const data = await client.request<GeoJSONFeatureCollection | Record<string, never>>(
      `/search/coordinates?${params}`
    );

    if (!("features" in data) || !data.features?.length) {
      return err(
        `No legal land description found for coordinates [${lat}, ${lng}]. ` +
          "PLSS covers 30 US states and Texas uses TXSS — this location may be outside surveyed coverage.",
      );
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
