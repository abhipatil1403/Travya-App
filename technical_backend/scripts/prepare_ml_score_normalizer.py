"""Fit the score normalizer only from the Phase 5.5 training partition."""
from __future__ import annotations
import json, sys
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
from app.anomaly_detection.isolation_forest import load_from, matrix

if __name__ == "__main__":
    data = pd.read_csv(ROOT / "data" / "processed" / "trajectory_features.csv")
    split = pd.read_csv(ROOT / "data" / "processed" / "threshold_analysis_splits.csv")
    train = data.merge(split[["trajectory_id", "split"]], on="trajectory_id").query("split == 'train'")
    artifacts = ROOT / "models" / "VALIDATION_SELECTED_THRESHOLD"; model, scaler = load_from(artifacts)
    scores = -model.decision_function(scaler.transform(matrix(train)))
    normalizer = {"strategy": "training_score_minmax_clip", "training_score_min": float(scores.min()), "training_score_max": float(scores.max()), "sample_count": int(len(scores)), "source_split": "train_only"}
    (artifacts / "ml_score_normalizer.json").write_text(json.dumps(normalizer, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(normalizer, indent=2))
