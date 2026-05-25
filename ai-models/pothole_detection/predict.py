from __future__ import annotations

import argparse
import json
from pathlib import Path

from model import PotholeDetectionModel


def extract_features(image_path: Path):
    from PIL import Image

    image = Image.open(image_path).convert("RGB")
    pixels = list(image.resize((16, 16)).getdata())
    flat = [channel for pixel in pixels for channel in pixel]
    return flat


def main() -> None:
    parser = argparse.ArgumentParser(description="Run pothole detection inference on an image.")
    parser.add_argument("image", type=Path, help="Path to the input image")
    parser.add_argument("--model", type=Path, default=Path("artifacts/pothole_model.joblib"), help="Path to a saved sklearn model")
    args = parser.parse_args()

    model = PotholeDetectionModel(args.model)
    result = model.predict(extract_features(args.image))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
