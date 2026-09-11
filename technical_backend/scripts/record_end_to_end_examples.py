"""Save actual controlled endpoint outputs after the Phase 9 API is available."""
from __future__ import annotations
import random, sys
from pathlib import Path
from fastapi.testclient import TestClient
ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(ROOT / "scripts"))
from app.main import app
import generate_controlled_trajectories as generator

def request(scenario, latitude, longitude):
    events, _ = generator.build_trajectory(901, scenario, random.Random(42))
    for event in events: event.pop("event_type")
    return {"events": events, "current_latitude": latitude, "current_longitude": longitude}

if __name__ == "__main__":
    client = TestClient(app); scenarios = [("Normal trajectory + SAFE zone", "normal_tourist_movement", 12.97, 77.59), ("Anomalous trajectory + SAFE zone", "high_speed_abnormal_movement", 12.97, 77.59), ("Normal trajectory + DANGER zone", "normal_tourist_movement", 12.99, 77.62), ("Anomalous trajectory + DANGER zone", "high_speed_abnormal_movement", 12.99, 77.62)]
    lines = ["# Controlled Prototype End-to-End Examples", "", "Generated from actual local API execution. These are not real tourist incidents."]
    for name, scenario, lat, lon in scenarios:
        response = client.post("/api/v1/risk-assessment", json=request(scenario, lat, lon)); response.raise_for_status(); data = response.json()
        lines += [f"\n## {name}", "", "```json", __import__("json").dumps(data, indent=2), "```"]
    target = ROOT / "results"; target.mkdir(exist_ok=True); (target / "END_TO_END_CONTROLLED_EXAMPLES.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Created results/END_TO_END_CONTROLLED_EXAMPLES.md")
