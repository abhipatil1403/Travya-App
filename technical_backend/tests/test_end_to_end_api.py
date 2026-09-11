import random, sys, unittest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(ROOT / "scripts"))
from app.main import app
import generate_controlled_trajectories as generator

client = TestClient(app)
def payload(scenario, lat, lon):
    events, _ = generator.build_trajectory(900, scenario, random.Random(42))
    for event in events: event.pop("event_type")
    return {"events": events, "current_latitude": lat, "current_longitude": lon}

class EndToEndApiTests(unittest.TestCase):
    def test_health_and_status(self):
        self.assertEqual(client.get("/health").status_code, 200)
        self.assertEqual(client.get("/api/v1/status").status_code, 200)
    def test_controlled_cases_response_schema_and_determinism(self):
        for scenario, lat, lon in (("normal_tourist_movement", 12.97, 77.59), ("high_speed_abnormal_movement", 12.97, 77.59), ("normal_tourist_movement", 12.99, 77.62), ("high_speed_abnormal_movement", 12.99, 77.62), ("large_route_deviation", 12.98, 77.61)):
            with self.subTest(scenario=scenario):
                request = payload(scenario, lat, lon); first, second = client.post("/api/v1/risk-assessment", json=request), client.post("/api/v1/risk-assessment", json=request)
                self.assertEqual(first.status_code, 200); self.assertEqual(first.json(), second.json())
                body = first.json(); self.assertEqual(len(body["features"]), 8); self.assertIn("ml_risk", body["anomaly_detection"]); self.assertIn("final_risk", body["risk_assessment"]); self.assertIn("safety_score", body["safety_assessment"])
    def test_invalid_request_inputs(self):
        invalid_coordinate = payload("normal_tourist_movement", 91, 77)
        missing_event = payload("normal_tourist_movement", 12.97, 77.59); del missing_event["events"][0]["actual_mode"]
        invalid_number = payload("normal_tourist_movement", 12.97, 77.59); invalid_number["events"][1]["segment_distance_km"] = -1
        for request in (invalid_coordinate, missing_event, invalid_number):
            with self.subTest(): self.assertEqual(client.post("/api/v1/risk-assessment", json=request).status_code, 422)
    def test_missing_model_and_normalizer_return_service_error(self):
        request = payload("normal_tourist_movement", 12.97, 77.59)
        with patch("app.api.v1.calibrated_infer", side_effect=FileNotFoundError("model unavailable")):
            response = client.post("/api/v1/risk-assessment", json=request)
            self.assertEqual(response.status_code, 503); self.assertEqual(response.json()["detail"]["error"], "required_artifact_unavailable")
