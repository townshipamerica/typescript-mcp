# @townshipamerica/mcp-server

Township America MCP server — PLSS tools for AI agents (Claude Desktop, Cursor, Continue, Cline).

Requires a [Pro+ subscription](https://townshipamerica.com/pricing) ($99/mo).

## Quick Start

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "townshipamerica": {
      "command": "npx",
      "args": ["-y", "@townshipamerica/mcp-server"],
      "env": {
        "TA_API_KEY": "your_api_key_here"
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
      "args": ["-y", "@townshipamerica/mcp-server"],
      "env": {
        "TA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Continue

Edit `~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "@townshipamerica/mcp-server"],
          "env": { "TA_API_KEY": "your_api_key_here" }
        }
      }
    ]
  }
}
```

### Cline

Add to Cline MCP Servers settings:

```json
{
  "mcpServers": {
    "townshipamerica": {
      "command": "npx",
      "args": ["-y", "@townshipamerica/mcp-server"],
      "env": { "TA_API_KEY": "your_api_key_here" }
    }
  }
}
```

## Tools

| Tool                   | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `plss_to_coordinates`  | Convert a PLSS description to GPS coordinates                  |
| `coordinates_to_plss`  | Find the PLSS description for GPS coordinates                  |
| `plss_to_geojson`      | Get the GeoJSON boundary polygon for a PLSS description        |
| `validate_description` | Validate and normalize a PLSS description (local, no API call) |
| `batch_convert`        | Convert up to 1,000 PLSS descriptions in one request           |
| `land_report`          | Federal Land Report — coming Q3 2025                           |

## Authentication

Get your API key at [app.townshipamerica.com/settings/api-keys](https://app.townshipamerica.com/settings/api-keys).

## Quota

Pro+ bundled API access: 1,000 search calls/month. Quota is enforced by the AWS API Gateway. If exceeded, tools return:

> "Pro+ bundled quota exceeded (1,000 calls/month). Upgrade to standalone Scale tier ($100/mo for 10,000 calls) or wait for next month."

## Requirements

- Node.js 22+
- Pro+ API key

## License

MIT — Maps & Apps Inc.
