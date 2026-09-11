"""Future backend handoff from existing fusion result to the score layer."""
from typing import Any, Mapping
from .engine import calculate_safety_score
def score_fused_risk(fusion_result: Mapping[str, Any]) -> dict[str, Any]: return calculate_safety_score(fusion_result)
