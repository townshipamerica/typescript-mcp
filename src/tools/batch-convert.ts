import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError, QuotaError, extractSearchResult } from "../api-client.js";
import type { ApiClient } from "../api-client.js";
import type { BatchRecord, GeoJSONFeatureCollection } from "../types.js";
import { ok, err } from "../tool-helpers.js";

import { MAX_BATCH_SIZE } from "../constants.js";

export const batchConvertTool: Tool = {
  name: "batch_convert",
  description:
    "Convert multiple PLSS legal land descriptions to GPS coordinates in one request. " +
    `Accepts up to ${MAX_BATCH_SIZE} descriptions per request. Returns an array of converted records.`,
  inputSchema: {
    type: "object",
    properties: {
      descriptions: {
        type: "array",
        items: { type: "string" },
        description: `Array of PLSS legal land descriptions (max ${MAX_BATCH_SIZE})`,
        maxItems: MAX_BATCH_SIZE,
      },
    },
    required: ["descriptions"],
  },
};

export async function runBatchConvert(
  client: ApiClient,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const descriptions = args.descriptions;

  if (!Array.isArray(descriptions) || descriptions.length === 0) {
    return err("Error: 'descriptions' must be a non-empty array.");
  }

  if (descriptions.length > MAX_BATCH_SIZE) {
    return err(
      `Error: batch_convert accepts at most ${MAX_BATCH_SIZE} descriptions; ` +
        `received ${descriptions.length}.`,
    );
  }

  for (const d of descriptions) {
    if (typeof d !== "string") {
      return err("Error: all items in 'descriptions' must be strings.");
    }
  }

  try {
    const data = await client.request<(GeoJSONFeatureCollection | null)[]>(
      "/batch/legal-location",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(descriptions),
      },
    );

    const records: BatchRecord[] = (descriptions as string[]).map(
      (input, i) => {
        const fc = data[i];
        if (!fc || !fc.features?.length) {
          return { input, result: null, error: "Not found" };
        }
        try {
          return { input, result: extractSearchResult(fc) };
        } catch (e) {
          return {
            input,
            result: null,
            error: e instanceof Error ? e.message : "Parse error",
          };
        }
      },
    );

    const summary = {
      total: records.length,
      converted: records.filter((r) => r.result !== null).length,
      failed: records.filter((r) => r.result === null).length,
      records,
    };

    return ok(JSON.stringify(summary, null, 2));
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
