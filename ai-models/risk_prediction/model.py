from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

from utils import (
    build_advice,
    build_factors,
    build_response,
    calculate_score,
    coordinate_modifier,
    profile_route,
    score_to_color,
    score_to_label,
)


class RiskPredictionModel:
    """Explainable accident risk scoring model for Raksha AI."""

    def __init__(self) -> None:
        self.last_inputs: Dict[str, Any] = {}
        self.last_score: Optional[int] = None

    def calculate_score(
        self,
        *,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        time: Any = None,
        weather: Any = None,
        road: Any = None,
        traffic: Any = None,
        zone: Optional[str] = None,
    ) -> Dict[str, Any]:
        result = calculate_score(
            lat=lat,
            lng=lng,
            time=time,
            weather=weather,
            road=road,
            traffic=traffic,
            zone=zone,
        )
        self.last_inputs = {
            "lat": lat,
            "lng": lng,
            "time": time,
            "weather": weather,
            "road": road,
            "traffic": traffic,
            "zone": zone,
        }
        self.last_score = result["score"]
        return result

    def build_advice(self, score: int, factors: Dict[str, int], zone: Optional[str] = None) -> str:
        return build_advice(score, factors, zone)

    def build_response(
        self,
        *,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        time: Any = None,
        weather: Any = None,
        road: Any = None,
        traffic: Any = None,
        zone: Optional[str] = None,
    ) -> Dict[str, Any]:
        return build_response(
            lat=lat,
            lng=lng,
            time=time,
            weather=weather,
            road=road,
            traffic=traffic,
            zone=zone,
        )

    def profile_route(
        self,
        waypoints: Iterable[Dict[str, Any]],
        *,
        time: Any = None,
        weather: Any = None,
        traffic: Any = None,
        road: Any = None,
    ) -> List[Dict[str, Any]]:
        return profile_route(
            waypoints,
            time=time,
            weather=weather,
            traffic=traffic,
            road=road,
        )

    @staticmethod
    def score_to_label(score: int) -> str:
        return score_to_label(score)

    @staticmethod
    def score_to_color(score: int) -> str:
        return score_to_color(score)

    @staticmethod
    def _build_factors(time: Any, weather: Any, road: Any, traffic: Any) -> Dict[str, int]:
        return build_factors(time, weather, road, traffic)

    @staticmethod
    def _coordinate_modifier(lat: Optional[float], lng: Optional[float]) -> int:
        return coordinate_modifier(lat, lng)


__all__ = ["RiskPredictionModel"]
