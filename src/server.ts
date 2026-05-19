import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";
import { ApiClient } from "./api-client.js";
import type { ServerOptions } from "./types.js";

import { runPlssToCoordinates } from "./tools/plss-to-coordinates.js";
import { runCoordinatesToPlss } from "./tools/coordinates-to-plss.js";
import { runPlssToGeojson } from "./tools/plss-to-geojson.js";
import { runValidateDescription } from "./tools/validate-description.js";
import { runBatchConvert } from "./tools/batch-convert.js";
import { runLandReport } from "./tools/land-report.js";

export type { ServerOptions } from "./types.js";

/**
 * Create and configure the Township America MCP server.
 *
 * @param apiKey - Pro+ API key (TA_API_KEY), passed as X-API-Key to AWS API Gateway
 * @param options - Optional base URL and timeout overrides
 */
export function createServer(apiKey: string, options: ServerOptions = {}): McpServer {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      "Township America API key is required. " +
        "Set the TA_API_KEY environment variable or pass it to createServer()."
    );
  }

  const client = new ApiClient(apiKey, options);

  const server = new McpServer({
    name: "townshipamerica",
    version: "0.1.0"
  });

  // plss_to_coordinates
  server.registerTool(
    "plss_to_coordinates",
    {
      title: "PLSS to Coordinates",
      description:
        "Convert a PLSS (Public Land Survey System) legal land description to GPS coordinates. " +
        "Supports US legal descriptions such as 'NW 25 24N 1E 6th Meridian', 'T4N R5E Sec 12 NE¼', etc.",
      inputSchema: z.object({
        description: z
          .string()
          .min(1)
          .describe(
            "PLSS legal land description, e.g. 'NW 25 24N 1E 6th Meridian' or 'T4N R5E Sec 12 NE¼'"
          )
      })
    },
    async ({ description }) => {
      return runPlssToCoordinates(client, { description });
    }
  );

  // coordinates_to_plss
  server.registerTool(
    "coordinates_to_plss",
    {
      title: "Coordinates to PLSS",
      description:
        "Find the PLSS (Public Land Survey System) legal land description for given GPS coordinates. " +
        "Returns the section, township, range, and principal meridian for any US location covered by PLSS.",
      inputSchema: z.object({
        lat: z.number().min(-90).max(90).describe("Latitude in decimal degrees (e.g. 44.5)"),
        lng: z.number().min(-180).max(180).describe("Longitude in decimal degrees (e.g. -110.3)")
      })
    },
    async ({ lat, lng }) => {
      return runCoordinatesToPlss(client, { lat, lng });
    }
  );

  // plss_to_geojson
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
          .describe("PLSS legal land description, e.g. 'NW 25 24N 1E 6th Meridian'")
      })
    },
    async ({ description }) => {
      return runPlssToGeojson(client, { description });
    }
  );

  // validate_description
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
          .describe("PLSS description to validate, e.g. 'NW 25 24N 1E 6th Meridian'")
      })
    },
    async ({ description }) => {
      return runValidateDescription(null, { description });
    }
  );

  // batch_convert
  server.registerTool(
    "batch_convert",
    {
      title: "Batch Convert PLSS",
      description:
        "Convert multiple PLSS legal land descriptions to GPS coordinates in one request. " +
        "Accepts up to 1,000 descriptions for Pro+ bundled tier. Returns an array of converted records.",
      inputSchema: z.object({
        descriptions: z
          .array(z.string())
          .min(1)
          .max(1000)
          .describe("Array of PLSS legal land descriptions (max 1,000)")
      })
    },
    async ({ descriptions }) => {
      return runBatchConvert(client, { descriptions });
    }
  );

  // land_report
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
          .describe("PLSS legal land description, e.g. 'NW 25 24N 1E 6th Meridian'")
      })
    },
    async ({ description }) => {
      return runLandReport(null, { description });
    }
  );

  return server;
}
