"""Calculate held-out evaluation metrics only when this script is actually run."""
from __future__ import annotations
import json, sys
from pathlib import Path
import pandas as pd
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, roc_auc_score

ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
from app.anomaly_detection.isolation_forest import load, matrix

if __name__ == "__main__":
    data = pd.read_csv(ROOT / "data" / "processed" / "trajectory_features.csv")
    splits = pd.read_csv(ROOT / "data" / "processed" / "dataset_splits.csv")
    test = data.merge(splits, on="trajectory_id").query("split == 'test'")
    model, scaler = load(); transformed = scaler.transform(matrix(test))
    prediction = (model.predict(transformed) == -1).astype(int)
    scores = -model.decision_function(transformed)  # higher means more anomalous
    tn, fp, fn, tp = confusion_matrix(test.label, prediction, labels=[0, 1]).ravel()
    precision, recall, f1, _ = precision_recall_fscore_support(test.label, prediction, average="binary", zero_division=0)
    result = {"confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]], "precision": precision, "recall": recall, "f1_score": f1,
              "false_positive_rate": fp / (fp + tn) if fp + tn else None, "false_negative_rate": fn / (fn + tp) if fn + tp else None,
              "roc_auc": roc_auc_score(test.label, scores) if test.label.nunique() == 2 else None}
    print(json.dumps(result, indent=2))
