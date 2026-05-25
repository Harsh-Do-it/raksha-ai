from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable

import joblib
import numpy as np


@dataclass
class PotholeDetectionModel:
    """Simple image classifier wrapper for pothole detection."""

    model_path: Path
    _clf = None

    def load(self):
        if self._clf is None:
            self._clf = joblib.load(self.model_path)
        return self._clf

    def predict(self, features: Iterable[float]) -> Dict[str, float]:
        vector = np.asarray(list(features), dtype=float).reshape(1, -1)
        clf = self.load()
        pred = int(clf.predict(vector)[0])
        proba = float(clf.predict_proba(vector)[0][pred])
        label = "pothole" if pred == 1 else "safe"
        return {"label": label, "confidence": proba}


__all__ = ["PotholeDetectionModel"]
