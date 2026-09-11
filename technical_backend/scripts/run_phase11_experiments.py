"""Phase 11: execute reproducible evaluation without training or recalibration."""
from __future__ import annotations
import csv, json, random, statistics, sys, time
from pathlib import Path
from unittest.mock import patch
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, roc_auc_score, roc_curve

ROOT = Path(__file__).resolve().parents[1]; sys.path[:0] = [str(ROOT), str(ROOT / "scripts")]
from app.anomaly_detection.calibrated_inference import ARTIFACT_DIR, load_from
from app.anomaly_detection.isolation_forest import matrix
from app.feature_extraction.trajectory_features import extract_features
from app.geofencing.engine import evaluate_geofence
from app.main import app
from app.risk_fusion.engine import fuse_risks
from app.safety_score.engine import calculate_safety_score
import generate_controlled_trajectories as generator

RESULTS, TABLES, FIGURES = ROOT / "results", ROOT / "results" / "tables", ROOT / "results" / "figures"
DATA, SPLITS = ROOT / "data" / "processed" / "trajectory_features.csv", ROOT / "data" / "processed" / "threshold_analysis_splits.csv"
CLIENT = TestClient(app); REPEAT = 30
NOTICE = "Results are obtained from controlled synthetic prototype evaluation data and do not represent validated real-world tourist behaviour."

def save(rows, name):
    pd.DataFrame(rows).to_csv(TABLES / name, index=False)

def request(scenario, latitude, longitude):
    events, _ = generator.build_trajectory(1100, scenario, random.Random(42))
    for event in events: event.pop("event_type")
    return {"events": events, "current_latitude": latitude, "current_longitude": longitude}

def call(name, scenario, latitude, longitude):
    response = CLIENT.post("/api/v1/risk-assessment", json=request(scenario, latitude, longitude))
    if response.status_code != 200: raise RuntimeError(f"{name} failed: {response.status_code} {response.text}")
    body = response.json()
    return {"scenario": name, "anomaly_status": body["anomaly_detection"]["anomaly_status"], "ml_risk": body["anomaly_detection"]["ml_risk"], "zone": body["geofencing"]["zone"], "geofence_risk": body["geofencing"]["geofence_risk"], "final_risk": body["risk_assessment"]["final_risk"], "risk_level": body["risk_assessment"]["risk_level"], "safety_score": body["safety_assessment"]["safety_score"], "safety_category": body["safety_assessment"]["safety_category"]}

def timed(fn):
    start = time.perf_counter_ns(); result = fn(); return result, (time.perf_counter_ns() - start) / 1_000_000

def latency_summary(values):
    return {"repetitions": len(values), "mean_ms": statistics.mean(values), "median_ms": statistics.median(values), "min_ms": min(values), "max_ms": max(values), "stddev_ms": statistics.stdev(values) if len(values) > 1 else 0}

def main():
    RESULTS.mkdir(exist_ok=True); TABLES.mkdir(parents=True, exist_ok=True); FIGURES.mkdir(parents=True, exist_ok=True)
    data, splits = pd.read_csv(DATA), pd.read_csv(SPLITS)
    joined = data.merge(splits[["trajectory_id", "split"]], on="trajectory_id"); test = joined.query("split == 'test'").copy()
    dataset = [{"total_samples": len(data), "normal_samples": int((data.label == 0).sum()), "anomalous_samples": int((data.label == 1).sum()), "anomaly_scenarios": int(data.query("label == 1").scenario.nunique()), "feature_names": "; ".join(generator.FEATURE_FIELDS[1:-2]), "missing_values": int(data.isna().sum().sum()), "duplicate_rows": int(data.duplicated().sum())}]
    save(dataset, "table_1_dataset_summary.csv"); save(data.groupby(["scenario", "label"]).size().reset_index(name="samples").to_dict("records"), "table_1b_samples_per_scenario.csv")
    model, scaler = load_from(ARTIFACT_DIR); threshold = json.loads((ARTIFACT_DIR / "selected_threshold.json").read_text())["threshold"]
    scores = -model.decision_function(scaler.transform(matrix(test))); predicted = (scores >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(test.label, predicted, labels=[0, 1]).ravel(); precision, recall, f1, _ = precision_recall_fscore_support(test.label, predicted, average="binary", zero_division=0)
    perf = [{"true_negative":int(tn),"false_positive":int(fp),"false_negative":int(fn),"true_positive":int(tp),"precision":precision,"recall":recall,"f1_score":f1,"false_positive_rate":fp/(fp+tn),"false_negative_rate":fn/(fn+tp),"roc_auc":roc_auc_score(test.label, scores),"threshold":threshold}]
    save(perf, "table_2_anomaly_detection_performance.csv")
    scenario=[]
    for name, group in test.groupby("scenario"):
        group_scores = -model.decision_function(scaler.transform(matrix(group))); detected = int((group_scores >= threshold).sum())
        scenario.append({"scenario":name,"label":int(group.label.iloc[0]),"samples":len(group),"detected":detected,"missed":len(group)-detected,"scenario_recall":detected/len(group)})
    save(scenario, "table_3_scenario_performance.csv")
    plt.figure(figsize=(4,3)); plt.imshow([[tn,fp],[fn,tp]], cmap="Blues"); plt.xticks([0,1],["Normal","Anomalous"]); plt.yticks([0,1],["Normal","Anomalous"]); plt.xlabel("Predicted"); plt.ylabel("Actual")
    for i,row in enumerate([[tn,fp],[fn,tp]]):
        for j,value in enumerate(row): plt.text(j,i,str(value),ha="center",va="center")
    plt.title("Controlled-synthetic confusion matrix"); plt.tight_layout(); plt.savefig(FIGURES / "figure_1_confusion_matrix.png",dpi=200); plt.close()
    fpr,tpr,_=roc_curve(test.label,scores); plt.figure(figsize=(4,3)); plt.plot(fpr,tpr,label=f"AUC={perf[0]['roc_auc']:.3f}"); plt.plot([0,1],[0,1],'--',color='gray'); plt.xlabel("False positive rate"); plt.ylabel("True positive rate"); plt.legend(); plt.title("Controlled-synthetic ROC curve"); plt.tight_layout(); plt.savefig(FIGURES / "figure_2_roc_curve.png",dpi=200); plt.close()
    anomalies=[row for row in scenario if row["label"]==1]; plt.figure(figsize=(8,3)); plt.bar([row["scenario"].replace("_","\n") for row in anomalies],[row["scenario_recall"] for row in anomalies]); plt.ylim(0,1); plt.ylabel("Scenario recall"); plt.xticks(rotation=0,fontsize=7); plt.title("Controlled-synthetic anomaly scenario recall"); plt.tight_layout(); plt.savefig(FIGURES / "figure_3_scenario_recall.png",dpi=200); plt.close()
    matrix_rows=[]
    for title,kind,lat,lon in [("Normal + SAFE","normal_tourist_movement",12.97,77.59),("Normal + WARNING","normal_tourist_movement",12.98,77.61),("Normal + DANGER","normal_tourist_movement",12.99,77.62),("Anomalous + SAFE","high_speed_abnormal_movement",12.97,77.59),("Anomalous + WARNING","high_speed_abnormal_movement",12.98,77.61),("Anomalous + DANGER","high_speed_abnormal_movement",12.99,77.62),("Normal + OUTSIDE","normal_tourist_movement",0,0),("Anomalous + OUTSIDE","high_speed_abnormal_movement",0,0)]: matrix_rows.append(call(title,kind,lat,lon))
    save(matrix_rows,"table_4_end_to_end_scenarios.csv")
    plt.figure(figsize=(8,3)); plt.bar(range(len(matrix_rows)),[row["final_risk"] for row in matrix_rows],label="final risk"); plt.bar(range(len(matrix_rows)),[row["ml_risk"] for row in matrix_rows],alpha=.55,label="ML risk"); plt.xticks(range(len(matrix_rows)),[row["scenario"].replace(" + ","\n+") for row in matrix_rows],fontsize=7); plt.ylim(0,1); plt.ylabel("Risk"); plt.legend(); plt.title("End-to-end component contributions"); plt.tight_layout(); plt.savefig(FIGURES / "figure_4_component_contributions.png",dpi=200); plt.close()
    # Actual engine-level monotonic checks with fixed components (no substituting pipeline outputs).
    monotonic=[]
    for geo in (0,.5,1):
        risks=[fuse_risks({"ml_risk":ml},{"geofence_risk":geo,"zone":"CONTROLLED"})["final_risk"] for ml in (0,.25,.5,.75,1)]; monotonic.append({"varying":"ml_risk","fixed_geofence_risk":geo,"non_decreasing":risks==sorted(risks)})
    for ml in (0,.5,1):
        risks=[fuse_risks({"ml_risk":ml},{"geofence_risk":geo,"zone":"CONTROLLED"})["final_risk"] for geo in (0,.25,.5,.75,1)]; monotonic.append({"varying":"geofence_risk","fixed_ml_risk":ml,"non_decreasing":risks==sorted(risks)})
    scores=[calculate_safety_score({"final_risk":risk})["safety_score"] for risk in (0,.25,.5,.75,1)]; monotonic.append({"varying":"final_risk","safety_non_increasing":scores==sorted(scores,reverse=True)})
    save(monotonic,"table_5_monotonicity.csv")
    repeated=[CLIENT.post("/api/v1/risk-assessment",json=request("normal_tourist_movement",12.97,77.59)).json() for _ in range(10)]; deterministic=[{"repetitions":10,"identical_outputs":all(item==repeated[0] for item in repeated),"compared_fields":"entire response JSON; response has no request ID or timestamp"}]; save(deterministic,"table_6_determinism.csv")
    payload=request("normal_tourist_movement",12.97,77.59); events=payload["events"]; component_times={key:[] for key in ("feature_extraction","anomaly_inference","geofencing","risk_fusion","safety_score","total_pipeline")}
    for _ in range(REPEAT):
        features,ms=timed(lambda:extract_features(events)); component_times["feature_extraction"].append(ms)
        anomaly,ms=timed(lambda: -model.decision_function(scaler.transform(np.asarray([list(features.values())],dtype=float)))[0]); component_times["anomaly_inference"].append(ms)
        geo,ms=timed(lambda:evaluate_geofence(12.97,77.59)); component_times["geofencing"].append(ms)
        fusion,ms=timed(lambda:fuse_risks({"ml_risk":.5},geo)); component_times["risk_fusion"].append(ms)
        _,ms=timed(lambda:calculate_safety_score(fusion)); component_times["safety_score"].append(ms)
        _,ms=timed(lambda:CLIENT.post("/api/v1/risk-assessment",json=payload)); component_times["total_pipeline"].append(ms)
    latency=[{"component":key,**latency_summary(value)} for key,value in component_times.items()]; save(latency,"table_7_latency.csv")
    plt.figure(figsize=(7,3)); plt.bar([row["component"].replace("_","\n") for row in latency],[row["mean_ms"] for row in latency]); plt.ylabel("Mean local execution time (ms)"); plt.title(f"Local prototype timing (n={REPEAT})"); plt.tight_layout(); plt.savefig(FIGURES / "figure_5_latency.png",dpi=200); plt.close()
    invalid=[]
    valid=request("normal_tourist_movement",12.97,77.59)
    cases=[("invalid_latitude",{**valid,"current_latitude":91}),("invalid_longitude",{**valid,"current_longitude":181}),("missing_required_field",{**valid,"events":[{key:value for key,value in event.items() if key!='actual_mode'} for event in valid['events']]}),("negative_distance",{**valid,"events":[{**event,"segment_distance_km":-1} if event['event_index']==1 else event for event in valid['events']]})]
    for category,value in cases:
        response=CLIENT.post("/api/v1/risk-assessment",json=value); invalid.append({"input_category":category,"http_status":response.status_code,"rejected":response.status_code>=400,"fake_safety_result_returned":"safety_assessment" in response.json()})
    with patch("app.api.v1.calibrated_infer",side_effect=FileNotFoundError("model artifact unavailable")):
        response=CLIENT.post("/api/v1/risk-assessment",json=valid); invalid.append({"input_category":"missing_model_artifact_isolated_test","http_status":response.status_code,"rejected":response.status_code==503,"fake_safety_result_returned":"safety_assessment" in response.json()})
    with patch("app.api.v1.calibrated_infer",side_effect=FileNotFoundError("normalizer artifact unavailable")):
        response=CLIENT.post("/api/v1/risk-assessment",json=valid); invalid.append({"input_category":"missing_normalizer_artifact_isolated_test","http_status":response.status_code,"rejected":response.status_code==503,"fake_safety_result_returned":"safety_assessment" in response.json()})
    save(invalid,"table_8_invalid_and_failure_handling.csv")
    report=f"# Phase 11 experimental evaluation\n\n{NOTICE}\n\n## Actually executed experiments\n\nThis report and all listed CSV/PNG outputs were generated by `scripts/run_phase11_experiments.py` from the current preserved artifacts; no model training or threshold selection occurred.\n\n## Key results\n\nDataset: {json.dumps(dataset[0])}. Anomaly performance: {json.dumps(perf[0])}. Determinism: {json.dumps(deterministic[0])}.\n\n## Outputs\n\nTables: `tables/table_1_dataset_summary.csv` through `tables/table_8_invalid_and_failure_handling.csv`. Figures: `figures/figure_1_confusion_matrix.png` through `figures/figure_5_latency.png`.\n\n## Methodology and limitations\n\nHeld-out anomaly metrics use the already selected Phase 5.5 threshold; it is never selected on test data. API scenarios use actual TestClient endpoint responses. Timing uses local in-process prototype execution (`perf_counter_ns`), not network latency. The controlled synthetic dataset, prototype geofences, small scenario counts, and fixed prototype configurations prevent real-world safety or tourist-behaviour conclusions.\n"
    (RESULTS / "PHASE_11_EXPERIMENTAL_EVALUATION.md").write_text(report,encoding="utf-8")
    print(json.dumps({"dataset":dataset[0],"performance":perf[0],"tables":8,"figures":5},indent=2))
if __name__ == "__main__": main()
