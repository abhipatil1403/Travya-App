"""Create deterministic Synthetic Controlled Evaluation Data for TRAVYA.

This generator creates trajectory events first and derives research features
afterwards. It is for controlled prototype evaluation only, never real people
or real tourist GPS data.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import math
import random
import sys
from collections import Counter
from pathlib import Path
from typing import Iterable

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.feature_extraction.trajectory_features import FEATURE_ORDER, extract_features, haversine_km, validate_events

SEED = 20260911
NORMAL_COUNT = 150
ANOMALY_COUNT_PER_TYPE = 20
ANOMALY_TYPES = (
    "high_speed_abnormal_movement",
    "large_route_deviation",
    "excessive_idle_duration",
    "fare_distance_inconsistency",
    "large_itinerary_deviation",
    "transport_mode_mismatch",
    "significant_schedule_delay",
)
ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"

EVENT_FIELDS = [
    "trajectory_id", "event_index", "event_type", "timestamp_minutes", "latitude",
    "longitude", "planned_latitude", "planned_longitude", "actual_mode", "planned_mode",
    "segment_distance_km", "idle_minutes", "fare_amount", "scheduled_arrival_minutes",
]
MANIFEST_FIELDS = ["trajectory_id", "label", "scenario", "anomaly_reason"]
FEATURE_FIELDS = ["trajectory_id", *FEATURE_ORDER, "label", "scenario"]


def _point(origin: tuple[float, float], destination: tuple[float, float], fraction: float, offset_km: float) -> tuple[float, float]:
    lat = origin[0] + (destination[0] - origin[0]) * fraction
    lon = origin[1] + (destination[1] - origin[1]) * fraction
    # An east/west perpendicular controlled offset, adequate for local synthetic paths.
    return lat, lon + offset_km / (111.32 * max(math.cos(math.radians(lat)), 0.1))


def build_trajectory(identifier: int, scenario: str, rng: random.Random) -> tuple[list[dict[str, object]], dict[str, object]]:
    origin = (12.935 + rng.uniform(-0.03, 0.03), 77.605 + rng.uniform(-0.03, 0.03))
    destination = (12.980 + rng.uniform(-0.03, 0.03), 77.645 + rng.uniform(-0.03, 0.03))
    planned_mode = rng.choice(["taxi", "bus", "walk"])
    base_speed = {"taxi": 27, "bus": 18, "walk": 4.8}[planned_mode]
    actual_mode = planned_mode
    speed = base_speed * rng.uniform(0.88, 1.12)
    route_offset = rng.uniform(0.02, 0.12)
    idle = rng.uniform(0, 4)
    fare_multiplier = {"taxi": 16, "bus": 4, "walk": 0}[planned_mode] * rng.uniform(0.9, 1.1)
    itinerary_offset = rng.uniform(0.01, 0.18)
    delay = rng.uniform(-3, 8)
    reason = "Normal controlled trajectory generated within planned route, mode and schedule tolerances."
    label = 0

    if scenario == "high_speed_abnormal_movement":
        speed = rng.uniform(95, 135); reason = "Average speed intentionally exceeds controlled tourist transport range."
    elif scenario == "large_route_deviation":
        route_offset = rng.uniform(2.0, 4.0); reason = "Actual path is intentionally displaced far from the planned route."
    elif scenario == "excessive_idle_duration":
        idle = rng.uniform(55, 100); reason = "A prolonged stationary event is intentionally inserted."
    elif scenario == "fare_distance_inconsistency":
        fare_multiplier = rng.choice([rng.uniform(0.2, 0.45), rng.uniform(35, 55)]); reason = "Fare is intentionally inconsistent with travelled distance."
    elif scenario == "large_itinerary_deviation":
        itinerary_offset = rng.uniform(3.5, 7.0); reason = "Destination is intentionally far from the itinerary destination."
    elif scenario == "transport_mode_mismatch":
        actual_mode = {"taxi": "walk", "bus": "taxi", "walk": "bus"}[planned_mode]; reason = "Actual transport mode intentionally differs from the planned mode."
    elif scenario == "significant_schedule_delay":
        delay = rng.uniform(75, 150); reason = "Arrival is intentionally delayed beyond the controlled schedule tolerance."
    else:
        scenario = "normal_tourist_movement"

    label = int(scenario != "normal_tourist_movement")
    planned_distance = haversine_km(*origin, *destination)
    actual_distance = planned_distance * (1 + route_offset / max(planned_distance, 0.1))
    travel_minutes = actual_distance / speed * 60
    scheduled_arrival = 540 + planned_distance / base_speed * 60
    event_rows: list[dict[str, object]] = []
    last_actual = origin
    for index in range(5):
        fraction = index / 4
        planned = _point(origin, destination, fraction, 0)
        # Route curvature and destination/itinerary deviation originate in the
        # event geometry; the latter is non-zero at the final event.
        actual = _point(
            origin,
            destination,
            fraction,
            route_offset * math.sin(math.pi * fraction) + itinerary_offset * fraction,
        )
        segment = 0.0 if index == 0 else haversine_km(*last_actual, *actual)
        event_rows.append({
            "trajectory_id": f"SCTD-{identifier:04d}", "event_index": index,
            "event_type": "idle" if index == 2 and idle > 10 else "location",
            "timestamp_minutes": round(540 + (travel_minutes + delay) * fraction + (idle if index >= 2 else 0), 3),
            "latitude": round(actual[0], 7), "longitude": round(actual[1], 7),
            "planned_latitude": round(planned[0], 7), "planned_longitude": round(planned[1], 7),
            "actual_mode": actual_mode, "planned_mode": planned_mode,
            "segment_distance_km": round(segment, 6), "idle_minutes": round(idle if index == 2 else 0, 3),
            "fare_amount": round(actual_distance * fare_multiplier if index == 4 else 0, 2),
            "scheduled_arrival_minutes": round(scheduled_arrival, 3),
        })
        last_actual = actual
    return event_rows, {"trajectory_id": f"SCTD-{identifier:04d}", "label": label, "scenario": scenario, "anomaly_reason": reason}


def derive_features(events: list[dict[str, object]], manifest: dict[str, object]) -> dict[str, object]:
    return {"trajectory_id": manifest["trajectory_id"], **extract_features(events), "label": manifest["label"], "scenario": manifest["scenario"]}


def csv_text(fields: list[str], rows: Iterable[dict[str, object]]) -> str:
    from io import StringIO
    output = StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=fields, lineterminator="\n")
    writer.writeheader(); writer.writerows(rows)
    return output.getvalue()


def write_preserving_raw(path: Path, content: str, replace_raw: bool) -> None:
    if path.exists() and not replace_raw:
        if path.read_text(encoding="utf-8") != content:
            raise RuntimeError(f"Refusing to overwrite existing raw data: {path}. Use --replace-raw only for intentional regeneration.")
        return
    path.write_text(content, encoding="utf-8", newline="")


def validate(events: list[dict[str, object]], features: list[dict[str, object]]) -> None:
    """Fail generation if the controlled data violates basic physical checks."""
    grouped: dict[str, list[dict[str, object]]] = {}
    for event in events:
        grouped.setdefault(str(event["trajectory_id"]), []).append(event)
    for trajectory_events in grouped.values():
        validate_events(trajectory_events)
    for feature in features:
        if any(value is None or value == "" for value in feature.values()):
            raise ValueError("Missing value in derived feature data")
        for field in ("distance_time_ratio", "avg_speed", "route_deviation_percent", "total_idle_minutes", "itinerary_deviation_km", "schedule_delay_minutes"):
            if float(feature[field]) < 0 and field != "schedule_delay_minutes":
                raise ValueError(f"Negative derived value for {field}")


def generate(replace_raw: bool = False) -> dict[str, object]:
    rng = random.Random(SEED)
    scenarios = ["normal_tourist_movement"] * NORMAL_COUNT + [name for name in ANOMALY_TYPES for _ in range(ANOMALY_COUNT_PER_TYPE)]
    raw_events, manifests, features = [], [], []
    for identifier, scenario in enumerate(scenarios, start=1):
        events, manifest = build_trajectory(identifier, scenario, rng)
        raw_events.extend(events); manifests.append(manifest); features.append(derive_features(events, manifest))
    validate(raw_events, features)
    RAW_DIR.mkdir(parents=True, exist_ok=True); PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    write_preserving_raw(RAW_DIR / "trajectory_events.csv", csv_text(EVENT_FIELDS, raw_events), replace_raw)
    write_preserving_raw(RAW_DIR / "trajectory_manifest.csv", csv_text(MANIFEST_FIELDS, manifests), replace_raw)
    feature_text = csv_text(FEATURE_FIELDS, features)
    (PROCESSED_DIR / "trajectory_features.csv").write_text(feature_text, encoding="utf-8", newline="")
    summary = {
        "dataset_type": "Synthetic Controlled Evaluation Data", "random_seed": SEED,
        "trajectories": len(features), "normal": NORMAL_COUNT, "anomalous": len(features) - NORMAL_COUNT,
        "scenario_counts": dict(Counter(str(row["scenario"]) for row in manifests)),
        "validation": "passed: no missing values, invalid coordinates, or negative distances/times",
        "processed_sha256": hashlib.sha256(feature_text.encode("utf-8")).hexdigest(),
    }
    import json
    (PROCESSED_DIR / "dataset_summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Synthetic Controlled Evaluation Data.")
    parser.add_argument("--replace-raw", action="store_true", help="Intentionally replace raw generated data.")
    args = parser.parse_args()
    print(generate(replace_raw=args.replace_raw))
