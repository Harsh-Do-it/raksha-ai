from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from model import RiskPredictionModel


BASE_DIR = Path(__file__).resolve().parent
SAMPLE_PATH = BASE_DIR / "sample_training_data.csv"
ARTIFACT_PATH = BASE_DIR / "artifacts" / "demo_risk_model.joblib"


def build_pipeline() -> Pipeline:
    numeric_features = ["lat", "lng"]
    categorical_features = ["time_of_day", "weather", "road_condition", "traffic_level", "zone"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", SimpleImputer(strategy="median"), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ]
    )
    classifier = RandomForestClassifier(n_estimators=200, random_state=42)
    return Pipeline(steps=[("preprocess", preprocessor), ("model", classifier)])


def train_demo_model() -> None:
    dataset = pd.read_csv(SAMPLE_PATH)
    X = dataset[["lat", "lng", "time_of_day", "weather", "road_condition", "traffic_level", "zone"]]
    y = dataset["label"]

    model = build_pipeline()
    model.fit(X, y)

    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, ARTIFACT_PATH)


def run_demo_prediction() -> dict:
    model = RiskPredictionModel()
    return model.build_response(
        lat=28.61,
        lng=77.20,
        time="peak",
        weather="rain",
        road="pothole",
        traffic="heavy",
        zone="NH-48",
    )


if __name__ == "__main__":
    train_demo_model()
    print(f"Saved demo model to {ARTIFACT_PATH}")
    print(run_demo_prediction())
