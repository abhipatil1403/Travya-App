"""Future backend interface: inputs already produced by existing components."""
from typing import Any, Mapping
from .engine import fuse_risks, normalize_ml_score

def fuse_component_outputs(anomaly_output: Mapping[str, Any], geofence_output: Mapping[str, Any], normalizer: Mapping[str, Any]) -> dict[str, Any]:
    """Adapt real component fields without retraining or altering either subsystem."""
    if anomaly_output is None or "anomaly_score" not in anomaly_output: raise ValueError("Anomaly output must include anomaly_score")
    ml_result = {"ml_risk": normalize_ml_score(anomaly_output["anomaly_score"], normalizer)}
    return fuse_risks(ml_result, geofence_output)
