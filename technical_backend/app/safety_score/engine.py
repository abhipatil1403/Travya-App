"""Bounded, monotonic Safety Score transformation; no ML is trained here."""
from __future__ import annotations
import json, math
from pathlib import Path
from typing import Any, Mapping

ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "safety_score" / "safety_score_config.json"
class SafetyScoreValidationError(ValueError): pass

def load_config(path: Path = CONFIG_PATH) -> dict[str, Any]:
    config = json.loads(path.read_text(encoding="utf-8"))
    low, high = config.get("score_min"), config.get("score_max")
    thresholds = config.get("category_thresholds", {}); safe, caution = thresholds.get("safe_minimum"), thresholds.get("caution_minimum")
    if not all(isinstance(value, (int, float)) and math.isfinite(value) for value in (low, high, safe, caution)) or not low < caution < safe <= high:
        raise SafetyScoreValidationError("Invalid Safety Score configuration")
    return config

def _risk(value: Any) -> float:
    if value is None: raise SafetyScoreValidationError("Missing final_risk")
    try: value = float(value)
    except (TypeError, ValueError) as exc: raise SafetyScoreValidationError("final_risk must be numeric") from exc
    if not math.isfinite(value) or not 0 <= value <= 1: raise SafetyScoreValidationError("final_risk must be finite and within [0, 1]")
    return value

def calculate_safety_score(fusion_result: Mapping[str, Any], config: Mapping[str, Any] | None = None) -> dict[str, Any]:
    """Convert actual risk-fusion fields into a deterministic inverse-risk score."""
    if fusion_result is None: raise SafetyScoreValidationError("Missing risk fusion result")
    config = dict(config) if config is not None else load_config()
    low, high = float(config["score_min"]), float(config["score_max"])
    thresholds = config["category_thresholds"]
    if not low < float(thresholds["caution_minimum"]) < float(thresholds["safe_minimum"]) <= high: raise SafetyScoreValidationError("Invalid Safety Score configuration")
    risk = _risk(fusion_result.get("final_risk"))
    places = int(config["rounding_decimal_places"])
    score = round(high - (high - low) * risk, places)
    score = min(high, max(low, score))
    category = "SAFE" if score >= thresholds["safe_minimum"] else "CAUTION" if score >= thresholds["caution_minimum"] else "UNSAFE"
    return {"safety_score": score, "safety_category": category, "final_risk_used": risk,
            "ml_risk_reference": fusion_result.get("ml_risk"), "geofence_risk_reference": fusion_result.get("geofence_risk"),
            "score_formula_version": config["formula_version"],
            "calculation_metadata": {"formula": config["transformation"], "score_range": [low, high], "rounding_decimal_places": places, "category_thresholds": thresholds},
            "explanation": "Safety Score is the controlled-prototype inverse of final_risk; higher fused risk lowers the score."}
