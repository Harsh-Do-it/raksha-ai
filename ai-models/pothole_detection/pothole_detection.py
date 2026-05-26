"""
pothole_detection.py — Main module for pothole detection API

Consolidates model training, prediction, and inference into a unified interface.
Provides both CLI and programmatic access to the pothole detection pipeline.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

from model import PotholeDetectionModel


# ── Paths ──────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "demo_pothole_model.joblib"
SAMPLE_DATA_PATH = BASE_DIR / "sample_training_data.csv"


# ── Public API ─────────────────────────────────────────────────────────────

def load_model() -> PotholeDetectionModel:
    """Load and return the pothole detection model."""
    return PotholeDetectionModel(MODEL_PATH)


def predict_from_features(features: Iterable[float]) -> Dict[str, Any]:
    """
    Predict pothole from RGB/statistical features.

    Args:
        features: 6-value iterable of [mean_r, mean_g, mean_b, std_r, std_g, std_b]

    Returns:
        Dict with keys: label, confidence
    """
    model = load_model()
    return model.predict(features)


def predict_from_image(image_path: Path | str) -> Dict[str, Any]:
    """
    Predict pothole from an image file.

    Args:
        image_path: Path to the input image

    Returns:
        Dict with keys: label, confidence
    """
    from PIL import Image

    image_path = Path(image_path)
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    image = Image.open(image_path).convert("RGB")
    pixels = list(image.resize((16, 16)).getdata())  # type: ignore
    flat = [channel for pixel in pixels for channel in pixel]

    return predict_from_features(flat)


def train_and_save_model(output_path: Optional[Path] = None) -> Path:
    """
    Train a fresh pothole detection model and save it.

    Args:
        output_path: Path to save the model (defaults to MODEL_PATH)

    Returns:
        Path to the saved model
    """
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier
    import joblib

    if not SAMPLE_DATA_PATH.exists():
        raise FileNotFoundError(f"Sample data not found: {SAMPLE_DATA_PATH}")

    output_path = Path(output_path or MODEL_PATH)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Load training data
    data = pd.read_csv(SAMPLE_DATA_PATH)
    X = data.apply(_build_features, axis=1, result_type="expand")
    y = data["label"]

    # Train classifier
    classifier = RandomForestClassifier(n_estimators=200, random_state=42)
    classifier.fit(X, y)

    # Save model
    joblib.dump(classifier, output_path)
    return output_path


# ── Internal helpers ───────────────────────────────────────────────────────

def _build_features(row) -> list:
    """Extract RGB and std features from a data row."""
    return [
        row["mean_red"],
        row["mean_green"],
        row["mean_blue"],
        row["std_red"],
        row["std_green"],
        row["std_blue"],
    ]


# ── CLI ────────────────────────────────────────────────────────────────────

def main():
    """Command-line interface for pothole detection."""
    import argparse

    parser = argparse.ArgumentParser(description="Pothole Detection API")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Predict subcommand
    predict_parser = subparsers.add_parser("predict", help="Predict on an image")
    predict_parser.add_argument("image", type=Path, help="Path to input image")

    # Train subcommand
    train_parser = subparsers.add_parser("train", help="Train a new model")
    train_parser.add_argument("--output", type=Path, default=MODEL_PATH, help="Path to save model")

    # Demo subcommand
    demo_parser = subparsers.add_parser("demo", help="Run demo predictions")

    args = parser.parse_args()

    if args.command == "predict":
        try:
            result = predict_from_image(args.image)
            print(json.dumps(result, indent=2))
        except Exception as e:
            print(f"Error: {e}", flush=True)
            return 1

    elif args.command == "train":
        try:
            path = train_and_save_model(args.output)
            print(f"Model trained and saved to: {path}", flush=True)
        except Exception as e:
            print(f"Error: {e}", flush=True)
            return 1

    elif args.command == "demo":
        try:
            # Train a fresh model
            model_path = train_and_save_model()
            print(f"Trained model saved to {model_path}")

            # Run demo prediction on synthetic features
            model = load_model()
            fake_features = [120, 122, 124, 11, 12, 10]
            result = model.predict(fake_features)
            print("Demo prediction result:")
            print(json.dumps(result, indent=2))
        except Exception as e:
            print(f"Error: {e}", flush=True)
            return 1

    else:
        parser.print_help()
        return 1

    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
