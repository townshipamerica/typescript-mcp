import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** Return a successful tool result with text content */
export function ok(text: string): CallToolResult {
  return { content: [{ type: "text" as const, text }] };
}

/** Return an error tool result with text content */
export function err(text: string): CallToolResult {
  return { content: [{ type: "text" as const, text }], isError: true };
}
