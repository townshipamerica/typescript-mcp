/** GeoJSON geometry types used across tool responses */

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

export type GeoJSONGeometry = GeoJSONPoint | GeoJSONPolygon;

export interface GeoJSONFeatureProperties {
  legal_location: string;
  state: string;
  county: string;
  shape: string;
  unit?: string;
  survey_system?: string;
  alternate_legal_location?: string;
  search_term?: string;
  [key: string]: unknown;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONGeometry;
  properties: GeoJSONFeatureProperties;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

/** Normalised search result extracted from a FeatureCollection */
export interface SearchResult {
  legal_location: string;
  lat: number;
  lng: number;
  state: string;
  county: string;
  geometry: GeoJSONPolygon | null;
}

/** Batch conversion record */
export interface BatchRecord {
  input: string;
  result: SearchResult | null;
  error?: string;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  normalized?: string;
  suggestion?: string;
}

/** Server factory options */
export interface ServerOptions {
  /** AWS API Gateway base URL */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
}

