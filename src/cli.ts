import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BASE_URL_ENV } from "./constants.js";
import { getApiKeyFromEnv } from "./env.js";
import { createServer } from "./server.js";

try {
  const apiKey = getApiKeyFromEnv();
  const options = process.env[BASE_URL_ENV]
    ? { baseUrl: process.env[BASE_URL_ENV] }
    : {};
  const server = createServer(apiKey, options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
} catch (err) {
  process.stderr.write(
    `Error: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
}
