from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional


class RakshaRiskModel:
    """
    Backend risk model for Raksha AI.

    This model provides a lightweight, explainable scoring engine that can be
    reused by backend routers for accident-risk predictions and route profiling.
    """

    RISK_THRESHOLDS = {
        "critical": 75,
        "high": 50,
        "medium": 30,
    }

    COLOR_MAP = {
        "critical": "#dc2626",
        "high": "#f97316",
        "medium": "#eab308",
        "low": "#22c55e",
    }

    TIME_FACTORS = {
        "peak": 8,
        "morning": 5,
        "evening": 6,
        "night": 7,
        "late": 6,
        "rush": 8,
        "busy": 7,
    }

    WEATHER_FACTORS = {
        "rain": 7,
        "heavy rain": 8,
        "fog": 6,
        "smoke": 5,
        "storm": 8,
        "hail": 7,
        "clear": 1,
        "sunny": 1,
    }

    ROAD_FACTORS = {
        "pothole": 8,
        "potholes": 8,
        "damaged": 7,
        "crack": 6,
        "waterlogging": 8,
        "water": 7,
        "construction": 6,
        "blocked": 7,
        "clear": 1,
        "good": 1,
    }

    TRAFFIC_FACTORS = {
        "heavy": 8,
        "congested": 8,
        "stop": 8,
        "slow": 6,
        "moderate": 4,
        "light": 2,
        "clear": 2,
    }

    def __init__(self) -> None:
        self.last_inputs: Dict[str, Any] = {}
        self.last_score: Optional[int] = None

    @staticmethod
    def _clean_text(value: Any) -> str:
        return str(value or "").strip().lower()

    def _extract_factor(self, value: Any, mapping: Dict[str, int]) -> int:
        text = self._clean_text(value)
        if not text:
            return 1

        for key, score in mapping.items():
            if key in text:
                return score

        return 1

    def _coordinate_modifier(self, lat: Optional[float], lng: Optional[float]) -> int:
        if lat is None or lng is None:
            return 0

        coordinate_risk = (abs(lat) % 10) + (abs(lng) % 10)
        return min(8, max(0, int(coordinate_risk / 4)))

    def _build_factors(self, time: Any, weather: Any, road: Any, traffic: Any) -> Dict[str, int]:
        factors = {
            "timeOfDay": self._extract_factor(time, self.TIME_FACTORS),
            "weather": self._extract_factor(weather, self.WEATHER_FACTORS),
            "roadCondition": self._extract_factor(road, self.ROAD_FACTORS),
            "trafficLevel": self._extract_factor(traffic, self.TRAFFIC_FACTORS),
        }

        return factors

    @staticmethod
    def score_to_label(score: int) -> str:
        if score >= RakshaRiskModel.RISK_THRESHOLDS["critical"]:
            return "critical"
        if score >= RakshaRiskModel.RISK_THRESHOLDS["high"]:
            return "high"
        if score >= RakshaRiskModel.RISK_THRESHOLDS["medium"]:
            return "medium"
        return "low"

    @classmethod
    def score_to_color(cls, score: int) -> str:
        return cls.COLOR_MAP[cls.score_to_label(score)]

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
        factors = self._build_factors(time, weather, road, traffic)

        score = 20
        score += factors["timeOfDay"] * 2
        score += factors["weather"] * 2
        score += factors["roadCondition"] * 2
        score += factors["trafficLevel"] * 2
        score += self._coordinate_modifier(lat, lng)

        if zone:
            zone_text = self._clean_text(zone)
            if any(keyword in zone_text for keyword in ("flyover", "ring", "expressway", "highway", "junction")):
                score += 6
            if any(keyword in zone_text for keyword in ("noida", "gurgaon", "ghaziabad", "faridabad")):
                score += 4

        score = max(0, min(99, int(score)))
        label = self.score_to_label(score)

        self.last_inputs = {
            "lat": lat,
            "lng": lng,
            "time": time,
            "weather": weather,
            "road": road,
            "traffic": traffic,
            "zone": zone,
        }
        self.last_score = score

        return {
            "score": score,
            "label": label,
            "color": self.score_to_color(score),
            "factors": factors,
        }

    def build_advice(self, score: int, factors: Dict[str, int], zone: Optional[str] = None) -> str:
        if score >= self.RISK_THRESHOLDS["critical"]:
            return "Avoid this zone if possible. High accident probability detected. Drive with extreme caution and allow extra travel time."

        if score >= self.RISK_THRESHOLDS["high"]:
            return "Drive with extreme caution. Multiple risk factors are active, including traffic or road-condition hazards."

        if score >= self.RISK_THRESHOLDS["medium"]:
            return "Normal precautions are advised. Monitor conditions and stay alert near this zone."

        if zone and self._clean_text(zone) and factors["roadCondition"] >= 5:
            return "Road conditions may be worsening. Inspect the route and consider an alternate path if needed."

        return "Zone appears safe. Standard driving precautions still apply."

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
        result = self.calculate_score(
            lat=lat,
            lng=lng,
            time=time,
            weather=weather,
            road=road,
            traffic=traffic,
            zone=zone,
        )

        advice = self.build_advice(result["score"], result["factors"], zone)

        return {
            "score": result["score"],
            "label": result["label"],
            "color": result["color"],
            "factors": result["factors"],
            "advice": advice,
            "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        }

    def build_alert(self, zone: str, score: int, reason: Optional[str] = None) -> Dict[str, Any]:
        label = self.score_to_label(score)
        return {
            "zone": zone,
            "score": score,
            "severity": label,
            "reason": reason or "Risk threshold exceeded.",
            "time": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "status": "active",
        }

    def profile_route(
        self,
        waypoints: Iterable[Dict[str, Any]],
        *,
        time: Any = None,
        weather: Any = None,
        traffic: Any = None,
        road: Any = None,
    ) -> List[Dict[str, Any]]:
        route_profiles = []
        for point in waypoints:
            profile = self.build_response(
                lat=point.get("lat"),
                lng=point.get("lng"),
                time=time,
                weather=weather,
                road=road,
                traffic=traffic,
                zone=point.get("zone"),
            )
            route_profiles.append(
                {
                    "lat": point.get("lat"),
                    "lng": point.get("lng"),
                    "score": profile["score"],
                    "label": profile["label"],
                    "color": profile["color"],
                }
            )

        return route_profiles


__all__ = ["RakshaRiskModel"]
