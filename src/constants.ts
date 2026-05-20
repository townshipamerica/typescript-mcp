/** Shared constants (aligned with python-mcp). */

export const PACKAGE_VERSION = "1.0.0";

export const API_KEY_ENV = "TOWNSHIP_AMERICA_API_KEY";
export const LEGACY_API_KEY_ENV = "TA_API_KEY";
export const BASE_URL_ENV = "TOWNSHIP_AMERICA_BASE_URL";

export const DEFAULT_BASE_URL = "https://developer.townshipamerica.com";
export const DEFAULT_TIMEOUT_MS = 10_000;

export const MAX_BATCH_SIZE = 100;
export const MAX_AUTOCOMPLETE_LIMIT = 10;
export const DEFAULT_AUTOCOMPLETE_LIMIT = 10;

export const API_KEY_HELP_URL =
  "https://app.townshipamerica.com/settings/api-keys";

export const QUOTA_ERROR =
  "Pro+ bundled quota exceeded for this endpoint (1,000 calls/month). " +
  "Upgrade to standalone Scale tier ($100/mo for 10,000 calls) or wait for next month. " +
  "Visit https://townshipamerica.com/pricing to manage your plan.";
