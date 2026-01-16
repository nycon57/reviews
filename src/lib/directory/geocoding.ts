"use server";

/**
 * Geocoding service using the US Census Geocoder API
 * Free, no API key required, US-only (fits mortgage industry)
 */

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

interface CensusGeocoderResponse {
  result: {
    addressMatches: Array<{
      coordinates: {
        x: number; // longitude
        y: number; // latitude
      };
      matchedAddress: string;
    }>;
  };
}

// Simple in-memory cache for geocoding results
const geocodeCache = new Map<string, GeocodingResult | null>();

/**
 * Geocode an address using the US Census Geocoder API
 * @param street - Street address (e.g., "123 Main St")
 * @param city - City name
 * @param state - State code (e.g., "CA")
 * @param zip - ZIP code
 * @returns Coordinates or null if geocoding fails
 */
export async function geocodeAddress(
  street?: string,
  city?: string,
  state?: string,
  zip?: string
): Promise<GeocodingResult | null> {
  // Build a cache key from the address components
  const cacheKey = `${street || ""}_${city || ""}_${state || ""}_${zip || ""}`.toLowerCase();

  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) || null;
  }

  // Need at least some address components
  if (!city && !zip && !street) {
    return null;
  }

  try {
    // Build the address string for the Census API
    const addressParts: string[] = [];
    if (street) addressParts.push(street);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (zip) addressParts.push(zip);

    const fullAddress = addressParts.join(", ");

    // Use the one-line address geocoding endpoint
    const url = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
    url.searchParams.set("address", fullAddress);
    url.searchParams.set("benchmark", "Public_AR_Current");
    url.searchParams.set("format", "json");

    // Create an AbortController for timeout (use globalThis for Node.js compatibility)
    const controller = new globalThis.AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    globalThis.clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("Census geocoder error:", response.status, response.statusText);
      geocodeCache.set(cacheKey, null);
      return null;
    }

    const data = (await response.json()) as CensusGeocoderResponse;

    if (!data.result?.addressMatches?.length) {
      // No matches found, cache the null result
      geocodeCache.set(cacheKey, null);
      return null;
    }

    // Get the first (best) match
    const match = data.result.addressMatches[0];
    const result: GeocodingResult = {
      latitude: match.coordinates.y,
      longitude: match.coordinates.x,
    };

    // Cache the result
    geocodeCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error("Geocoding error:", error instanceof Error ? error.message : error);
    geocodeCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Get approximate center coordinates for a US state
 * Used as a fallback when full address geocoding fails
 */
function getStateCenterCoordinates(stateCode: string): GeocodingResult | null {
  const stateCenters: Record<string, GeocodingResult> = {
    AL: { latitude: 32.7794, longitude: -86.8287 },
    AK: { latitude: 64.0685, longitude: -152.2782 },
    AZ: { latitude: 34.2744, longitude: -111.6602 },
    AR: { latitude: 34.8938, longitude: -92.4426 },
    CA: { latitude: 37.1841, longitude: -119.4696 },
    CO: { latitude: 38.9972, longitude: -105.5478 },
    CT: { latitude: 41.6219, longitude: -72.7273 },
    DE: { latitude: 38.9896, longitude: -75.5050 },
    FL: { latitude: 28.6305, longitude: -82.4497 },
    GA: { latitude: 32.6415, longitude: -83.4426 },
    HI: { latitude: 20.2927, longitude: -156.3737 },
    ID: { latitude: 44.3509, longitude: -114.6130 },
    IL: { latitude: 40.0417, longitude: -89.1965 },
    IN: { latitude: 39.8942, longitude: -86.2816 },
    IA: { latitude: 42.0751, longitude: -93.4960 },
    KS: { latitude: 38.4937, longitude: -98.3804 },
    KY: { latitude: 37.5347, longitude: -85.3021 },
    LA: { latitude: 31.0689, longitude: -91.9968 },
    ME: { latitude: 45.3695, longitude: -69.2428 },
    MD: { latitude: 39.0550, longitude: -76.7909 },
    MA: { latitude: 42.2596, longitude: -71.8083 },
    MI: { latitude: 44.3467, longitude: -85.4102 },
    MN: { latitude: 46.2807, longitude: -94.3053 },
    MS: { latitude: 32.7364, longitude: -89.6678 },
    MO: { latitude: 38.3566, longitude: -92.4580 },
    MT: { latitude: 47.0527, longitude: -109.6333 },
    NE: { latitude: 41.5378, longitude: -99.7951 },
    NV: { latitude: 39.3289, longitude: -116.6312 },
    NH: { latitude: 43.6805, longitude: -71.5811 },
    NJ: { latitude: 40.1907, longitude: -74.6728 },
    NM: { latitude: 34.4071, longitude: -106.1126 },
    NY: { latitude: 42.9538, longitude: -75.5268 },
    NC: { latitude: 35.5557, longitude: -79.3877 },
    ND: { latitude: 47.4501, longitude: -100.4659 },
    OH: { latitude: 40.2862, longitude: -82.7937 },
    OK: { latitude: 35.5889, longitude: -97.4943 },
    OR: { latitude: 43.9336, longitude: -120.5583 },
    PA: { latitude: 40.8781, longitude: -77.7996 },
    RI: { latitude: 41.6762, longitude: -71.5562 },
    SC: { latitude: 33.9169, longitude: -80.8964 },
    SD: { latitude: 44.4443, longitude: -100.2263 },
    TN: { latitude: 35.8580, longitude: -86.3505 },
    TX: { latitude: 31.4757, longitude: -99.3312 },
    UT: { latitude: 39.3055, longitude: -111.6703 },
    VT: { latitude: 44.0687, longitude: -72.6658 },
    VA: { latitude: 37.5215, longitude: -78.8537 },
    WA: { latitude: 47.3826, longitude: -120.4472 },
    WV: { latitude: 38.6409, longitude: -80.6227 },
    WI: { latitude: 44.6243, longitude: -89.9941 },
    WY: { latitude: 42.9957, longitude: -107.5512 },
    DC: { latitude: 38.9072, longitude: -77.0369 },
  };

  return stateCenters[stateCode.toUpperCase()] || null;
}

/**
 * Geocode an address with fallback to state center
 */
export async function geocodeAddressWithFallback(
  street?: string,
  city?: string,
  state?: string,
  zip?: string
): Promise<GeocodingResult | null> {
  // Try full address first
  const result = await geocodeAddress(street, city, state, zip);
  if (result) {
    return result;
  }

  // Fall back to state center if we have a state
  if (state) {
    return getStateCenterCoordinates(state);
  }

  return null;
}
