import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

const apiKey = process.env.TA_API_KEY;
if (!apiKey) {
  process.stderr.write(
    "Error: TA_API_KEY environment variable is not set.\n" +
      "Set it to your Township America Pro+ API key.\n" +
      "Generate a key at https://app.townshipamerica.com/settings/api-keys\n"
  );
  process.exit(1);
}

const server = createServer(apiKey);
const transport = new StdioServerTransport();

await server.connect(transport);
