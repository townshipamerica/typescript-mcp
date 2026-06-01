import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient, QuotaError } from "../src/api-client.js";
import { runPlssToCoordinates } from "../src/tools/plss-to-coordinates.js";
import { runCoordinatesToPlss } from "../src/tools/coordinates-to-plss.js";
import { runPlssToGeojson } from "../src/tools/plss-to-geojson.js";
import { runValidateDescription } from "../src/tools/validate-description.js";
import { runBatchConvert } from "../src/tools/batch-convert.js";
import { runLandReport } from "../src/tools/land-report.js";
import { runAutocomplete } from "../src/tools/autocomplete.js";
import { getApiKeyFromEnv } from "../src/env.js";
import { API_KEY_ENV, LEGACY_API_KEY_ENV } from "../src/constants.js";

// --- Fixtures ---

const centroidFeature = {
  type: "Feature" as const,
  geometry: {
    type: "Point" as const,
    coordinates: [-110.3, 44.5] as [number, number],
  },
  properties: {
    legal_location: "NW-25-24N-1E-6th-Meridian",
    state: "Wyoming",
    county: "Park",
    shape: "centroid",
    unit: "quarter",
  },
};

const gridFeature = {
  type: "Feature" as const,
  geometry: {
    type: "Polygon" as const,
    coordinates: [
      [
        [-110.4, 44.4],
        [-110.3, 44.4],
        [-110.3, 44.5],
        [-110.4, 44.5],
        [-110.4, 44.4],
      ] as [number, number][],
    ],
  },
  properties: {
    legal_location: "NW-25-24N-1E-6th-Meridian",
    state: "Wyoming",
    county: "Park",
    shape: "grid",
    unit: "quarter",
  },
};

const mockFeatureCollection = {
  type: "FeatureCollection" as const,
  features: [centroidFeature, gridFeature],
};

// --- Helpers ---

function makeClient(mockFn: ReturnType<typeof vi.fn>): ApiClient {
  const client = new ApiClient("test-key");
  vi.spyOn(client, "request").mockImplementation(mockFn);
  return client;
}

// --- Tests ---

describe("plss_to_coordinates", () => {
  it("returns search result for valid description", async () => {
    const client = makeClient(vi.fn().mockResolvedValue(mockFeatureCollection));
    const res = await runPlssToCoordinates(client, {
      description: "NW 25 24N 1E 6th Meridian",
    });
    expect(res.isError).toBeFalsy();
    const parsed = JSON.parse(res.content[0].text) as Record<string, unknown>;
    expect(parsed.legal_location).toBe("NW-25-24N-1E-6th-Meridian");
    expect(parsed.lat).toBe(44.5);
    expect(parsed.lng).toBe(-110.3);
    expect(parsed.state).toBe("Wyoming");
  });

  it("returns error for empty description", async () => {
    const client = makeClient(vi.fn());
    const res = await runPlssToCoordinates(client, { description: "   " });
    expect(res.isError).toBe(true);
  });

  it("returns error when no features found", async () => {
    const client = makeClient(
      vi.fn().mockResolvedValue({ type: "FeatureCollection", features: [] }),
    );
    const res = await runPlssToCoordinates(client, { description: "garbage" });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("No results found");
  });

  it("maps 429 quota error to MCP error text", async () => {
    const client = makeClient(
      vi.fn().mockRejectedValue(new QuotaError("quota exceeded")),
    );
    const res = await runPlssToCoordinates(client, {
      description: "NW 25 24N 1E 6th Meridian",
    });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("quota exceeded");
  });
});

describe("coordinates_to_plss", () => {
  it("returns search result for valid coordinates", async () => {
    const client = makeClient(vi.fn().mockResolvedValue(mockFeatureCollection));
    const res = await runCoordinatesToPlss(client, { lat: 44.5, lng: -110.3 });
    expect(res.isError).toBeFalsy();
    const parsed = JSON.parse(res.content[0].text) as Record<string, unknown>;
    expect(parsed.legal_location).toBe("NW-25-24N-1E-6th-Meridian");
  });

  it("rejects invalid lat", async () => {
    const client = makeClient(vi.fn());
    const res = await runCoordinatesToPlss(client, { lat: 999, lng: -110.3 });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("lat");
  });

  it("rejects non-numeric input", async () => {
    const client = makeClient(vi.fn());
    const res = await runCoordinatesToPlss(client, {
      lat: "44.5",
      lng: -110.3,
    });
    expect(res.isError).toBe(true);
  });

  it("maps 429 to quota error", async () => {
    const client = makeClient(
      vi.fn().mockRejectedValue(new QuotaError("rate limited")),
    );
    const res = await runCoordinatesToPlss(client, { lat: 44.5, lng: -110.3 });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("rate limited");
  });
});

describe("plss_to_geojson", () => {
  it("returns polygon features only", async () => {
    const client = makeClient(vi.fn().mockResolvedValue(mockFeatureCollection));
    const res = await runPlssToGeojson(client, {
      description: "NW 25 24N 1E 6th Meridian",
    });
    expect(res.isError).toBeFalsy();
    const fc = JSON.parse(res.content[0].text) as {
      features: Array<{ geometry: { type: string } }>;
    };
    expect(fc.features.every((f) => f.geometry.type === "Polygon")).toBe(true);
    expect(fc.features.length).toBe(1);
  });
});

describe("validate_description", () => {
  it("marks a well-formed description as valid", async () => {
    const res = await runValidateDescription(null, {
      description: "NW 25 24N 1E 6th Meridian",
    });
    const parsed = JSON.parse(res.content[0].text) as {
      valid: boolean;
      normalized: string;
    };
    expect(parsed.valid).toBe(true);
    expect(typeof parsed.normalized).toBe("string");
  });

  it("marks a garbage string as invalid and provides suggestion", async () => {
    const res = await runValidateDescription(null, {
      description: "hello world",
    });
    const parsed = JSON.parse(res.content[0].text) as {
      valid: boolean;
      suggestion: string;
    };
    expect(parsed.valid).toBe(false);
    expect(typeof parsed.suggestion).toBe("string");
  });

  it("marks a Texas TXSS description as valid", async () => {
    const res = await runValidateDescription(null, {
      description: "A-175 Reeves County",
    });
    const parsed = JSON.parse(res.content[0].text) as {
      valid: boolean;
      survey_system: string;
    };
    expect(parsed.valid).toBe(true);
    expect(parsed.survey_system).toBe("TXSS");
  });

  it("returns error for empty string", async () => {
    const res = await runValidateDescription(null, { description: "" });
    expect(res.isError).toBe(true);
  });
});

describe("batch_convert", () => {
  it("returns summary with converted count", async () => {
    const batchResponse = [mockFeatureCollection, null];
    const client = makeClient(vi.fn().mockResolvedValue(batchResponse));
    const res = await runBatchConvert(client, {
      descriptions: ["NW 25 24N 1E 6th Meridian", "bad input"],
    });
    expect(res.isError).toBeFalsy();
    const summary = JSON.parse(res.content[0].text) as {
      total: number;
      converted: number;
      failed: number;
    };
    expect(summary.total).toBe(2);
    expect(summary.converted).toBe(1);
    expect(summary.failed).toBe(1);
  });

  it("rejects empty descriptions array", async () => {
    const client = makeClient(vi.fn());
    const res = await runBatchConvert(client, { descriptions: [] });
    expect(res.isError).toBe(true);
  });

  it("rejects batch over 100 items", async () => {
    const client = makeClient(vi.fn());
    const res = await runBatchConvert(client, {
      descriptions: Array.from(
        { length: 101 },
        () => "NW 25 24N 1E 6th Meridian",
      ),
    });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("100");
  });

  it("maps 429 to quota error", async () => {
    const client = makeClient(
      vi.fn().mockRejectedValue(new QuotaError("quota")),
    );
    const res = await runBatchConvert(client, {
      descriptions: ["NW 25 24N 1E 6th Meridian"],
    });
    expect(res.isError).toBe(true);
  });
});

describe("autocomplete", () => {
  it("returns suggestions for partial query", async () => {
    const client = makeClient(vi.fn().mockResolvedValue(mockFeatureCollection));
    const res = await runAutocomplete(client, { query: "T2N R4", limit: 5 });
    expect(res.isError).toBeFalsy();
    const parsed = JSON.parse(res.content[0].text) as { type: string };
    expect(parsed.type).toBe("FeatureCollection");
  });

  it("rejects query shorter than 2 characters", async () => {
    const client = makeClient(vi.fn());
    const res = await runAutocomplete(client, { query: "T" });
    expect(res.isError).toBe(true);
  });
});

describe("getApiKeyFromEnv", () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
    delete process.env[API_KEY_ENV];
    delete process.env[LEGACY_API_KEY_ENV];
  });

  afterEach(() => {
    process.env = original;
  });

  it("reads primary env var", () => {
    process.env[API_KEY_ENV] = "  ta_test  ";
    expect(getApiKeyFromEnv()).toBe("ta_test");
  });

  it("falls back to legacy env var", () => {
    process.env[LEGACY_API_KEY_ENV] = "ta_legacy";
    expect(getApiKeyFromEnv()).toBe("ta_legacy");
  });

  it("throws when missing", () => {
    expect(() => getApiKeyFromEnv()).toThrow(API_KEY_ENV);
  });
});

describe("land_report", () => {
  it("returns coming_soon stub", async () => {
    const res = await runLandReport(null, {
      description: "NW 25 24N 1E 6th Meridian",
    });
    expect(res.isError).toBeFalsy();
    const parsed = JSON.parse(res.content[0].text) as { status: string };
    expect(parsed.status).toBe("coming_soon");
  });

  it("returns error for empty description", async () => {
    const res = await runLandReport(null, { description: "" });
    expect(res.isError).toBe(true);
  });
});
