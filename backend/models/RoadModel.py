from pathlib import Path
from typing import Any, Dict, Iterable, Optional

import numpy as np
import random
import json
from PIL import Image

try:
    from google import genai
    from google.genai import types
    has_genai = True
except ImportError:
    has_genai = False

from config import Config


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
        {
            "label": "Broken Divider",
            "severity": "high",
            "description": "Broken or damaged road divider detected. Potential hazard for traffic.",
        },
        {
            "label": "Missing Sign",
            "severity": "medium",
            "description": "Traffic sign appears to be missing or unreadable.",
        },
        {
            "label": "Other",
            "severity": "medium",
            "description": "Unidentified issue detected on the road.",
        },
    ]

    def __init__(self, upload_dir: Optional[Path] = None) -> None:
        self.upload_dir = Path(upload_dir) if upload_dir else self.DEFAULT_UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.api_key = Config.GEMINI_API_KEY
        self.client = None
        if has_genai and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception:
                pass

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
        elif selected_label in {"Damaged Road", "Waterlogging", "Broken Divider"}:
            base = 0.86
        elif selected_label in {"Surface Wear", "Missing Sign", "Other"}:
            base = 0.8

        confidence = base + (contrast / 5000) + (brightness / 5000)
        confidence = max(0.45, min(confidence, 0.99))
        return round(confidence, 2)

    def detect_pothole(self, image_path: str) -> Dict[str, Any]:
        """Run AI detection using Gemini Vision if configured, otherwise fallback to heuristics."""
        image = self.load_image(image_path)
        
        # Try Gemini Vision First
        if self.client:
            try:
                prompt = """Analyze this image of a road or traffic environment in detail.
Carefully distinguish between the following categories:
- Pothole (distinct, localized holes or craters in the road surface)
- Damaged Road (general surface cracking, subsidence, unpaved roughness, or broad deterioration without distinct deep holes)
- Waterlogging
- Broken Divider
- Missing Sign
- Road Clear
- Other

Select ONE category that best describes the main issue. If there are distinct holes, prioritize 'Pothole'.
Provide a severity (critical, high, medium, low) based on the hazard level.
Provide a detailed description of the issue in a natural, human-like, conversational tone. Describe exactly what you see in the image as if you are reporting it yourself to the authorities, and explain the potential danger to vehicles and the recommended urgency of repair.

Respond strictly in JSON format:
{
  "label": "category name",
  "severity": "critical/high/medium/low",
  "description": "natural, human-like description of the issue"
}"""
                import time
                res_data = None
                raw_image = Image.open(image_path)
                for _ in range(3):
                    try:
                        response = self.client.models.generate_content(
                            model='gemini-2.5-flash',
                            contents=[raw_image, prompt],
                            config=types.GenerateContentConfig(response_mime_type="application/json")
                        )
                        res_data = json.loads(response.text)
                        break
                    except Exception as e:
                        print(f"Gemini API Error during retry: {e}")
                        time.sleep(1.5)
                
                if res_data:
                    return {
                        "label": res_data.get("label", "Other"),
                        "confidence": 0.95,
                        "severity": str(res_data.get("severity", "medium")).lower(),
                        "description": res_data.get("description", "Issue detected by AI."),
                        "bbox": None,
                        "image_size": {
                            "width": image.size[0],
                            "height": image.size[1],
                        },
                    }
                else:
                    print("All 3 retries failed for Gemini API.")
            except Exception as e:
                print(f"Gemini Processing Error: {e}")
                # Fallback on error
                pass
        
        # Fallback heuristic based on filename
        lower_name = Path(image_path).name.lower()
        selected = None
        
        if "divider" in lower_name:
            selected = next(o for o in self.DETECTION_OPTIONS if o["label"] == "Broken Divider")
        elif "sign" in lower_name:
            selected = next(o for o in self.DETECTION_OPTIONS if o["label"] == "Missing Sign")
        elif "water" in lower_name or "flood" in lower_name:
            selected = next(o for o in self.DETECTION_OPTIONS if o["label"] == "Waterlogging")
        elif "pothole" in lower_name:
            selected = next(o for o in self.DETECTION_OPTIONS if o["label"] == "Pothole")
        elif "damage" in lower_name or "crack" in lower_name:
            selected = next(o for o in self.DETECTION_OPTIONS if o["label"] == "Damaged Road")
        elif "clear" in lower_name or "clean" in lower_name:
            selected = next(o for o in self.DETECTION_OPTIONS if o["label"] == "Road Clear")
        else:
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
