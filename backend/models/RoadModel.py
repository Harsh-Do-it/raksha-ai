from pathlib import Path
from typing import Any, Dict, Iterable, Optional

import numpy as np
import random
from PIL import Image


class RakshaRoadModel:
    """
    Backend model for road issue detection and validation.

    This class keeps the image-processing logic out of the router so the
    backend can expose a clean API layer while preserving the current
    lightweight mock-AI behavior.
    """

    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "heic"}
    DEFAULT_UPLOAD_DIR = Path("uploads")

    DETECTION_OPTIONS = [
        {
            "label": "Pothole",
            "severity": "critical",
            "description": "Deep pothole detected with high confidence. Immediate repair recommended.",
        },
        {
            "label": "Damaged Road",
            "severity": "high",
            "description": "Road surface cracking and subsidence detected. Maintenance is recommended.",
        },
        {
            "label": "Waterlogging",
            "severity": "high",
            "description": "Standing water detected on the road surface. Usage may be unsafe.",
        },
        {
            "label": "Surface Wear",
            "severity": "medium",
            "description": "General road surface wear detected. Monitoring and scheduled repair are advised.",
        },
        {
            "label": "Road Clear",
            "severity": "low",
            "description": "No significant road damage detected in the uploaded image.",
        },
    ]

    def __init__(self, upload_dir: Optional[Path] = None) -> None:
        self.upload_dir = Path(upload_dir) if upload_dir else self.DEFAULT_UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _extension(filename: str) -> str:
        return Path(filename).suffix.lower().lstrip(".")

    def is_allowed_file(self, filename: str) -> bool:
        """Return True when the uploaded file uses an allowed extension."""
        return self._extension(filename) in self.ALLOWED_EXTENSIONS

    def validate_file(self, filename: str, content_type: Optional[str] = None, file_size: Optional[int] = None) -> Dict[str, Any]:
        """Validate an uploaded file and return a structured result."""
        if not filename:
            return {"valid": False, "error": "No selected file"}

        if not self.is_allowed_file(filename):
            return {"valid": False, "error": "Invalid file type"}

        if content_type and content_type not in {"image/png", "image/jpeg", "image/webp", "image/heic"}:
            return {"valid": False, "error": "Unsupported content type"}

        if file_size is not None and file_size <= 0:
            return {"valid": False, "error": "Empty file"}

        return {"valid": True}

    def save_upload(self, file_storage: Any, filename: Optional[str] = None) -> Dict[str, Any]:
        """Save an uploaded file and return the stored path metadata."""
        if file_storage is None:
            return {"saved": False, "error": "No file provided"}

        original_name = filename or getattr(file_storage, "filename", "")
        validation = self.validate_file(original_name)
        if not validation["valid"]:
            return {"saved": False, **validation}

        destination = self.upload_dir / Path(original_name).name
        file_storage.save(destination)

        return {
            "saved": True,
            "filename": Path(original_name).name,
            "path": str(destination),
        }

    def load_image(self, image_path: str) -> Image.Image:
        """Load a saved image and resize it for lightweight inference stages."""
        image = Image.open(image_path)
        image = image.convert("RGB")
        image = image.resize((224, 224))
        return image

    def _compute_confidence(self, image: Image.Image, selected_label: str) -> float:
        """Create a deterministic confidence score based on image statistics and label selection."""
        image_array = np.array(image)
        brightness = float(np.mean(image_array))
        contrast = float(np.std(image_array))

        base = 0.72
        if selected_label == "Road Clear":
            base = 0.78
        elif selected_label == "Pothole":
            base = 0.9
        elif selected_label in {"Damaged Road", "Waterlogging"}:
            base = 0.86
        elif selected_label == "Surface Wear":
            base = 0.8

        confidence = base + (contrast / 5000) + (brightness / 5000)
        confidence = max(0.45, min(confidence, 0.99))
        return round(confidence, 2)

    def detect_pothole(self, image_path: str) -> Dict[str, Any]:
        """Run a mock detection pass and return a structured result."""
        image = self.load_image(image_path)
        selected = random.choice(self.DETECTION_OPTIONS)
        confidence = self._compute_confidence(image, selected["label"])

        return {
            "label": selected["label"],
            "confidence": confidence,
            "severity": selected["severity"],
            "description": selected["description"],
            "bbox": None,
            "image_size": {
                "width": image.size[0],
                "height": image.size[1],
            },
        }

    def build_detection_response(self, filename: str, detection: Dict[str, Any]) -> Dict[str, Any]:
        """Create a backend response payload that the router can return directly."""
        return {
            "success": True,
            "filename": filename,
            "prediction": {
                "label": detection["label"],
                "confidence": f"{detection['confidence'] * 100:.2f}%",
                "severity": detection["severity"],
                "description": detection["description"],
                "bbox": detection.get("bbox"),
            },
        }


__all__ = ["RakshaRoadModel"]
