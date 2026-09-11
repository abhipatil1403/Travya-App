"""Train only on a reproducible non-test partition; labels are never model input."""
from __future__ import annotations
import sys
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
from app.anomaly_detection.isolation_forest import train

SOURCE = ROOT / "data" / "processed" / "trajectory_features.csv"
SPLIT = ROOT / "data" / "processed" / "dataset_splits.csv"

if __name__ == "__main__":
    frame = pd.read_csv(SOURCE)
    # Shuffled index split avoids labels entirely for training; labels stay for held-out evaluation only.
    shuffled = frame.sample(frac=1, random_state=20260911).reset_index(drop=True)
    cut = round(len(shuffled) * 0.70)
    split = ["train"] * cut + ["test"] * (len(shuffled) - cut)
    shuffled.assign(split=split)[["trajectory_id", "split"]].to_csv(SPLIT, index=False)
    print(train(shuffled.iloc[:cut]))
