from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

from model import PotholeDetectionModel


BASE_DIR = Path(__file__).resolve().parent
SAMPLE_PATH = BASE_DIR / "sample_training_data.csv"
ARTIFACT_PATH = BASE_DIR / "artifacts" / "demo_pothole_model.joblib"


def build_features(row):
    return [
        row["mean_red"],
        row["mean_green"],
        row["mean_blue"],
        row["std_red"],
        row["std_green"],
        row["std_blue"],
    ]


def train_demo_model() -> None:
    data = pd.read_csv(SAMPLE_PATH)
    X = data.apply(build_features, axis=1, result_type="expand")
    y = data["label"]

    classifier = RandomForestClassifier(n_estimators=200, random_state=42)
    classifier.fit(X, y)

    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(classifier, ARTIFACT_PATH)


if __name__ == "__main__":
    train_demo_model()
    print(f"Saved demo model to {ARTIFACT_PATH}")

    model = PotholeDetectionModel(ARTIFACT_PATH)
    fake_features = [120, 122, 124, 11, 12, 10]
    print(model.predict(fake_features))
