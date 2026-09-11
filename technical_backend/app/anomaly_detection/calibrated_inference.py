"""Inference using the preserved Phase 5.5 validation-selected artifacts."""
from __future__ import annotations
import json, math
from pathlib import Path
from typing import Any, Mapping
import numpy as np
from app.anomaly_detection.isolation_forest import load_from
from app.feature_extraction.trajectory_features import feature_vector

ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = ROOT / "models" / "VALIDATION_SELECTED_THRESHOLD"
THRESHOLD_PATH = ARTIFACT_DIR / "selected_threshold.json"
NORMALIZER_PATH = ARTIFACT_DIR / "ml_score_normalizer.json"

def artifact_status() -> dict[str, bool]:
    return {"model": (ARTIFACT_DIR / "isolation_forest.joblib").exists(), "scaler": (ARTIFACT_DIR / "feature_scaler.joblib").exists(), "threshold": THRESHOLD_PATH.exists(), "normalizer": NORMALIZER_PATH.exists()}

def calibrated_infer(features: Mapping[str, float | int]) -> dict[str, Any]:
    status = artifact_status()
    if not status["model"] or not status["scaler"]: raise FileNotFoundError("Validation-selected model or scaler artifact is unavailable")
    if not status["threshold"]: raise FileNotFoundError("Validation-selected threshold artifact is unavailable")
    if not status["normalizer"]: raise FileNotFoundError("ML score normalizer artifact is unavailable; run prepare_ml_score_normalizer.py")
    model, scaler = load_from(ARTIFACT_DIR)
    vector = np.asarray([feature_vector(features)], dtype=float)
    if not np.isfinite(vector).all(): raise ValueError("Feature vector contains invalid values")
    score = float(-model.decision_function(scaler.transform(vector))[0])
    threshold_data = json.loads(THRESHOLD_PATH.read_text(encoding="utf-8")); threshold = float(threshold_data["threshold"])
    normalizer = json.loads(NORMALIZER_PATH.read_text(encoding="utf-8")); low, high = float(normalizer["training_score_min"]), float(normalizer["training_score_max"])
    if not all(math.isfinite(value) for value in (score, threshold, low, high)) or high <= low: raise ValueError("Invalid saved inference artifact values")
    ml_risk = min(1.0, max(0.0, (score - low) / (high - low)))
    return {"anomaly_score": score, "anomaly_status": "anomalous" if score >= threshold else "normal", "ml_risk": ml_risk, "threshold": threshold}
