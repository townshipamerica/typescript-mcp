# townshipamerica-mcp

Township America MCP server — PLSS and Texas TXSS tools for AI agents (Claude Desktop, Cursor, Continue, Cline).

Requires a [Pro+ subscription](https://townshipamerica.com/pricing) ($99/mo).

[API Documentation](https://townshipamerica.com/api) · [GitHub](https://github.com/townshipamerica/typescript-mcp) · [npm](https://www.npmjs.com/package/townshipamerica-mcp) · [Python MCP](https://github.com/townshipamerica/python-mcp)

## Quick Start

Generate your API key at [app.townshipamerica.com/settings/api-keys](https://app.townshipamerica.com/settings/api-keys).

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "townshipamerica": {
      "command": "npx",
      "args": ["-y", "townshipamerica-mcp"],
      "env": {
        "TOWNSHIP_AMERICA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop to apply.

### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "townshipamerica": {
      "command": "npx",
      "args": ["-y", "townshipamerica-mcp"],
      "env": {
        "TOWNSHIP_AMERICA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Continue / Cline

Use the same `npx` command with `TOWNSHIP_AMERICA_API_KEY` in `env` (see examples in this repo's history for Continue/Cline JSON shapes).

### Local binary

After `npm install -g townshipamerica-mcp`:

```bash
TOWNSHIP_AMERICA_API_KEY=ta_… townshipamerica-mcp
```

## Tools

| Tool | Description |
| --- | --- |
| `plss_to_coordinates` | Convert a PLSS description to GPS coordinates |
| `coordinates_to_plss` | Find the PLSS description for GPS coordinates |
| `plss_to_geojson` | Get the GeoJSON boundary polygon for a PLSS description |
| `validate_description` | Validate and normalize locally (no API call) |
| `batch_convert` | Convert up to 100 descriptions in one request |
| `autocomplete` | Suggestions for partial PLSS input (max 10) |

Coverage: 30 PLSS states, 37 principal meridians. Powered by BLM CadNSDI V2.

## Authentication

| Variable | Purpose |
| --- | --- |
| `TOWNSHIP_AMERICA_API_KEY` | Your Pro+ API key (**preferred**) |
| `TA_API_KEY` | Legacy alias for `TOWNSHIP_AMERICA_API_KEY` |
| `TOWNSHIP_AMERICA_BASE_URL` | Override API base URL (default: `https://developer.townshipamerica.com`) |

## Quota

Pro+ bundled API access: 1,000 search calls/month. Quota is enforced by the API. If exceeded, tools return a clear message with upgrade guidance.

## Requirements

- Node.js 22+
- Pro+ API key

## Programmatic use

```typescript
import { createServer } from "townshipamerica-mcp";

const server = createServer(process.env.TOWNSHIP_AMERICA_API_KEY!);
```

## License

MIT — Maps & Apps Inc.
