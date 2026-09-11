"""Risk fusion without changing anomaly detection or geofencing behaviour."""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any, Mapping

ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "risk_fusion" / "fusion_config.json"

class RiskFusionValidationError(ValueError): pass

def _risk(value: Any, name: str) -> float:
    if value is None: raise RiskFusionValidationError(f"Missing {name}")
    try: value = float(value)
    except (TypeError, ValueError) as exc: raise RiskFusionValidationError(f"{name} must be numeric") from exc
    if not math.isfinite(value) or not 0 <= value <= 1: raise RiskFusionValidationError(f"{name} must be finite and within [0, 1]")
    return value

def load_config(path: Path = CONFIG_PATH) -> dict[str, Any]:
    config = json.loads(path.read_text(encoding="utf-8"))
    weights = config.get("weights", {}); ml, geo = weights.get("ml"), weights.get("geofence")
    interaction = config.get("interaction_weight")
    for value, name in ((ml, "weights.ml"), (geo, "weights.geofence"), (interaction, "interaction_weight")):
        if not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0: raise RiskFusionValidationError(f"Invalid configuration {name}")
    if not math.isclose(float(ml) + float(geo) + float(interaction), 1.0, abs_tol=1e-12):
        raise RiskFusionValidationError("Fusion weights must sum to 1")
    thresholds = config.get("risk_level_thresholds", {}); medium, high = thresholds.get("medium"), thresholds.get("high")
    if not isinstance(medium, (int, float)) or not isinstance(high, (int, float)) or not 0 < medium < high < 1:
        raise RiskFusionValidationError("Risk level thresholds must satisfy 0 < medium < high < 1")
    return config

def normalize_ml_score(anomaly_score: Any, normalizer: Mapping[str, Any]) -> float:
    """Clip min-max normalization based strictly on separately saved training scores."""
    try: score, low, high = float(anomaly_score), float(normalizer["training_score_min"]), float(normalizer["training_score_max"])
    except (KeyError, TypeError, ValueError) as exc: raise RiskFusionValidationError("Invalid ML score normalizer") from exc
    if not all(math.isfinite(value) for value in (score, low, high)) or high <= low: raise RiskFusionValidationError("Invalid ML score or normalizer bounds")
    return min(1.0, max(0.0, (score - low) / (high - low)))

def fuse_risks(ml_result: Mapping[str, Any], geofence_result: Mapping[str, Any], config: Mapping[str, Any] | None = None) -> dict[str, Any]:
    """Fuse existing normalized component results with documented configuration."""
    if ml_result is None: raise RiskFusionValidationError("Missing ML result")
    if geofence_result is None: raise RiskFusionValidationError("Missing geofence result")
    config = dict(config) if config is not None else load_config()
    weights = config.get("weights", {}); interaction = config.get("interaction_weight")
    total = sum(weights.get(key, float("nan")) for key in ("ml", "geofence")) + (interaction if isinstance(interaction, (int, float)) else float("nan"))
    if not all(isinstance(weights.get(key), (int, float)) and math.isfinite(weights[key]) and weights[key] >= 0 for key in ("ml", "geofence")) or not isinstance(interaction, (int, float)) or not math.isfinite(interaction) or interaction < 0 or not math.isclose(total, 1.0, abs_tol=1e-12): raise RiskFusionValidationError("Invalid configuration weights")
    thresholds = config.get("risk_level_thresholds", {}); medium, high = thresholds.get("medium"), thresholds.get("high")
    if not isinstance(medium, (int, float)) or not isinstance(high, (int, float)) or not 0 < medium < high < 1: raise RiskFusionValidationError("Invalid risk level thresholds")
    ml_risk = _risk(ml_result.get("ml_risk"), "ml_risk")
    geofence_risk = _risk(geofence_result.get("geofence_risk"), "geofence_risk")
    interaction = float(interaction)
    ml_contribution, geo_contribution = float(weights["ml"]) * ml_risk, float(weights["geofence"]) * geofence_risk
    interaction_contribution = interaction * ml_risk * geofence_risk
    final = ml_contribution + geo_contribution + interaction_contribution
    # Weights sum to 1 and product is <= each component, so this must hold; assert it anyway.
    final = _risk(final, "final_risk")
    level = "HIGH" if final >= thresholds["high"] else "MEDIUM" if final >= thresholds["medium"] else "LOW"
    return {"ml_risk": ml_risk, "geofence_risk": geofence_risk, "final_risk": final, "risk_level": level,
            "fusion_formula_version": config["formula_version"], "component_contributions": {"ml": ml_contribution, "geofence": geo_contribution, "interaction": interaction_contribution},
            "reason": "controlled_prototype_weighted_fusion", "geofence_id": geofence_result.get("geofence_id"), "geofence_zone": geofence_result.get("zone")}
