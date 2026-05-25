import sys
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Optional
from uuid import uuid4

sys.path.append(str(Path(__file__).resolve().parents[1]))

from models.RoadModel import RakshaRoadModel


class RakshaAIBridge:
    """Bridge between uploaded road images and the reusable RoadModel."""

    def __init__(self, upload_dir: Optional[Path] = None, model: Optional[RakshaRoadModel] = None) -> None:
        self.model = model or RakshaRoadModel(upload_dir=upload_dir)
        self.upload_dir = self.model.upload_dir
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = Lock()

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    @staticmethod
    def _job_id() -> str:
        return f"ai-{uuid4().hex[:12]}"

    @staticmethod
    def _coerce_confidence(value: Any) -> float:
        if isinstance(value, str):
            cleaned = value.strip().replace("%", "")
            try:
                return round(max(0.0, min(float(cleaned) / 100.0, 1.0)), 2)
            except ValueError:
                return 0.0

        try:
            return round(max(0.0, min(float(value), 1.0)), 2)
        except (TypeError, ValueError):
            return 0.0

    def _normalize_detection(self, detection: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "label": detection.get("label") or "Road issue detected",
            "confidence": self._coerce_confidence(detection.get("confidence", 0.0)),
            "severity": detection.get("severity") or "medium",
            "description": detection.get("description") or "Road image analyzed by Raksha AI.",
            "bbox": detection.get("bbox"),
            "image_size": detection.get("image_size"),
        }

    def _store_job(self, job: Dict[str, Any]) -> None:
        with self._lock:
            self._jobs[job["job_id"]] = job

    def _get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._jobs.get(job_id)

    def create_detection_job(self, file_storage: Any, filename: Optional[str] = None) -> Dict[str, Any]:
        """Validate, save, and process a road image through the RoadModel."""
        validation = self.model.validate_file(filename or getattr(file_storage, "filename", ""))
        if not validation["valid"]:
            return {
                "success": False,
                "error": validation.get("error", "Invalid file"),
                "status": "failed",
            }

        save_result = self.model.save_upload(file_storage, filename)
        if not save_result.get("saved"):
            return {
                "success": False,
                "error": save_result.get("error", "Unable to save upload"),
                "status": "failed",
            }

        job_id = self._job_id()
        job = {
            "job_id": job_id,
            "filename": save_result["filename"],
            "path": save_result["path"],
            "status": "processing",
            "created_at": self._now_iso(),
            "updated_at": self._now_iso(),
            "result": None,
            "error": None,
        }
        self._store_job(job)

        try:
            detection = self.model.detect_pothole(save_result["path"])
            result = self._normalize_detection(detection)
            job["status"] = "complete"
            job["result"] = result
            job["updated_at"] = self._now_iso()
            self._store_job(job)
        except Exception as exc:
            job["status"] = "failed"
            job["error"] = str(exc)
            job["updated_at"] = self._now_iso()
            self._store_job(job)

        return {
            "job_id": job_id,
            "status": job["status"],
            **({"result": job["result"]} if job["result"] else {}),
            **({"error": job["error"]} if job["error"] else {}),
        }

    def poll_detection_job(self, job_id: str) -> Dict[str, Any]:
        """Return the current state of a previously created detection job."""
        job = self._get_job(job_id)
        if not job:
            return {
                "success": False,
                "error": "Job not found",
                "status": "failed",
            }

        if job["status"] == "failed":
            return {
                "job_id": job_id,
                "status": "failed",
                "error": job["error"],
            }

        if job["status"] == "complete":
            return {
                "job_id": job_id,
                "status": "complete",
                "result": job["result"],
            }

        return {
            "job_id": job_id,
            "status": "processing",
            "result": None,
        }

    def detect_file(self, file_storage: Any, filename: Optional[str] = None) -> Dict[str, Any]:
        """Compatibility helper that returns the normalized detection payload directly."""
        created = self.create_detection_job(file_storage, filename)
        if not created.get("success", True) and created.get("status") == "failed":
            return created

        if created.get("status") == "complete":
            return {
                "success": True,
                "filename": created.get("filename") if "filename" in created else None,
                **created["result"],
            }

        return created

    def build_detection_payload(self, job_id: str) -> Dict[str, Any]:
        """Build a router-friendly payload for a completed detection job."""
        job = self._get_job(job_id)
        if not job or job["status"] != "complete":
            return {
                "success": False,
                "error": "Detection job is not complete yet",
                "status": job["status"] if job else "failed",
            }

        return {
            "success": True,
            "job_id": job_id,
            "filename": job["filename"],
            "result": job["result"],
        }


__all__ = ["RakshaAIBridge"]
