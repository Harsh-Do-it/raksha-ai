import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import HospitalMarker from "./HospitalMarker";
import AccidentPin from "./AccidentPin";

/**
 * MapView — Google Maps wrapper for Raksha AI
 *
 * Props:
 *   apiKey          {string}   Google Maps JS API key
 *   center          {lat, lng} Initial map center   (default: New Delhi)
 *   zoom            {number}   Initial zoom level   (default: 13)
 *   hospitals       {Array}    Hospital data objects (see HospitalMarker)
 *   accidents       {Array}    Accident/hotspot data (see AccidentPin)
 *   userLocation    {lat, lng} Live user pin (optional)
 *   onMarkerClick   {fn}       Called with (type, item) when any marker is tapped
 *   showHeatmap     {boolean}  Overlay accident density heatmap
 *   className       {string}   Extra CSS classes for the outer wrapper
 *
 * Usage:
 *   <MapView
 *     apiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}
 *     hospitals={hospitalsArray}
 *     accidents={accidentsArray}
 *     userLocation={{ lat: 28.6139, lng: 77.2090 }}
 *     showHeatmap
 *   />
 */

// ── Dark tactical map style ─────────────────────────────────────────────────
const DARK_MAP_STYLE = [
  { elementType: "geometry",                    stylers: [{ color: "#0d0d14" }] },
  { elementType: "labels.text.stroke",          stylers: [{ color: "#0d0d14" }] },
  { elementType: "labels.text.fill",            stylers: [{ color: "#4a5568" }] },
  { featureType: "road",        elementType: "geometry",           stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road",        elementType: "geometry.stroke",    stylers: [{ color: "#212a37" }] },
  { featureType: "road",        elementType: "labels.text.fill",   stylers: [{ color: "#3d4a5c" }] },
  { featureType: "road.highway",elementType: "geometry",           stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway",elementType: "geometry.stroke",    stylers: [{ color: "#0f172a" }] },
  { featureType: "road.highway",elementType: "labels.text.fill",   stylers: [{ color: "#4b6584" }] },
  { featureType: "water",       elementType: "geometry",           stylers: [{ color: "#06111f" }] },
  { featureType: "water",       elementType: "labels.text.fill",   stylers: [{ color: "#1e3a5f" }] },
  { featureType: "poi",         elementType: "geometry",           stylers: [{ color: "#111827" }] },
  { featureType: "poi",         elementType: "labels.text.fill",   stylers: [{ color: "#374151" }] },
  { featureType: "poi.park",    elementType: "geometry",           stylers: [{ color: "#0a1f0f" }] },
  { featureType: "poi.park",    elementType: "labels.text.fill",   stylers: [{ color: "#1a4731" }] },
  { featureType: "transit",     elementType: "geometry",           stylers: [{ color: "#111827" }] },
  { featureType: "transit.station",elementType: "labels.text.fill",stylers: [{ color: "#4b5563" }] },
  { featureType: "administrative",elementType: "geometry.stroke",  stylers: [{ color: "#1f2937" }] },
  { featureType: "administrative",elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
  { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
];

// ── Loader — injects Google Maps script once ────────────────────────────────
let mapsLoadPromise = null;
function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;
  mapsLoadPromise = new Promise((resolve, reject) => {
    const cb = `__rakshaMapInit_${Date.now()}`;
    window[cb] = () => { delete window[cb]; resolve(); };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&callback=${cb}`;
    s.async = true;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return mapsLoadPromise;
}

// ── User location pulsing SVG marker ───────────────────────────────────────
const USER_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="16" fill="#1d4ed8" fill-opacity="0.18"/>
  <circle cx="18" cy="18" r="9"  fill="#3b82f6"/>
  <circle cx="18" cy="18" r="5"  fill="#fff"/>
  <circle cx="18" cy="18" r="16" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-opacity="0.5"/>
</svg>`;

// ── Map layer toggle button ─────────────────────────────────────────────────
function LayerToggle({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 13px",
        borderRadius: 8,
        border: `1px solid ${active ? color + "55" : "rgba(255,255,255,0.08)"}`,
        background: active ? color + "18" : "rgba(13,13,20,0.85)",
        color: active ? color : "rgba(255,255,255,0.45)",
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
        cursor: "pointer",
        backdropFilter: "blur(8px)",
        transition: "all 0.18s",
        letterSpacing: "0.3px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: active ? color : "rgba(255,255,255,0.2)",
        flexShrink: 0,
        boxShadow: active ? `0 0 6px ${color}` : "none",
        transition: "all 0.18s",
      }} />
      {label}
    </button>
  );
}

// ── Status bar ──────────────────────────────────────────────────────────────
function StatusBar({ hospitals, accidents, userLocation, t }) {
  return (
    <div style={{
      position: "absolute",
      bottom: 16, left: 16,
      display: "flex",
      gap: 8,
      fontFamily: "'DM Sans', sans-serif",
      zIndex: 10,
      flexWrap: "wrap",
    }}>
      {[
        { color: "#22c55e", count: hospitals.length, labelKey: "hospitals" },
        { color: "#ef4444", count: accidents.length, labelKey: "incidents" },
        { color: "#3b82f6", count: userLocation ? 1 : 0, labelKey: "you" },
      ].map(({ color, count, labelKey }) => (
        <div key={labelKey} style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 11px",
          borderRadius: 7,
          background: "rgba(13,13,20,0.82)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(8px)",
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: count > 0 ? color : "rgba(255,255,255,0.15)",
            boxShadow: count > 0 ? `0 0 5px ${color}` : "none",
          }} />
          <span style={{ fontWeight: 600, color: count > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)" }}>
            {count}
          </span>
          <span>{t(`mapUi.${labelKey}`)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main MapView ─────────────────────────────────────────────────────────────
export default function MapView({
  apiKey = process.env.REACT_APP_GOOGLE_MAPS_KEY || "",
  center = { lat: 28.6139, lng: 77.2090 },
  zoom = 13,
  hospitals = [],
  accidents = [],
  userLocation = null,
  onMarkerClick,
  showHeatmap: initialHeatmap = false,
  className = "",
}) {
  const { t } = useTranslation();
  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const heatmapLayer  = useRef(null);
  const userMarker    = useRef(null);
  const overlaysRef   = useRef([]);

  const [mapsReady,      setMapsReady]      = useState(false);
  const [loadError,      setLoadError]      = useState(null);
  const [selectedItem,   setSelectedItem]   = useState(null);
  const [showHospitals,  setShowHospitals]  = useState(true);
  const [showAccidents,  setShowAccidents]  = useState(true);
  const [showHeatmap,    setShowHeatmap]    = useState(initialHeatmap);
  const [mapType,        setMapType]        = useState("roadmap");

  // ── Load Maps API ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiKey) { setLoadError(t("mapUi.noApiKey")); return; }
    loadGoogleMaps(apiKey)
      .then(() => setMapsReady(true))
      .catch(() => setLoadError(t("mapUi.loadFailed")));
  }, [apiKey, t]);

  // ── Initialise map instance ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: DARK_MAP_STYLE,
      mapTypeId: mapType,
      disableDefaultUI: true,
      zoomControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      clickableIcons: false,
    });
    mapInstance.current = map;
    return () => { mapInstance.current = null; };
  }, [mapsReady]);

  // ── Map type toggle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setMapTypeId(mapType);
    mapInstance.current.setOptions({
      styles: mapType === "roadmap" ? DARK_MAP_STYLE : [],
    });
  }, [mapType]);

  // ── User location marker ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;
    if (userMarker.current) userMarker.current.setMap(null);
    userMarker.current = new window.google.maps.Marker({
      position: userLocation,
      map: mapInstance.current,
      icon: {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(USER_PIN_SVG),
        scaledSize: new window.google.maps.Size(36, 36),
        anchor: new window.google.maps.Point(18, 18),
      },
      title: t("mapUi.yourLocation"),
      zIndex: 1000,
    });
    return () => { if (userMarker.current) userMarker.current.setMap(null); };
  }, [mapsReady, userLocation]);

  // ── Heatmap layer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !window.google?.maps?.visualization) return;
    if (heatmapLayer.current) { heatmapLayer.current.setMap(null); heatmapLayer.current = null; }
    if (!showHeatmap || accidents.length === 0) return;
    const data = accidents.map(a =>
      new window.google.maps.LatLng(a.lat, a.lng)
    );
    heatmapLayer.current = new window.google.maps.visualization.HeatmapLayer({
      data,
      map: mapInstance.current,
      radius: 35,
      opacity: 0.65,
      gradient: [
        "rgba(0,0,0,0)",
        "rgba(180,0,0,0.4)",
        "rgba(220,38,38,0.7)",
        "rgba(239,68,68,0.85)",
        "rgba(252,165,165,1)",
      ],
    });
  }, [mapsReady, showHeatmap, accidents]);

  // ── Pan to user on location change ──────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;
    mapInstance.current.panTo(userLocation);
  }, [userLocation]);

  // ── Zoom controls ────────────────────────────────────────────────────────
  const zoomIn  = useCallback(() => mapInstance.current?.setZoom((mapInstance.current.getZoom() || zoom) + 1), []);
  const zoomOut = useCallback(() => mapInstance.current?.setZoom((mapInstance.current.getZoom() || zoom) - 1), []);
  const recenter = useCallback(() => {
    if (!mapInstance.current) return;
    const target = userLocation || center;
    mapInstance.current.panTo(target);
    mapInstance.current.setZoom(14);
  }, [userLocation, center]);

  // ── Marker click handler ─────────────────────────────────────────────────
  function handleMarkerClick(type, item) {
    setSelectedItem({ type, item });
    onMarkerClick?.(type, item);
    mapInstance.current?.panTo({ lat: item.lat, lng: item.lng });
  }

  // ── Overlay cleanup util (used by child markers via ref) ─────────────────
  function registerOverlay(overlay) {
    overlaysRef.current.push(overlay);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Bebas+Neue&display=swap');

        .mapview-root {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 480px;
          border-radius: 16px;
          overflow: hidden;
          background: #0d0d14;
          font-family: 'DM Sans', sans-serif;
        }

        .mapview-canvas {
          width: 100%;
          height: 100%;
        }

        /* Error / loading states */
        .mapview-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #0d0d14;
          color: rgba(255,255,255,0.4);
          font-size: 14px;
          letter-spacing: 0.3px;
        }

        .mapview-spinner {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2.5px solid rgba(220,38,38,0.15);
          border-top-color: #dc2626;
          animation: mapSpin 0.9s linear infinite;
        }

        @keyframes mapSpin { to { transform: rotate(360deg); } }

        /* Layer controls */
        .mapview-controls {
          position: absolute;
          top: 14px;
          left: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 10;
        }

        .mapview-layers {
          position: absolute;
          top: 14px;
          right: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 10;
        }

        /* Zoom controls */
        .mapview-zoom {
          position: absolute;
          right: 14px;
          bottom: 52px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          z-index: 10;
          border-radius: 9px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .mapview-zoom-btn {
          width: 36px; height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(13,13,20,0.88);
          border: none;
          color: rgba(255,255,255,0.6);
          font-size: 18px;
          cursor: pointer;
          transition: all 0.15s;
          backdrop-filter: blur(8px);
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          line-height: 1;
        }
        .mapview-zoom-btn:hover {
          background: rgba(30,30,50,0.95);
          color: rgba(255,255,255,0.9);
        }
        .mapview-zoom-btn:active { transform: scale(0.93); }

        /* Recenter button */
        .mapview-recenter {
          position: absolute;
          right: 14px;
          bottom: 130px;
          z-index: 10;
          width: 36px; height: 36px;
          border-radius: 9px;
          border: 1px solid rgba(59,130,246,0.25);
          background: rgba(13,13,20,0.88);
          backdrop-filter: blur(8px);
          color: #3b82f6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .mapview-recenter:hover {
          background: rgba(59,130,246,0.12);
          border-color: rgba(59,130,246,0.4);
        }

        /* Info panel for selected marker */
        .mapview-info {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          animation: infoSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1);
          pointer-events: none;
        }

        @keyframes infoSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
        }

        /* Scanline overlay for atmosphere */
        .mapview-scanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0,0,0,0.03) 3px,
            rgba(0,0,0,0.03) 4px
          );
          pointer-events: none;
          z-index: 1;
        }

        /* Corner brackets */
        .mapview-corner {
          position: absolute;
          width: 18px; height: 18px;
          pointer-events: none;
          z-index: 2;
        }
        .mapview-corner.tl { top: 10px; left: 10px;
          border-top: 1.5px solid rgba(220,38,38,0.4);
          border-left: 1.5px solid rgba(220,38,38,0.4); }
        .mapview-corner.tr { top: 10px; right: 10px;
          border-top: 1.5px solid rgba(220,38,38,0.4);
          border-right: 1.5px solid rgba(220,38,38,0.4); }
        .mapview-corner.bl { bottom: 10px; left: 10px;
          border-bottom: 1.5px solid rgba(220,38,38,0.4);
          border-left: 1.5px solid rgba(220,38,38,0.4); }
        .mapview-corner.br { bottom: 10px; right: 10px;
          border-bottom: 1.5px solid rgba(220,38,38,0.4);
          border-right: 1.5px solid rgba(220,38,38,0.4); }
      `}</style>

      <div className={`mapview-root ${className}`}>

        {/* Scanline atmospheric overlay */}
        <div className="mapview-scanlines" />

        {/* Corner brackets */}
        <div className="mapview-corner tl" />
        <div className="mapview-corner tr" />
        <div className="mapview-corner bl" />
        <div className="mapview-corner br" />

        {/* Map canvas */}
        <div ref={mapRef} className="mapview-canvas" />

        {/* Loading / error states */}
        {!mapsReady && !loadError && (
          <div className="mapview-placeholder">
            <div className="mapview-spinner" />
            <span>{t("mapUi.initialising")}</span>
          </div>
        )}
        {loadError && (
          <div className="mapview-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span style={{ color: "rgba(239,68,68,0.7)" }}>{loadError}</span>
          </div>
        )}

        {/* Zoom controls */}
        {mapsReady && (
          <>
            <div className="mapview-zoom">
              <button className="mapview-zoom-btn" onClick={zoomIn}  aria-label={t("mapUi.zoomIn")}>+</button>
              <button className="mapview-zoom-btn" onClick={zoomOut} aria-label={t("mapUi.zoomOut")}>−</button>
            </div>

            {/* Recenter */}
            <button className="mapview-recenter" onClick={recenter} aria-label={t("mapUi.recenter")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
              </svg>
            </button>

            {/* Layer toggles — right panel */}
            <div className="mapview-layers">
              <LayerToggle label={t("mapUi.hospitals")}  active={showHospitals} color="#22c55e" onClick={() => setShowHospitals(v => !v)} />
              <LayerToggle label={t("mapUi.incidents")}  active={showAccidents} color="#ef4444" onClick={() => setShowAccidents(v => !v)} />
              <LayerToggle label={t("mapUi.heatmap")}    active={showHeatmap}   color="#f97316" onClick={() => setShowHeatmap(v => !v)} />
              <LayerToggle
                label={mapType === "roadmap" ? t("mapUi.satellite") : t("mapUi.map")}
                active={false}
                color="rgba(255,255,255,0.4)"
                onClick={() => setMapType(t => t === "roadmap" ? "satellite" : "roadmap")}
              />
            </div>

            {/* Status bar */}
            <StatusBar hospitals={hospitals} accidents={accidents} userLocation={userLocation} t={t} />

            {/* Markers — rendered as custom OverlayViews via child components */}
            {mapInstance.current && showHospitals && hospitals.map((h, i) => (
              <HospitalMarker
                key={h.id ?? i}
                map={mapInstance.current}
                hospital={h}
                onClick={() => handleMarkerClick("hospital", h)}
              />
            ))}

            {mapInstance.current && showAccidents && accidents.map((a, i) => (
              <AccidentPin
                key={a.id ?? i}
                map={mapInstance.current}
                accident={a}
                onClick={() => handleMarkerClick("accident", a)}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}
