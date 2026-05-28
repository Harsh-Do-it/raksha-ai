from __future__ import annotations

import argparse
import json
from pathlib import Path

from model import RiskPredictionModel


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict accident risk for a location or zone.")
    parser.add_argument("--lat", type=float, help="Latitude of the location")
    parser.add_argument("--lng", type=float, help="Longitude of the location")
    parser.add_argument("--time", default="", help="Time condition text, e.g. peak, night, morning")
    parser.add_argument("--weather", default="", help="Weather condition text, e.g. heavy rain")
    parser.add_argument("--road", default="", help="Road condition text, e.g. pothole")
    parser.add_argument("--traffic", default="", help="Traffic condition text, e.g. heavy")
    parser.add_argument("--zone", default="", help="Zone or route name")
    parser.add_argument("--output", type=Path, help="Optional path to save JSON output")
    args = parser.parse_args()

    model = RiskPredictionModel()
    result = model.build_response(
        lat=args.lat,
        lng=args.lng,
        time=args.time,
        weather=args.weather,
        road=args.road,
        traffic=args.traffic,
        zone=args.zone,
    )

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2), encoding="utf-8")

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
