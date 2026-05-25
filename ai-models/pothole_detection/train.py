from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier


def build_features(row):
    return [
        row["mean_red"],
        row["mean_green"],
        row["mean_blue"],
        row["std_red"],
        row["std_green"],
        row["std_blue"],
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a pothole detection classifier.")
    parser.add_argument("input_csv", type=Path, help="CSV containing image-derived features and a label column")
    parser.add_argument("--output", type=Path, default=Path("artifacts/pothole_model.joblib"), help="Where to store the trained model")
    args = parser.parse_args()

    data = pd.read_csv(args.input_csv)
    required = {"mean_red", "mean_green", "mean_blue", "std_red", "std_green", "std_blue", "label"}
    missing = required.difference(data.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    X = data.apply(build_features, axis=1, result_type="expand")
    y = data["label"]

    clf = RandomForestClassifier(n_estimators=200, random_state=42)
    clf.fit(X, y)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, args.output)
    print(f"Saved trained model to {args.output}")


if __name__ == "__main__":
    main()
