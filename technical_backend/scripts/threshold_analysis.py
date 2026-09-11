"""Reproducible validation-only threshold calibration for Phase 5.5.

The historical test partition and model are archived before any new model is
trained. Threshold selection consumes validation scores only.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, roc_auc_score

ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
from app.anomaly_detection.isolation_forest import MODEL_DIR, load_from, matrix, train

SEED = 20260911
ORIGINAL_DIR = MODEL_DIR / "ORIGINAL_CONFIGURATION"
SELECTED_DIR = MODEL_DIR / "VALIDATION_SELECTED_THRESHOLD"
RESULTS_DIR = ROOT / "results"
DATA = ROOT / "data" / "processed" / "trajectory_features.csv"
ORIGINAL_SPLIT = ROOT / "data" / "processed" / "dataset_splits.csv"
THREE_WAY_SPLIT = ROOT / "data" / "processed" / "threshold_analysis_splits.csv"
ORIGINAL_RESULT = {"confusion_matrix": [[42, 0], [29, 16]], "precision": 1.0, "recall": 0.35555555555555557,
                   "f1_score": 0.5245901639344263, "false_positive_rate": 0.0,
                   "false_negative_rate": 0.6444444444444445, "roc_auc": 0.9894179894179893}


def metric_row(labels, scores, threshold):
    predicted = (scores >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(labels, predicted, labels=[0, 1]).ravel()
    precision, recall, f1, _ = precision_recall_fscore_support(labels, predicted, average="binary", zero_division=0)
    return {"threshold": float(threshold), "precision": float(precision), "recall": float(recall), "f1_score": float(f1),
            "false_positive_rate": fp / (fp + tn) if fp + tn else None,
            "false_negative_rate": fn / (fn + tp) if fn + tp else None}


def preserve_original() -> None:
    """Copy once; refuse an accidental overwrite of the historical experiment."""
    ORIGINAL_DIR.mkdir(parents=True, exist_ok=True)
    for name in ("isolation_forest.joblib", "feature_scaler.joblib", "isolation_forest_config.json", "feature_schema.json"):
        source, target = MODEL_DIR / name, ORIGINAL_DIR / name
        if not target.exists():
            shutil.copy2(source, target)
    original_copy = ORIGINAL_DIR / "original_dataset_splits.csv"
    if not original_copy.exists(): shutil.copy2(ORIGINAL_SPLIT, original_copy)
    metrics = ORIGINAL_DIR / "original_evaluation.json"
    if not metrics.exists(): metrics.write_text(json.dumps(ORIGINAL_RESULT, indent=2) + "\n", encoding="utf-8")


def make_split(data: pd.DataFrame) -> pd.DataFrame:
    original = pd.read_csv(ORIGINAL_SPLIT)
    original_train = original.query("split == 'train'").trajectory_id.tolist()
    # Only the historical training IDs are shuffled. The original test IDs remain untouched.
    rng = np.random.default_rng(SEED); rng.shuffle(original_train)
    validation_count = round(len(original_train) * 0.20)
    mapping = {identifier: "validation" if index < validation_count else "train" for index, identifier in enumerate(original_train)}
    mapping.update({identifier: "test" for identifier in original.query("split == 'test'").trajectory_id})
    split = data[["trajectory_id", "label", "scenario"]].copy(); split["split"] = split.trajectory_id.map(mapping)
    if split.split.isna().any() or (set(split.query("split == 'test'").trajectory_id) != set(original.query("split == 'test'").trajectory_id)):
        raise RuntimeError("Original held-out test set was not preserved")
    split.to_csv(THREE_WAY_SPLIT, index=False)
    return split


def write_report(counts, thresholds, selected, final, scenario, score_summary) -> None:
    RESULTS_DIR.mkdir(exist_ok=True)
    # Avoid pandas.DataFrame.to_markdown(), which depends on optional tabulate.
    def markdown_table(rows, fields):
        header = "| " + " | ".join(fields) + " |"
        separator = "| " + " | ".join("---" for _ in fields) + " |"
        body = []
        for row in rows:
            values = []
            for field in fields:
                value = row[field]
                values.append(f"{value:.6f}" if isinstance(value, float) else str(value))
            body.append("| " + " | ".join(values) + " |")
        return "\n".join([header, separator, *body])
    table = markdown_table(thresholds, ["threshold", "precision", "recall", "f1_score", "false_positive_rate", "false_negative_rate"])
    scenario_table = markdown_table(scenario, ["scenario", "samples", "detected", "missed", "detection_rate"])
    content = f"""# Phase 5.5 threshold analysis

## Original configuration (preserved)

`ORIGINAL_CONFIGURATION` contains the original model, scaler, configuration, schema, split, and executed result. Its default Isolation Forest prediction uses `decision_function < 0` as anomalous (equivalent to `anomaly_score = -decision_function > 0`). The original result was `{json.dumps(ORIGINAL_RESULT)}`.

## Score direction and distribution

Higher `anomaly_score` means more anomalous. It is the negative Isolation Forest `decision_function`; this is a custom reporting direction, while the original prediction threshold is the Isolation Forest default at score `0`. The score plot is `score_distribution.png`; normal and anomalous distribution summaries are `{json.dumps(score_summary)}`.

## Split and leakage control

The original held-out test set remains identical and untouched. Only its original 203 training samples were shuffled with seed `{SEED}` and split into a new train/validation partition. Counts and label distribution: `{json.dumps(counts)}`. The scaler and Isolation Forest are fitted only on `train`; labels are used only for validation metric calculation and final evaluation, never model fitting.

## Validation threshold experiment

Thresholds are empirical quantiles of **validation scores only**. Selection rule: maximum validation F1, breaking ties in favor of the lower false-positive rate. This provides a reproducible balance of missed controlled anomalies and unnecessary alerts; it is not a real-world tourist-safety operating policy.

{table}

Selected validation threshold: `{selected['threshold']:.6f}`. No threshold was selected using the held-out test set.

## Final held-out test evaluation

The validation-selected threshold was applied once to the untouched original test partition: `{json.dumps(final)}`.

## Comparison with original result

Original default result: `{json.dumps(ORIGINAL_RESULT)}`. The result above is a separate validation-selected-threshold experiment and does not overwrite it.

## Scenario-wise detection analysis

{scenario_table}

## Limitations

This is Synthetic Controlled Evaluation Data, not real tourist data. Its distributions may not match operational trajectories. Isolation Forest is sensitive to contamination and the chosen score threshold. Sample counts are small, particularly per scenario. No real-tourist validation, fairness analysis, or real-world safety conclusion is supported.
"""
    (RESULTS_DIR / "THRESHOLD_ANALYSIS.md").write_text(content, encoding="utf-8")


if __name__ == "__main__":
    preserve_original()
    RESULTS_DIR.mkdir(exist_ok=True)
    data = pd.read_csv(DATA); split = make_split(data)
    joined = data.merge(split[["trajectory_id", "split"]], on="trajectory_id")
    train(joined.query("split == 'train'"), SELECTED_DIR)
    model, scaler = load_from(SELECTED_DIR)
    validation = joined.query("split == 'validation'").copy(); test = joined.query("split == 'test'").copy()
    validation["anomaly_score"] = -model.decision_function(scaler.transform(matrix(validation)))
    test["anomaly_score"] = -model.decision_function(scaler.transform(matrix(test)))
    candidates = np.unique(np.quantile(validation.anomaly_score, np.linspace(0.01, 0.99, 41)))
    threshold_rows = [metric_row(validation.label, validation.anomaly_score, value) for value in candidates]
    selected = max(threshold_rows, key=lambda row: (row["f1_score"], -row["false_positive_rate"], -row["threshold"]))
    final = metric_row(test.label, test.anomaly_score, selected["threshold"])
    (SELECTED_DIR / "selected_threshold.json").write_text(json.dumps({
        "threshold": selected["threshold"], "score_direction": "anomaly_score = -IsolationForest.decision_function; higher is more anomalous",
        "decision_rule": "anomalous when anomaly_score >= threshold",
        "selection_source": "Phase 5.5 validation-only maximum-F1 selection; held-out test set was not used for selection",
    }, indent=2) + "\n", encoding="utf-8")
    final["confusion_matrix"] = confusion_matrix(test.label, (test.anomaly_score >= selected["threshold"]).astype(int), labels=[0, 1]).tolist()
    final["roc_auc"] = float(roc_auc_score(test.label, test.anomaly_score)) if test.label.nunique() == 2 else None
    rows = []
    for scenario, group in test.query("label == 1").groupby("scenario"):
        detected = int((group.anomaly_score >= selected["threshold"]).sum())
        rows.append({"scenario": scenario, "samples": len(group), "detected": detected, "missed": len(group) - detected, "detection_rate": round(detected / len(group), 6)})
    counts = split.groupby(["split", "label"]).size().unstack(fill_value=0).rename(columns={0: "normal", 1: "anomalous"}).to_dict("index")
    summary = {"normal": validation.query("label == 0").anomaly_score.describe().round(6).to_dict(), "anomalous": validation.query("label == 1").anomaly_score.describe().round(6).to_dict()}
    pd.DataFrame(threshold_rows).to_csv(RESULTS_DIR / "validation_threshold_comparison.csv", index=False)
    plt.figure(figsize=(8, 4)); plt.hist(validation.query("label == 0").anomaly_score, bins=16, alpha=.65, label="normal")
    plt.hist(validation.query("label == 1").anomaly_score, bins=16, alpha=.65, label="anomalous"); plt.axvline(selected["threshold"], color="black", linestyle="--", label="selected threshold")
    plt.xlabel("anomaly score (higher = more anomalous)"); plt.ylabel("validation samples"); plt.legend(); plt.tight_layout(); plt.savefig(RESULTS_DIR / "score_distribution.png", dpi=150); plt.close()
    write_report(counts, threshold_rows, selected, final, rows, summary)
    print(json.dumps({"selected_threshold": selected, "final_test": final, "scenario_analysis": rows}, indent=2))
