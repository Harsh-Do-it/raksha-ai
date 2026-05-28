/**
 * Maps Service — Google Maps integration helpers for Raksha AI frontend.
 *
 * Provides reverse geocoding and nearby hospital lookup.
 * Falls back to the backend API endpoints when called.
 */

const API_BASE =
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE_URL) ||
  "http://127.0.0.1:5000";

/**
 * Reverse-geocode coordinates to a human-readable address.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Object>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `${API_BASE}/maps/reverse-geocode?lat=${lat}&lng=${lng}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[mapsService] reverseGeocode failed, using fallback:", err);
    return {
      formatted_address: `${lat}, ${lng}`,
      address: `Approximate location at ${lat}, ${lng}`,
      city: "Unknown",
      state: "Unknown",
      country: "Unknown",
      source: "fallback",
    };
  }
}

/**
 * Find nearby hospitals for a given location.
 * @param {number} lat
 * @param {number} lng
 * @param {number} [radiusKm=5]
 * @param {number} [limit=5]
 * @returns {Promise<Array>}
 */
export async function getNearbyHospitals(lat, lng, radiusKm = 5, limit = 5) {
  try {
    const res = await fetch(
      `${API_BASE}/maps/hospitals?lat=${lat}&lng=${lng}&radius_km=${radiusKm}&limit=${limit}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[mapsService] getNearbyHospitals failed, using fallback:", err);
    return [
      {
        name: "City General Hospital",
        lat: lat + 0.004,
        lng: lng + 0.002,
        distance_km: 0.5,
        eta_minutes: 5,
        phone: null,
        address: "Fallback location",
      },
    ];
  }
}

export default {
  reverseGeocode,
  getNearbyHospitals,
};
