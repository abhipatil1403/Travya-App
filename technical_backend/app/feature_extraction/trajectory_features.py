"""The single authoritative implementation of the eight trajectory features."""

from __future__ import annotations

import math
from typing import Mapping, Sequence

FEATURE_ORDER = (
    "distance_time_ratio", "avg_speed", "route_deviation_percent", "total_idle_minutes",
    "fare_distance_ratio", "itinerary_deviation_km", "transport_mode_mismatch", "schedule_delay_minutes",
)
REQUIRED_FIELDS = (
    "trajectory_id", "event_index", "timestamp_minutes", "latitude", "longitude",
    "planned_latitude", "planned_longitude", "actual_mode", "planned_mode",
    "segment_distance_km", "idle_minutes", "fare_amount", "scheduled_arrival_minutes",
)


def haversine_km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    radius = 6371.0088
    phi1, phi2 = math.radians(a_lat), math.radians(b_lat)
    d_phi, d_lambda = phi2 - phi1, math.radians(b_lon - a_lon)
    value = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def _number(event: Mapping[str, object], field: str) -> float:
    value = event.get(field)
    if value is None or value == "":
        raise ValueError(f"Missing required field '{field}'")
    try:
        value = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Field '{field}' must be numeric") from exc
    if not math.isfinite(value):
        raise ValueError(f"Field '{field}' must be finite")
    return value


def validate_events(events: Sequence[Mapping[str, object]]) -> list[Mapping[str, object]]:
    """Validate raw events and return them in event-index order."""
    if len(events) < 2:
        raise ValueError("At least two trajectory events are required")
    for event in events:
        missing = [field for field in REQUIRED_FIELDS if event.get(field) is None or event.get(field) == ""]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")
        if not str(event["actual_mode"]).strip() or not str(event["planned_mode"]).strip():
            raise ValueError("Transport modes must be non-empty")
        lat, lon = _number(event, "latitude"), _number(event, "longitude")
        p_lat, p_lon = _number(event, "planned_latitude"), _number(event, "planned_longitude")
        if not -90 <= lat <= 90 or not -90 <= p_lat <= 90 or not -180 <= lon <= 180 or not -180 <= p_lon <= 180:
            raise ValueError("Coordinates must be within latitude [-90, 90] and longitude [-180, 180]")
        for field in ("segment_distance_km", "idle_minutes", "fare_amount", "timestamp_minutes", "scheduled_arrival_minutes"):
            if _number(event, field) < 0:
                raise ValueError(f"Field '{field}' must be non-negative")
    ordered = sorted(events, key=lambda item: _number(item, "event_index"))
    indices = [_number(event, "event_index") for event in ordered]
    times = [_number(event, "timestamp_minutes") for event in ordered]
    if len(set(indices)) != len(indices):
        raise ValueError("event_index values must be unique")
    if any(later < earlier for earlier, later in zip(times, times[1:])):
        raise ValueError("timestamp_minutes must be non-decreasing")
    if times[-1] <= times[0]:
        raise ValueError("Elapsed time must be greater than zero")
    return ordered


def extract_features(events: Sequence[Mapping[str, object]]) -> dict[str, float | int]:
    """Derive all eight features in FEATURE_ORDER from validated raw events."""
    events = validate_events(events)
    total_distance = sum(_number(event, "segment_distance_km") for event in events)
    elapsed = _number(events[-1], "timestamp_minutes") - _number(events[0], "timestamp_minutes")
    idle = sum(_number(event, "idle_minutes") for event in events)
    moving = elapsed - idle
    if moving <= 0:
        raise ValueError("Moving time must be greater than zero after idle time is removed")
    planned_distance = sum(haversine_km(_number(a, "planned_latitude"), _number(a, "planned_longitude"), _number(b, "planned_latitude"), _number(b, "planned_longitude")) for a, b in zip(events, events[1:]))
    if planned_distance <= 0:
        raise ValueError("Planned route distance must be greater than zero")
    route_deviation = max(haversine_km(_number(event, "latitude"), _number(event, "longitude"), _number(event, "planned_latitude"), _number(event, "planned_longitude")) for event in events)
    final = events[-1]
    fare = _number(final, "fare_amount")
    if total_distance <= 0 and fare > 0:
        raise ValueError("Cannot calculate fare-distance ratio with fare and zero distance")
    return {
        "distance_time_ratio": round(total_distance / elapsed, 6),
        "avg_speed": round(total_distance / moving * 60, 6),
        "route_deviation_percent": round(route_deviation / planned_distance * 100, 6),
        "total_idle_minutes": round(idle, 6),
        "fare_distance_ratio": round(fare / total_distance, 6) if total_distance else 0.0,
        "itinerary_deviation_km": round(haversine_km(_number(final, "latitude"), _number(final, "longitude"), _number(final, "planned_latitude"), _number(final, "planned_longitude")), 6),
        "transport_mode_mismatch": int(str(final["actual_mode"]) != str(final["planned_mode"])),
        "schedule_delay_minutes": round(_number(final, "timestamp_minutes") - _number(final, "scheduled_arrival_minutes"), 6),
    }


def feature_vector(features: Mapping[str, float | int]) -> list[float]:
    """Return validated model input in the fixed order, rejecting absent fields."""
    return [float(features[name]) for name in FEATURE_ORDER]
