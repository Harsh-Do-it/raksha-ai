import { useMemo } from "react";

import { useTranslation } from "react-i18next";

const severityStyles = {
  critical: { badge: "rgba(248,113,113,0.15)", text: "#fca5a5", ring: "#ef4444" },
  high: { badge: "rgba(251,191,36,0.16)", text: "#fcd34d", ring: "#f59e0b" },
  medium: { badge: "rgba(96,165,250,0.18)", text: "#93c5fd", ring: "#3b82f6" },
  low: { badge: "rgba(74,222,128,0.16)", text: "#86efac", ring: "#22c55e" },
};

function toPercent(value) {
  if (typeof value !== "number") {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

export default function DetectionResult({
  detection,
  imagePreview = null,
  loading = false,
  error = null,
}) {
  const { t } = useTranslation();
  const confidence = useMemo(() => {
    if (!detection) {
      return 0;
    }

    return typeof detection.confidence === "number"
      ? toPercent(detection.confidence)
      : toPercent(detection.confidenceScore ?? 0);
  }, [detection]);

  const severityKey = detection?.severity?.toLowerCase?.() || "medium";
  const severity = severityStyles[severityKey] || severityStyles.medium;

  if (loading) {
    return (
      <div style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(8, 12, 20, 0.92)",
        padding: 20,
        color: "#f8fafc",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t("detector.analyzingTitle")}</div>
        <div style={{ fontSize: 12, color: "rgba(248, 250, 252, 0.7)", marginBottom: 16 }}>
          {t("detector.analyzingDescription")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "2px solid rgba(248, 250, 252, 0.2)",
              borderTopColor: "#fca5a5",
              animation: "spin 0.9s linear infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "rgba(248, 250, 252, 0.74)" }}>{t("detector.running")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        borderRadius: 16,
        border: "1px solid rgba(248, 113, 113, 0.26)",
        background: "rgba(127, 29, 29, 0.18)",
        padding: 20,
        color: "#fecaca",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t("detector.failedTitle")}</div>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>{error}</div>
      </div>
    );
  }

  if (!detection) {
    return (
      <div style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(8, 12, 20, 0.92)",
        padding: 20,
        color: "rgba(248, 250, 252, 0.74)",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t("detector.emptyTitle")}</div>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          {t("detector.emptyDescription")}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(8, 12, 20, 0.92)",
      padding: 20,
      color: "#f8fafc",
      fontFamily: "'DM Sans', sans-serif",
      display: "grid",
      gap: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "rgba(248, 250, 252, 0.58)", textTransform: "uppercase", letterSpacing: 1.2 }}>
            {t("detector.resultTitle")}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>{detection.label || t("detector.fallbackLabel")}</div>
        </div>
        <div
          style={{
            background: severity.badge,
            color: severity.text,
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        >
          {t("detector.severityLabel", { severity: t(`dashboardLive.severity.${severityKey}`, severityKey) })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 220px", gap: 16, alignItems: "center" }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(248, 250, 252, 0.86)" }}>
            {detection.description || t("detector.fallbackDescription")}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(248, 250, 252, 0.76)" }}>
              <span>{t("detector.confidence")}</span>
              <span>{confidence}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${confidence}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${severity.ring}, #f8fafc)`,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${severity.ring}55`,
            padding: 16,
            background: "rgba(255,255,255,0.02)",
            display: "grid",
            gap: 10,
            justifyItems: "center",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: `10px solid ${severity.ring}`,
              display: "grid",
              placeItems: "center",
              color: severity.text,
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {confidence}%
          </div>
          <div style={{ fontSize: 12, color: "rgba(248, 250, 252, 0.74)", textAlign: "center" }}>
            {detection.subtype || detection.type || t("detector.fallbackType")}
          </div>
        </div>
      </div>

      {imagePreview ? (
        <div>
          <div style={{ fontSize: 12, color: "rgba(248, 250, 252, 0.58)", marginBottom: 8 }}>{t("detector.uploadedPreview")}</div>
          <img
            src={imagePreview}
            alt={t("detector.uploadedAlt")}
            style={{
              width: "100%",
              maxHeight: 240,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        </div>
      ) : null}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

