import type { GeoJSONFeatureCollection, SearchResult, ServerOptions } from "./types.js";

export const DEFAULT_BASE_URL = "https://developer.townshipamerica.com";
export const DEFAULT_TIMEOUT_MS = 10_000;

/** Quota-exceeded error message returned as MCP tool content */
export const QUOTA_ERROR =
  "Pro+ bundled quota exceeded for this endpoint (1,000 calls/month). " +
  "Upgrade to standalone Scale tier ($100/mo for 10,000 calls) or wait for next month. " +
  "Visit https://townshipamerica.com/pricing to manage your plan.";

export function extractSearchResult(fc: GeoJSONFeatureCollection): SearchResult {
  const centroid = fc.features.find((f) => f.properties.shape === "centroid");
  const grid = fc.features.find((f) => f.properties.shape === "grid");
  const props = centroid?.properties ?? grid?.properties;

  if (!props) {
    throw new Error("Unexpected API response: no features returned");
  }

  const coords = centroid?.geometry.type === "Point" ? centroid.geometry.coordinates : [0, 0];
  const [lng, lat] = coords as [number, number];

  const boundary =
    grid?.geometry.type === "Polygon"
      ? (grid.geometry as { type: "Polygon"; coordinates: [number, number][][] })
      : null;

  return {
    legal_location: props.legal_location,
    lat,
    lng,
    state: props.state,
    county: props.county,
    geometry: boundary
  };
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly apiKey: string,
    options: ServerOptions = {}
  ) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          "X-API-Key": this.apiKey,
          "User-Agent": "@townshipamerica/mcp-server/0.1.0",
          ...(init?.headers ?? {})
        },
        signal: controller.signal
      });

      if (response.status === 429) {
        throw new QuotaError(QUOTA_ERROR);
      }

      if (!response.ok) {
        let message: string;
        try {
          const body = (await response.json()) as Record<string, unknown>;
          message = String(body.error ?? body.message ?? response.statusText);
        } catch {
          message = response.statusText;
        }
        throw new ApiError(message, response.status);
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof QuotaError || err instanceof ApiError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new ApiError("Request timed out after 10s", 408);
      }
      throw new ApiError(err instanceof Error ? err.message : "Unknown error", 0);
    } finally {
      clearTimeout(timer);
    }
  }
}

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}
