import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ok, err } from "../tool-helpers.js";

export const landReportTool: Tool = {
  name: "land_report",
  description:
    "Retrieve a Federal Land Report for a PLSS legal land description. " +
    "Provides federal land status, BLM ownership, mineral rights, surface ownership, and water rights data. " +
    "NOTE: MCP delivery of Federal Land Reports is coming Q3 2025.",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description:
          "PLSS legal land description, e.g. 'NW 25 24N 1E 6th Meridian'",
      },
    },
    required: ["description"],
  },
};

export async function runLandReport(
  _client: unknown,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const description = args.description;
  if (typeof description !== "string" || description.trim().length === 0) {
    return err("Error: 'description' must be a non-empty string.");
  }

  // STUB: Federal Land Report via MCP is coming Q3 2025.
  // The /api/v1/report endpoint currently uses web-session auth only.
  // A dedicated AWS API Gateway endpoint will be provisioned for API-key auth in Q3.
  const stub = {
    status: "coming_soon",
    description: description.trim(),
    message:
      "Federal Land Report via MCP is coming Q3 2025. " +
      "Currently available via the Township America web app at " +
      "https://app.townshipamerica.com for Pro+ subscribers. " +
      "A dedicated API-key-authenticated endpoint will be available for AI agents this quarter.",
    preview_fields: [
      "federal_land_status",
      "blm_surface_ownership",
      "blm_mineral_ownership",
      "national_forest",
      "national_park",
      "tribal_lands",
      "water_rights",
      "patents",
    ],
  };

  return ok(JSON.stringify(stub, null, 2));
}
