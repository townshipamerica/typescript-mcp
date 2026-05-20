import {
  API_KEY_ENV,
  API_KEY_HELP_URL,
  LEGACY_API_KEY_ENV,
} from "./constants.js";

/** Read API key from environment (primary env var first, then legacy alias). */
export function getApiKeyFromEnv(): string {
  const key =
    process.env[API_KEY_ENV]?.trim() ||
    process.env[LEGACY_API_KEY_ENV]?.trim() ||
    "";
  if (!key) {
    throw new Error(
      `Township America API key is required. ` +
        `Set ${API_KEY_ENV} (preferred) or ${LEGACY_API_KEY_ENV}. ` +
        `Generate a key at ${API_KEY_HELP_URL}.`,
    );
  }
  return key;
}
