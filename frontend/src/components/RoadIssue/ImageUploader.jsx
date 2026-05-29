import { useCallback, useMemo, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

const defaultStyles = {
  root: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(8, 12, 20, 0.92)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    color: "#f8fafc",
    fontFamily: "'DM Sans', sans-serif",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(248, 250, 252, 0.68)",
    lineHeight: 1.5,
  },
  dropZone: {
    borderRadius: 14,
    border: "1.5px dashed rgba(248, 250, 252, 0.16)",
    background: "linear-gradient(135deg, rgba(220,38,38,0.08), rgba(59,130,246,0.06))",
    minHeight: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 180ms ease",
    overflow: "hidden",
    position: "relative",
  },
  preview: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    display: "block",
  },
  center: {
    textAlign: "center",
    padding: 24,
  },
  hint: {
    fontSize: 12,
    color: "rgba(248, 250, 252, 0.72)",
    marginTop: 8,
  },
  fileMeta: {
    fontSize: 12,
    color: "rgba(248, 250, 252, 0.9)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 999,
    padding: "6px 10px",
    alignSelf: "flex-start",
  },
  error: {
    color: "#fca5a5",
    fontSize: 12,
  },
};

export default function ImageUploader({
  onImageSelected,
  onPreview,
  title = "Upload image",
  subtitle = "Drag and drop a road image or click to browse.",
  accept = "image/*",
  disabled = false,
  initialPreview = null,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(initialPreview);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState("");

  const isValidFile = useCallback((file) => {
    if (!file) {
      return false;
    }

    if (!file.type.startsWith("image/")) {
      setError(t("uploader.invalidImage"));
      return false;
    }

    setError("");
    return true;
  }, [t]);

  const handleFile = useCallback((file) => {
    if (!file || disabled) {
      return;
    }

    if (!isValidFile(file)) {
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setPreview(result);
      onPreview?.(result);
      onImageSelected?.(file, result);
    };

    reader.readAsDataURL(file);
  }, [disabled, isValidFile, onImageSelected, onPreview]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (disabled) {
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    handleFile(file);
  }, [disabled, handleFile]);

  const statusText = useMemo(() => {
    if (error) {
      return error;
    }

    if (fileName) {
      return t("uploader.selected", { fileName });
    }

    return t("uploader.supportedFormats");
  }, [error, fileName, t]);

  return (
    <div style={defaultStyles.root}>
      <div>
        <div style={defaultStyles.title}>{title}</div>
        <div style={defaultStyles.subtitle}>{subtitle}</div>
      </div>

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!disabled) {
            setDragActive(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        style={{
          ...defaultStyles.dropZone,
          borderColor: dragActive ? "rgba(248, 250, 252, 0.36)" : "rgba(248, 250, 252, 0.16)",
          background: dragActive
            ? "linear-gradient(135deg, rgba(220,38,38,0.12), rgba(59,130,246,0.08))"
            : defaultStyles.dropZone.background,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {preview ? (
          <img src={preview} alt={t("uploader.previewAlt")} style={defaultStyles.preview} />
        ) : (
          <div style={defaultStyles.center}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>IMG</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{t("uploader.dropHere")}</div>
            <div style={defaultStyles.hint}>{t("uploader.chooseHint")}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={fileName ? defaultStyles.fileMeta : defaultStyles.hint}>{statusText}</div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "10px 14px",
            background: "#dc2626",
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {t("uploader.chooseImage")}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {error ? <div style={defaultStyles.error}>{error}</div> : null}
    </div>
  );
}

