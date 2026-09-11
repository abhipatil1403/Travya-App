"""Versioned end-to-end technical API; orchestration only, no duplicate math."""
from __future__ import annotations
from typing import Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from app.anomaly_detection.calibrated_inference import artifact_status, calibrated_infer
from app.feature_extraction.trajectory_features import extract_features
from app.geofencing.engine import GeofenceValidationError, evaluate_geofence
from app.risk_fusion.engine import RiskFusionValidationError, fuse_risks
from app.safety_score.engine import SafetyScoreValidationError, calculate_safety_score

router = APIRouter(prefix="/api/v1", tags=["risk-assessment"])

class TrajectoryEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    trajectory_id: str = Field(min_length=1); event_index: int = Field(ge=0)
    timestamp_minutes: float = Field(ge=0); latitude: float; longitude: float
    planned_latitude: float; planned_longitude: float; actual_mode: str = Field(min_length=1); planned_mode: str = Field(min_length=1)
    segment_distance_km: float = Field(ge=0); idle_minutes: float = Field(ge=0); fare_amount: float = Field(ge=0); scheduled_arrival_minutes: float = Field(ge=0)

class RiskAssessmentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    events: list[TrajectoryEvent] = Field(min_length=2)
    current_latitude: float
    current_longitude: float

@router.get("/status")
async def backend_status() -> dict[str, Any]:
    return {"status": "ok", "calibrated_artifacts": artifact_status(), "geofence_configuration_available": True}

@router.post("/risk-assessment")
async def risk_assessment(request: RiskAssessmentRequest) -> dict[str, Any]:
    """Orchestrate already-defined components and return no fallback risk values."""
    try:
        features = extract_features([event.model_dump() for event in request.events])
        anomaly = calibrated_infer(features)
        geofence = evaluate_geofence(request.current_latitude, request.current_longitude)
        fusion = fuse_risks({"ml_risk": anomaly["ml_risk"]}, geofence)
        safety = calculate_safety_score(fusion)
    except (ValueError, GeofenceValidationError, RiskFusionValidationError, SafetyScoreValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail={"error": "invalid_component_input", "message": str(exc)}) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error": "required_artifact_unavailable", "message": str(exc)}) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "component_integration_failure", "message": "Risk assessment component failed."}) from exc
    return {"features": features, "anomaly_detection": anomaly, "geofencing": geofence,
            "risk_assessment": {key: fusion[key] for key in ("final_risk", "risk_level", "fusion_formula_version", "component_contributions")},
            "safety_assessment": {key: safety[key] for key in ("safety_score", "safety_category", "score_formula_version")},
            "explanation": {"anomaly_status": anomaly["anomaly_status"], "geofence_reason": geofence["reason"], "fusion_reason": fusion["reason"], "safety_explanation": safety["explanation"]}}
