import json, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
from app.risk_fusion.engine import RiskFusionValidationError, fuse_risks, normalize_ml_score

CONFIG = json.loads((ROOT / "risk_fusion" / "fusion_config.json").read_text())
def fused(ml, geo): return fuse_risks({"ml_risk": ml}, {"geofence_risk": geo, "zone": "SAFE"}, CONFIG)

class RiskFusionTests(unittest.TestCase):
    def test_low_ml_safe(self): self.assertEqual(fused(.1, 0)["risk_level"], "LOW")
    def test_high_ml_safe(self): self.assertEqual(fused(1, 0)["risk_level"], "MEDIUM")
    def test_low_ml_danger(self): self.assertEqual(fused(0, 1)["risk_level"], "MEDIUM")
    def test_high_ml_danger(self): self.assertEqual(fused(1, 1)["risk_level"], "HIGH")
    def test_medium_warning(self): self.assertEqual(fused(.5, .5)["risk_level"], "MEDIUM")
    def test_exact_medium_boundary(self): self.assertEqual(fused(0, .85)["risk_level"], "MEDIUM")
    def test_below_boundary(self): self.assertEqual(fused(0, .849)["risk_level"], "LOW")
    def test_above_boundary(self): self.assertEqual(fused(.57, 1)["risk_level"], "HIGH")
    def test_missing_ml_rejected(self):
        with self.assertRaises(RiskFusionValidationError): fuse_risks(None, {"geofence_risk": 0}, CONFIG)
    def test_missing_geofence_rejected(self):
        with self.assertRaises(RiskFusionValidationError): fuse_risks({"ml_risk": 0}, None, CONFIG)
    def test_invalid_ml_rejected(self):
        with self.assertRaises(RiskFusionValidationError): fused(-.1, 0)
    def test_invalid_geo_rejected(self):
        with self.assertRaises(RiskFusionValidationError): fused(0, float("nan"))
    def test_invalid_weights_rejected(self):
        invalid = {**CONFIG, "weights": {"ml": .8, "geofence": .4}}
        with self.assertRaises(RiskFusionValidationError): fuse_risks({"ml_risk": 0}, {"geofence_risk": 0}, invalid)
    def test_output_in_range(self): self.assertTrue(0 <= fused(1, 1)["final_risk"] <= 1)
    def test_deterministic(self): self.assertEqual(fused(.4, .5), fused(.4, .5))
    def test_training_minmax_normalization(self):
        self.assertEqual(normalize_ml_score(-2, {"training_score_min": -1, "training_score_max": 1}), 0)
        self.assertEqual(normalize_ml_score(2, {"training_score_min": -1, "training_score_max": 1}), 1)
