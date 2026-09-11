"""Reproducible, leakage-safe Isolation Forest utilities."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Mapping

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.feature_extraction.trajectory_features import FEATURE_ORDER, feature_vector

MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_PATH = MODEL_DIR / "isolation_forest.joblib"
SCALER_PATH = MODEL_DIR / "feature_scaler.joblib"
CONFIG_PATH = MODEL_DIR / "isolation_forest_config.json"
SCHEMA_PATH = MODEL_DIR / "feature_schema.json"
RANDOM_STATE = 20260911
PARAMETERS = {"n_estimators": 200, "contamination": 0.15, "max_samples": "auto", "random_state": RANDOM_STATE, "n_jobs": 1}


def matrix(frame: pd.DataFrame) -> np.ndarray:
    if list(FEATURE_ORDER) != [name for name in FEATURE_ORDER if name in frame.columns]:
        raise ValueError("Input data does not contain the complete fixed feature schema")
    values = frame.loc[:, list(FEATURE_ORDER)].to_numpy(dtype=float)
    if not np.isfinite(values).all():
        raise ValueError("Model features must be finite numeric values")
    return values


def train(frame: pd.DataFrame, artifact_dir: Path = MODEL_DIR) -> dict[str, object]:
    """Fit scaler and unsupervised model on only the training partition."""
    x_train = matrix(frame)
    scaler = StandardScaler().fit(x_train)
    model = IsolationForest(**PARAMETERS).fit(scaler.transform(x_train))
    artifact_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, artifact_dir / MODEL_PATH.name); joblib.dump(scaler, artifact_dir / SCALER_PATH.name)
    config = {"python": "3.11+", "scikit_learn": "1.6.1", "parameters": PARAMETERS,
              "feature_order": list(FEATURE_ORDER), "preprocessing": "StandardScaler fitted only on training split"}
    (artifact_dir / CONFIG_PATH.name).write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    (artifact_dir / SCHEMA_PATH.name).write_text(json.dumps({"feature_order": list(FEATURE_ORDER)}, indent=2) + "\n", encoding="utf-8")
    return config


def load() -> tuple[IsolationForest, StandardScaler]:
    if not MODEL_PATH.exists() or not SCALER_PATH.exists():
        raise FileNotFoundError("Model artifacts do not exist. Run scripts/train_isolation_forest.py first.")
    return joblib.load(MODEL_PATH), joblib.load(SCALER_PATH)


def load_from(artifact_dir: Path) -> tuple[IsolationForest, StandardScaler]:
    """Load an explicitly named artifact set without changing the original model."""
    model_path, scaler_path = artifact_dir / MODEL_PATH.name, artifact_dir / SCALER_PATH.name
    if not model_path.exists() or not scaler_path.exists():
        raise FileNotFoundError(f"Missing model artifacts in {artifact_dir}")
    return joblib.load(model_path), joblib.load(scaler_path)


def infer(features: Mapping[str, float | int]) -> dict[str, float | int | str]:
    """Return the model decision score and one consistent contamination threshold status."""
    model, scaler = load()
    vector = np.asarray([feature_vector(features)], dtype=float)
    if not np.isfinite(vector).all():
        raise ValueError("Inference features must be finite")
    raw_prediction = int(model.predict(scaler.transform(vector))[0])
    score = float(model.decision_function(scaler.transform(vector))[0])
    return {"anomaly_score": score, "raw_model_prediction": raw_prediction,
            "normalized_score": None, "anomaly_status": "anomalous" if raw_prediction == -1 else "normal"}
