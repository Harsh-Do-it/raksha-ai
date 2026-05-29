/**
 * LocationContext.jsx — Global Location State Provider
 * Raksha AI · frontend/src/context/
 *
 * Provides the entire app with:
 *  - Current GPS position (lat, lng, accuracy)
 *  - Reverse-geocoded human address (road, area, city)
 *  - Watch mode (continuous tracking for SOS / live map)
 *  - Geolocation permission state ("granted" | "denied" | "prompt" | "unsupported")
 *  - Manual location override (user picks a location on map)
 *  - Distance-change throttling (skips updates < MOVEMENT_THRESHOLD_M metres)
 *  - Loading / error state
 *
 * Consumed via the `useLocation` hook in any child component.
 *
 * Usage:
 *  // Wrap app in App.jsx:
 *  <LocationProvider>
 *    <App />
 *  </LocationProvider>
 *
 *  // In any component:
 *  const { location, address, startWatching, stopWatching, permissionState } = useLocation();
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { reverseGeocode } from "../services/mapsService";

// ── Constants ─────────────────────────────────────────────────────────────────
const MOVEMENT_THRESHOLD_M   = 15;    // ignore GPS updates < 15 m of movement
const REVERSE_GEOCODE_DEBOUNCE_MS = 4000; // wait 4s of stillness before reverse-geocoding
const DEFAULT_LOCATION = {
  lat:       28.6139,
  lng:       77.2090,
  accuracy:  null,
  isFallback: true,
  timestamp: null,
};

// ── Context ───────────────────────────────────────────────────────────────────
const LocationContext = createContext(null);

// ── Haversine distance (metres) ───────────────────────────────────────────────
function distanceMetres(a, b) {
  if (!a || !b) return Infinity;
  const R   = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinA = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sinA), Math.sqrt(1 - sinA));
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function LocationProvider({ children }) {
  const [location, setLocation]         = useState(null);       // { lat, lng, accuracy, isFallback, timestamp }
  const [address,  setAddress]          = useState(null);       // { road, area, city, pincode, formatted }
  const [permissionState, setPermState] = useState("prompt");   // "granted" | "denied" | "prompt" | "unsupported"
  const [isWatching, setIsWatching]     = useState(false);
  const [isLocating, setIsLocating]     = useState(false);      // one-shot fetch in progress
  const [error,     setError]           = useState(null);       // GeolocationPositionError message

  const watchIdRef         = useRef(null);
  const geocodeTimerRef    = useRef(null);
  const lastGeocodedRef    = useRef(null);  // lat/lng of last reverse-geocode call

  // ── Check permission state ──────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermState("unsupported");
      setLocation(DEFAULT_LOCATION);
      return;
    }

    // permissions API (not available in all browsers)
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then(result => {
          setPermState(result.state);
          result.onchange = () => setPermState(result.state);
        })
        .catch(() => {}); // permissions API unsupported — leave as "prompt"
    }
  }, []);

  // ── One-shot location fetch ─────────────────────────────────────────────────
  const fetchOnce = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(DEFAULT_LOCATION);
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      pos => {
        const next = {
          lat:        pos.coords.latitude,
          lng:        pos.coords.longitude,
          accuracy:   pos.coords.accuracy,
          isFallback: false,
          timestamp:  pos.timestamp,
        };
        setLocation(next);
        setIsLocating(false);
        setPermState("granted");
        scheduleReverseGeocode(next);
      },
      err => {
        setError(friendlyGeoError(err));
        setIsLocating(false);
        if (err.code === 1) setPermState("denied");
        if (!location) setLocation(DEFAULT_LOCATION);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 }
    );
  }, [location]);

  // Fetch on mount (passive, no blocking)
  useEffect(() => { fetchOnce(); }, []);

  // ── Watch mode (continuous) ─────────────────────────────────────────────────
  const startWatching = useCallback(() => {
    if (watchIdRef.current !== null) return; // already watching
    if (!navigator.geolocation) {
      setPermState("unsupported");
      return;
    }

    setIsWatching(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const next = {
          lat:        pos.coords.latitude,
          lng:        pos.coords.longitude,
          accuracy:   pos.coords.accuracy,
          isFallback: false,
          timestamp:  pos.timestamp,
        };

        setLocation(prev => {
          const moved = distanceMetres(prev, next);
          if (moved < MOVEMENT_THRESHOLD_M && prev?.lat) return prev; // skip tiny drift
          scheduleReverseGeocode(next);
          return next;
        });
        setPermState("granted");
        setError(null);
      },
      err => {
        setError(friendlyGeoError(err));
        if (err.code === 1) setPermState("denied");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 }
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  // Stop watch on unmount
  useEffect(() => () => stopWatching(), [stopWatching]);

  // ── Reverse geocoding (debounced) ───────────────────────────────────────────
  function scheduleReverseGeocode(loc) {
    // Skip if we already geocoded this position recently
    if (
      lastGeocodedRef.current &&
      distanceMetres(lastGeocodedRef.current, loc) < MOVEMENT_THRESHOLD_M
    ) return;

    clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        const addr = await reverseGeocode(loc.lat, loc.lng);
        setAddress(addr);
        lastGeocodedRef.current = loc;
      } catch {
        // Reverse geocode failure is non-fatal — address stays as-is
      }
    }, REVERSE_GEOCODE_DEBOUNCE_MS);
  }

  // Cleanup geocode timer
  useEffect(() => () => clearTimeout(geocodeTimerRef.current), []);

  // ── Manual override ─────────────────────────────────────────────────────────
  /**
   * setManualLocation — Lets the user pin a custom location on the map.
   * Triggers a reverse geocode for the new point.
   *
   * @param {{ lat: number, lng: number }} loc
   */
  const setManualLocation = useCallback(loc => {
    const next = { ...loc, accuracy: null, isFallback: false, timestamp: Date.now() };
    setLocation(next);
    scheduleReverseGeocode(next);
  }, []);

  // ── Context value ───────────────────────────────────────────────────────────
  const value = {
    /** Current position object or null while loading */
    location,

    /** Human-readable address for current position */
    address,

    /** "granted" | "denied" | "prompt" | "unsupported" */
    permissionState,

    /** True while a one-shot getCurrentPosition() is in progress */
    isLocating,

    /** True while watchPosition() is active */
    isWatching,

    /** Geolocation error message (string) or null */
    error,

    /** Request a fresh one-shot position fix */
    refreshLocation: fetchOnce,

    /** Start continuous GPS tracking (for SOS / live map) */
    startWatching,

    /** Stop continuous GPS tracking */
    stopWatching,

    /** Override location manually (e.g. user taps map) */
    setManualLocation,

    /** True if location is the Delhi fallback, not a real fix */
    isUsingFallback: location?.isFallback ?? true,

    /** Formatted coordinate string for display */
    coordString: location
      ? `${location.lat.toFixed(5)}°N, ${location.lng.toFixed(5)}°E`
      : null,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * useLocation — Consumes LocationContext.
 * Must be used inside <LocationProvider>.
 *
 * @returns {LocationContextValue}
 * @throws if used outside LocationProvider
 */
export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used inside <LocationProvider>.");
  }
  return ctx;
}

// ── Geolocation error helper ──────────────────────────────────────────────────
function friendlyGeoError(err) {
  switch (err.code) {
    case 1: return "Location access denied. Please enable GPS in your browser settings.";
    case 2: return "Position unavailable. Check your GPS signal.";
    case 3: return "Location request timed out. Please try again.";
    default: return "An unknown location error occurred.";
  }
}

export default LocationContext;
