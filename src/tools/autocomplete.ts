import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError, QuotaError } from "../api-client.js";
import type { ApiClient } from "../api-client.js";
import type { GeoJSONFeatureCollection } from "../types.js";
import {
  DEFAULT_AUTOCOMPLETE_LIMIT,
  MAX_AUTOCOMPLETE_LIMIT,
} from "../constants.js";
import { ok, err } from "../tool-helpers.js";

export async function runAutocomplete(
  client: ApiClient,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const query = args.query;
  if (typeof query !== "string" || query.trim().length < 2) {
    return err("Error: 'query' must be at least 2 characters.");
  }

  let limit = DEFAULT_AUTOCOMPLETE_LIMIT;
  if (args.limit !== undefined) {
    if (typeof args.limit !== "number" || !Number.isInteger(args.limit)) {
      return err("Error: 'limit' must be an integer.");
    }
    limit = Math.max(1, Math.min(args.limit, MAX_AUTOCOMPLETE_LIMIT));
  }

  try {
    const params = new URLSearchParams({
      location: query.trim(),
      limit: String(limit),
    });
    const data = await client.request<GeoJSONFeatureCollection>(
      `/autocomplete/legal-location?${params}`,
    );
    return ok(JSON.stringify(data, null, 2));
  } catch (e) {
    const text =
      e instanceof QuotaError
        ? e.message
        : e instanceof ApiError
          ? `API error (${e.statusCode}): ${e.message}`
          : `Unexpected error: ${String(e)}`;
    return err(text);
  }
}
