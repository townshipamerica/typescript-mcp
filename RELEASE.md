# Releasing the Township America MCP Server

This runbook covers shipping `townshipamerica-mcp` to npm + the
companion `townshipamerica-mcp` PyPI package + submitting to the major MCP
registries. Each step requires credentials we can't safely commit; the
runbook is checklists you can step through.

---

## Step 1 — Reserve package names (free, ~10 min)

### npm

Reserve `townshipamerica-mcp`:

```bash
cd packages/mcp-server
npm login                       # if not already
npm publish --access public --dry-run
# Confirm the manifest looks right, then:
npm publish --access public
```

If `@townshipamerica` org doesn't exist on npm, create it first at
https://www.npmjs.com/org/create — free.

### PyPI

Reserve `townshipamerica-mcp` on PyPI:

```bash
cd packages/python-sdk-mcp
python -m pip install --upgrade build twine
python -m build                  # produces dist/*.whl and dist/*.tar.gz
python -m twine upload --repository-url https://test.pypi.org/legacy/ dist/*
# Verify on test.pypi.org/project/townshipamerica-mcp/
# Then publish for real:
python -m twine upload dist/*
```

Requires `~/.pypirc` with API token, or `TWINE_USERNAME=__token__` +
`TWINE_PASSWORD=pypi-...`. Generate a token at
https://pypi.org/manage/account/token/ scoped to the project once it exists.

**Squat-prevention tip:** publish a `0.0.1` placeholder release immediately
just to reserve the name, even if the real release is days away. Otherwise
someone else can grab the name.

---

## Step 2 — Production release of the npm package

After name reservation, the first real release:

```bash
cd packages/mcp-server
# Verify version in package.json matches the version you intend to ship
pnpm test                        # 18/18 should pass
pnpm build                       # produces dist/ via tsup
npm publish --access public
```

Test from a fresh shell:

```bash
npx -y townshipamerica-mcp@latest
# Should start the MCP server on stdio
```

---

## Step 3 — MCP registry submissions

Each registry has a different submission format. The metadata you'll need:

```yaml
name: townshipamerica
display_name: Township America
description: PLSS legal land description → GPS coordinates via Township America's REST API. Covers 30 US states, 37 principal meridians. Bundled with Pro+ subscriptions; standalone API tiers available.
homepage: https://townshipamerica.com
docs: https://townshipamerica.com/api/mcp
source: https://github.com/townshipamerica/web/tree/main/packages/mcp-server
license: (TBD — confirm before submitting)
tags:
  - geospatial
  - plss
  - gis
  - real-estate
  - oil-and-gas
  - land-management
auth: api_key # X-API-Key header forwarded to AWS API Gateway
tools:
  - plss_to_coordinates
  - coordinates_to_plss
  - plss_to_geojson
  - validate_description
  - batch_convert
  - autocomplete
install:
  command: npx
  args: [-y, "townshipamerica-mcp"]
  env:
    TOWNSHIP_AMERICA_API_KEY: "your Pro+ bundled API key"
```

### 3a. mcpservers.org (GitHub PR)

Fork https://github.com/mcpservers/mcpservers.

Add a new entry to `servers/townshipamerica.json` (or wherever their schema
lives — check existing entries). Open a PR titled "Add Township America MCP
server".

Review time: ~1 week.

### 3b. mcp.so (web form)

Submit at https://mcp.so/submit.

Form fields map roughly to the metadata above. Include the npm package URL,
docs URL, and a screenshot of a Claude Desktop session using the server
(record one for marketing too).

Review time: ~3-5 days.

### 3c. PulseMCP (GitHub PR or form)

Check https://www.pulsemcp.com/ for current submission method (was GitHub PR
last I checked; may have moved to a form).

Review time: ~1 week.

### 3d. Anthropic's official MCP server list

Anthropic maintains https://github.com/modelcontextprotocol/servers as the
canonical example list. Open a PR adding Township America to the README's
community servers table.

---

## Step 4 — Mark Pro+ marketing copy "available now"

Once the npm package is live and at least one registry has accepted us:

- Update `/api/mcp` page: change "Coming soon" badge → "Available now"
- Update pricing.js Pro+ description to reference MCP as live
- Send a one-off email to existing Pro+ subscribers with the MCP key + setup
  steps (use scripts/backfill-bundled-api-keys.js --email to re-send the
  welcome email with the new key copy, OR write a separate one-off campaign)

---

## Step 5 — Telemetry + iteration

The MCP server's tools forward to AWS API Gateway, so quota usage lands in
`api_request_logs` automatically (after migration 039 + 040 land). The
`/admin/pro-plus` retention dashboard's "Feature usage" section will surface
MCP-driven traffic.

Watch for:

- Total MCP installs (claude.ai analytics? GitHub clones? hard to measure
  without server-side install tracking — consider adding a `/mcp/install`
  endpoint that just logs)
- Quota saturation: if 5%+ of Pro+ users hit their bundled quota, the tier1
  decision may need revisiting → potentially bump bundled allocation to
  tier2 in a follow-up sprint
- Tool-specific usage: which of the 6 tools get most traffic. May warrant
  promoting a 7th tool (e.g., the Federal Land Report when /api/v1/report
  ships to AWS Gateway).

---

## Notes for the operator running this

- The Anthropic skill recommends not committing `~/.pypirc` or `~/.npmrc`
  with auth tokens. Use environment-variable injection at publish time.
- Both npm and PyPI support trusted publishing via OIDC from GitHub
  Actions — long-term, set up a GitHub workflow that publishes on tag
  push. For first release, manual is fine.
- After PyPI publish, the Python SDK README and package metadata reference
  the npm package name. Keep them in sync if either is renamed.
