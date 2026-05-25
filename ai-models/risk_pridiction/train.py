from __future__ import annotations

import argparse
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer

import pandas as pd


def build_pipeline() -> Pipeline:
    numeric_features = ["lat", "lng", "time_of_day", "weather", "road_condition", "traffic_level"]
    categorical_features = ["zone"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", SimpleImputer(strategy="median"), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ]
    )

    classifier = RandomForestClassifier(n_estimators=200, random_state=42)
    return Pipeline(steps=[("preprocess", preprocessor), ("model", classifier)])


def main() -> None:
    parser = argparse.ArgumentParser(description="Train an accident-risk classifier from tabular data.")
    parser.add_argument("input_csv", type=Path, help="Path to a CSV file containing labeled risk data")
    parser.add_argument("--output", type=Path, default=Path("artifacts/risk_model.joblib"), help="Where to save the trained model")
    args = parser.parse_args()

    dataset = pd.read_csv(args.input_csv)
    required = {"lat", "lng", "time_of_day", "weather", "road_condition", "traffic_level", "label"}
    missing = required.difference(dataset.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    X = dataset[["lat", "lng", "time_of_day", "weather", "road_condition", "traffic_level", "zone"]]
    y = dataset["label"]

    pipeline = build_pipeline()
    pipeline.fit(X, y)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    import joblib

    joblib.dump(pipeline, args.output)
    print(f"Saved trained model to {args.output}")


if __name__ == "__main__":
    main()
