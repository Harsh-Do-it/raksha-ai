import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import requests


class RakshaAISOS:
    """
    Backend model for Raksha AI emergency SOS workflows.

    This class is intentionally lightweight so it can be reused by
    existing backend routers and later extended with real SMS / map
    integrations without changing the public interface.
    """

    DEFAULT_FALLBACK_LOCATION = {
        "lat": 28.6139,
        "lng": 77.2090,
        "accuracy": None,
        "isFallback": True,
        "source": "fallback",
    }

    def __init__(
        self,
        user_name: str = "Raksha AI User",
        emergency_contacts: Optional[Iterable[str]] = None,
        location: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.user_name = user_name or "Raksha AI User"
        self.emergency_contacts = [contact for contact in (emergency_contacts or []) if contact]
        self.location = location
        self.last_error: Optional[str] = None
        self.last_detection: Optional[Dict[str, Any]] = None
        self.last_alert: Optional[Dict[str, Any]] = None

        self.log_path = Path("sos_logs.txt")

    @staticmethod
    def _normalize_coordinates(raw_coords: Any) -> Dict[str, Any]:
        """Convert an IP info `loc` string into a structured location payload."""
        if isinstance(raw_coords, str):
            parts = [part.strip() for part in raw_coords.split(",") if part.strip()]
            if len(parts) == 2:
                try:
                    return {
                        "lat": float(parts[0]),
                        "lng": float(parts[1]),
                        "accuracy": None,
                        "isFallback": False,
                        "source": "ipinfo",
                    }
                except ValueError:
                    return {}

        if isinstance(raw_coords, (list, tuple)) and len(raw_coords) == 2:
            try:
                return {
                    "lat": float(raw_coords[0]),
                    "lng": float(raw_coords[1]),
                    "accuracy": None,
                    "isFallback": False,
                    "source": "ipinfo",
                }
            except (TypeError, ValueError):
                return {}

        return {}

    def get_live_location(self, timeout: int = 5) -> Dict[str, Any]:
        """Fetch the current location from IP geolocation and cache it."""
        try:
            response = requests.get("https://ipinfo.io/json", timeout=timeout)
            response.raise_for_status()
            data = response.json()

            coordinates = self._normalize_coordinates(data.get("loc"))
            if not coordinates:
                raise ValueError("IP geolocation response did not contain valid coordinates")

            self.location = {
                **coordinates,
                "city": data.get("city"),
                "region": data.get("region"),
                "country": data.get("country"),
            }
            self.last_error = None
            return self.location

        except Exception as exc:
            self.last_error = str(exc)
            self.location = self.DEFAULT_FALLBACK_LOCATION.copy()
            return self.location

    def detect_accident(self, threshold: int = 7) -> Dict[str, Any]:
        """Simulate accident detection using a simple probability check."""
        probability = random.randint(1, 10)
        detected = probability > threshold

        self.last_detection = {
            "detected": detected,
            "probability": probability,
            "threshold": threshold,
        }

        return self.last_detection

    def build_alert_message(self, note: str = "", extra_details: Optional[Dict[str, Any]] = None) -> str:
        """Generate a human-readable SOS alert message."""
        location = self.location or self.get_live_location()
        timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        details = extra_details or {}

        return (
            "===============================\n"
            "        RAKSHA AI SOS ALERT\n"
            "===============================\n\n"
            f"User: {self.user_name}\n"
            f"Time: {timestamp}\n"
            f"Status: Possible road accident detected\n\n"
            "Location Details:\n"
            f"City: {location.get('city') or 'Unknown'}\n"
            f"Region: {location.get('region') or 'Unknown'}\n"
            f"Country: {location.get('country') or 'Unknown'}\n"
            f"Coordinates: {location.get('lat')}, {location.get('lng')}\n"
            f"Accuracy: {location.get('accuracy') or 'N/A'}\n"
            f"Source: {location.get('source') or 'fallback'}\n\n"
            f"Emergency contacts: {len(self.emergency_contacts)}\n"
            f"Note: {note or 'No additional note provided'}\n"
            + (
                "\nAdditional Details:\n"
                + "\n".join(f"- {key}: {value}" for key, value in details.items())
                if details
                else ""
            )
            + "\n\nImmediate assistance may be required.\n"
        )

    def prepare_alert_payload(
        self,
        location: Optional[Dict[str, Any]] = None,
        emergency_contacts: Optional[Iterable[str]] = None,
        user_id: Optional[str] = None,
        note: str = "",
        device_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a backend-ready SOS payload with normalized fields."""
        resolved_location = location or self.location or self.get_live_location()
        contacts = [contact for contact in (emergency_contacts or self.emergency_contacts) if contact]

        payload = {
            "alert_id": f"SOS-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
            "user_name": self.user_name,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "status": "dispatched",
            "location": resolved_location,
            "emergency_contacts": contacts,
            "contacts_notified": len(contacts),
            "note": note,
            "device_info": device_info or {},
        }

        self.last_alert = payload
        return payload

    def save_log(self, message: str) -> Dict[str, Any]:
        """Persist the incident text into a local log file."""
        try:
            self.log_path.parent.mkdir(parents=True, exist_ok=True)
            with self.log_path.open("a", encoding="utf-8") as file:
                file.write(message)
                file.write("\n\n")

            return {
                "saved": True,
                "path": str(self.log_path),
                "message": "Incident log saved successfully.",
            }

        except Exception as exc:
            return {
                "saved": False,
                "path": str(self.log_path),
                "message": f"Could not save incident log: {exc}",
            }

    def activate_sos(
        self,
        location: Optional[Dict[str, Any]] = None,
        emergency_contacts: Optional[Iterable[str]] = None,
        user_id: Optional[str] = None,
        note: str = "",
        device_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Run the complete SOS workflow and return a structured response."""
        self.location = location or self.location or self.get_live_location()

        if emergency_contacts is not None:
            self.emergency_contacts = [contact for contact in emergency_contacts if contact]

        detection = self.detect_accident()

        if not detection["detected"]:
            return {
                "status": "safe",
                "message": "System operating normally.",
                "detection": detection,
                "location": self.location,
            }

        alert_message = self.build_alert_message(note=note, extra_details=device_info)
        payload = self.prepare_alert_payload(
            location=self.location,
            emergency_contacts=self.emergency_contacts,
            user_id=user_id,
            note=note,
            device_info=device_info,
        )
        log_result = self.save_log(alert_message)

        return {
            "status": "dispatched",
            "message": "Emergency protocol activated.",
            "detection": detection,
            "alert": payload,
            "log": log_result,
            "location": self.location,
            "error": self.last_error,
        }


__all__ = ["RakshaAISOS"]
