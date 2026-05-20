import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";
import { ApiClient } from "./api-client.js";
import {
  API_KEY_ENV,
  DEFAULT_AUTOCOMPLETE_LIMIT,
  LEGACY_API_KEY_ENV,
  MAX_AUTOCOMPLETE_LIMIT,
  MAX_BATCH_SIZE,
  PACKAGE_VERSION,
} from "./constants.js";
import type { ServerOptions } from "./types.js";

import { runPlssToCoordinates } from "./tools/plss-to-coordinates.js";
import { runCoordinatesToPlss } from "./tools/coordinates-to-plss.js";
import { runPlssToGeojson } from "./tools/plss-to-geojson.js";
import { runValidateDescription } from "./tools/validate-description.js";
import { runBatchConvert } from "./tools/batch-convert.js";
import { runLandReport } from "./tools/land-report.js";
import { runAutocomplete } from "./tools/autocomplete.js";

export type { ServerOptions } from "./types.js";

/**
 * Create and configure the Township America MCP server.
 *
 * @param apiKey - Pro+ API key, passed as X-API-Key to the Township America API
 * @param options - Optional base URL and timeout overrides
 */
export function createServer(
  apiKey: string,
  options: ServerOptions = {},
): McpServer {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      "Township America API key is required. " +
        `Set ${API_KEY_ENV} (preferred) or ${LEGACY_API_KEY_ENV}, or pass apiKey to createServer().`,
    );
  }

  const client = new ApiClient(apiKey, options);

  const server = new McpServer({
    name: "townshipamerica",
    version: PACKAGE_VERSION,
  });

  server.registerTool(
    "plss_to_coordinates",
    {
      title: "PLSS to Coordinates",
      description:
        "Convert a PLSS (Public Land Survey System) legal land description to GPS coordinates. " +
        "Supports US legal descriptions such as 'NW 25 24N 1E 6th Meridian', 'T4N R5E Sec 12 NE¼', etc. " +
        "Covers 30 PLSS states and 37 principal meridians.",
      inputSchema: z.object({
        description: z
          .string()
          .min(1)
          .describe(
            "PLSS legal land description, e.g. 'NW 25 24N 1E 6th Meridian' or 'T4N R5E Sec 12 NE¼'",
          ),
      }),
    },
    async ({ description }) => runPlssToCoordinates(client, { description }),
  );

  server.registerTool(
    "coordinates_to_plss",
    {
      title: "Coordinates to PLSS",
      description:
        "Find the PLSS (Public Land Survey System) legal land description for given GPS coordinates. " +
        "Returns the section, township, range, and principal meridian for any US location covered by PLSS.",
      inputSchema: z.object({
        lat: z
          .number()
          .min(-90)
          .max(90)
          .describe("Latitude in decimal degrees (e.g. 44.5)"),
        lng: z
          .number()
          .min(-180)
          .max(180)
          .describe("Longitude in decimal degrees (e.g. -110.3)"),
      }),
    },
    async ({ lat, lng }) => runCoordinatesToPlss(client, { lat, lng }),
  );

  server.registerTool(
    "plss_to_geojson",
    {
      title: "PLSS to GeoJSON",
      description:
        "Get the GeoJSON boundary polygon for a PLSS legal land description. " +
        "Returns a FeatureCollection with the polygon footprint of the section or quarter-section.",
      inputSchema: z.object({
        description: z
          .string()
          .min(1)
          .describe(
            "PLSS legal land description, e.g. 'NW 25 24N 1E 6th Meridian'",
          ),
      }),
    },
    async ({ description }) => runPlssToGeojson(client, { description }),
  );

  server.registerTool(
    "validate_description",
    {
      title: "Validate PLSS Description",
      description:
        "Validate and normalize a PLSS legal land description string. " +
        "Returns whether the input matches known PLSS patterns, a normalized form, and suggestions if invalid. " +
        "No API call is made — this runs locally.",
      inputSchema: z.object({
        description: z
          .string()
          .min(1)
          .describe(
            "PLSS description to validate, e.g. 'NW 25 24N 1E 6th Meridian'",
          ),
      }),
    },
    async ({ description }) => runValidateDescription(null, { description }),
  );

  server.registerTool(
    "batch_convert",
    {
      title: "Batch Convert PLSS",
      description:
        "Convert multiple PLSS legal land descriptions to GPS coordinates in one request. " +
        `Accepts up to ${MAX_BATCH_SIZE} descriptions per request. Returns total, converted, failed counts and records.`,
      inputSchema: z.object({
        descriptions: z
          .array(z.string())
          .min(1)
          .max(MAX_BATCH_SIZE)
          .describe(
            `Array of PLSS legal land descriptions (max ${MAX_BATCH_SIZE})`,
          ),
      }),
    },
    async ({ descriptions }) => runBatchConvert(client, { descriptions }),
  );

  server.registerTool(
    "autocomplete",
    {
      title: "PLSS Autocomplete",
      description:
        "Get autocomplete suggestions for a partial PLSS description (e.g. user typing 'T2N R4'). " +
        `Returns up to ${MAX_AUTOCOMPLETE_LIMIT} candidate descriptions.`,
      inputSchema: z.object({
        query: z
          .string()
          .min(2)
          .describe("Partial PLSS description (minimum 2 characters)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_AUTOCOMPLETE_LIMIT)
          .optional()
          .describe(
            `Maximum suggestions (default ${DEFAULT_AUTOCOMPLETE_LIMIT}, max ${MAX_AUTOCOMPLETE_LIMIT})`,
          ),
      }),
    },
    async ({ query, limit }) => runAutocomplete(client, { query, limit }),
  );

  server.registerTool(
    "land_report",
    {
      title: "Federal Land Report",
      description:
        "Retrieve a Federal Land Report for a PLSS legal land description. " +
        "Provides federal land status, BLM ownership, mineral rights, surface ownership, and water rights data. " +
        "NOTE: MCP delivery of Federal Land Reports is coming Q3 2025.",
      inputSchema: z.object({
        description: z
          .string()
          .min(1)
          .describe(
            "PLSS legal land description, e.g. 'NW 25 24N 1E 6th Meridian'",
          ),
      }),
    },
    async ({ description }) => runLandReport(null, { description }),
  );

  return server;
}
