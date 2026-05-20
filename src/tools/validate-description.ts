import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { validatePlssDescription } from "../plss-validation.js";
import { ok, err } from "../tool-helpers.js";

export async function runValidateDescription(
  _client: unknown,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const description = args.description;
  if (typeof description !== "string" || description.trim().length === 0) {
    return err("Error: 'description' must be a non-empty string.");
  }

  try {
    const result = validatePlssDescription(description);
    return ok(JSON.stringify({ input: description, ...result }, null, 2));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
