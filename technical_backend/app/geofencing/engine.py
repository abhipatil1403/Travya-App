"""Circular-geofence evaluation using geographical (not degree-difference) distance."""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

EARTH_RADIUS_METERS = 6_371_008.8
CONFIG_PATH = Path(__file__).resolve().parents[2] / "geofencing" / "prototype_geofences.json"

class GeofenceValidationError(ValueError):
    """Raised for absent, non-numeric, or out-of-range coordinates."""

def _coordinate(value: Any, name: str, low: float, high: float) -> float:
    if value is None or value == "": raise GeofenceValidationError(f"Missing {name}")
    try: value = float(value)
    except (TypeError, ValueError) as exc: raise GeofenceValidationError(f"{name} must be numeric") from exc
    if not math.isfinite(value) or not low <= value <= high: raise GeofenceValidationError(f"{name} must be within [{low}, {high}]")
    return value

def calculate_distance_meters(latitude_1: Any, longitude_1: Any, latitude_2: Any, longitude_2: Any) -> float:
    """Haversine great-circle distance in metres; all coordinates are decimal degrees."""
    lat1, lon1 = _coordinate(latitude_1, "latitude_1", -90, 90), _coordinate(longitude_1, "longitude_1", -180, 180)
    lat2, lon2 = _coordinate(latitude_2, "latitude_2", -90, 90), _coordinate(longitude_2, "longitude_2", -180, 180)
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi, d_lambda = phi2 - phi1, math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return EARTH_RADIUS_METERS * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def load_geofences() -> list[dict[str, Any]]:
    data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    zones = data["geofences"]
    if not zones: raise RuntimeError("Geofence configuration contains no zones")
    return zones

def evaluate_geofence(latitude: Any, longitude: Any) -> dict[str, Any]:
    """Return one deterministic zone result; highest configured risk wins overlaps."""
    latitude = _coordinate(latitude, "latitude", -90, 90); longitude = _coordinate(longitude, "longitude", -180, 180)
    candidates = []
    for zone in load_geofences():
        distance = calculate_distance_meters(latitude, longitude, zone["center_latitude"], zone["center_longitude"])
        if distance <= float(zone["radius_meters"]) + 1e-6: candidates.append((zone, distance))
    if not candidates:
        return {"latitude": latitude, "longitude": longitude, "geofence_id": None, "geofence_name": None,
                "zone": "SAFE", "geofence_risk": 0.0, "distance_to_center_meters": None,
                "distance_to_boundary_meters": None, "matched_geofences": [], "reason": "outside_all_controlled_prototype_geofences"}
    zone, distance = sorted(candidates, key=lambda item: (-float(item[0]["risk_value"]), item[1], item[0]["geofence_id"]))[0]
    return {"latitude": latitude, "longitude": longitude, "geofence_id": zone["geofence_id"], "geofence_name": zone["name"],
            "zone": zone["risk_zone"], "geofence_risk": float(zone["risk_value"]),
            "distance_to_center_meters": round(distance, 6), "distance_to_boundary_meters": round(max(0.0, float(zone["radius_meters"]) - distance), 6),
            "matched_geofences": [item[0]["geofence_id"] for item in candidates], "reason": "inside_controlled_prototype_geofence"}
