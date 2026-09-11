import json, math, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
from app.safety_score.engine import SafetyScoreValidationError, calculate_safety_score
CONFIG = json.loads((ROOT / "safety_score" / "safety_score_config.json").read_text())
def score(risk): return calculate_safety_score({"final_risk": risk, "ml_risk": risk, "geofence_risk": 0}, CONFIG)
class SafetyScoreTests(unittest.TestCase):
    def test_zero_risk(self): self.assertEqual(score(0)["safety_score"], 100)
    def test_full_risk(self): self.assertEqual(score(1)["safety_score"], 0)
    def test_low_risk(self): self.assertEqual(score(.1)["safety_category"], "SAFE")
    def test_medium_risk(self): self.assertEqual(score(.5)["safety_category"], "CAUTION")
    def test_high_risk(self): self.assertEqual(score(.9)["safety_category"], "UNSAFE")
    def test_monotonic(self): self.assertGreaterEqual(score(.2)["safety_score"], score(.8)["safety_score"])
    def test_deterministic(self): self.assertEqual(score(.5), score(.5))
    def test_bounds(self): self.assertTrue(0 <= score(.2)["safety_score"] <= 100)
    def test_exact_safe_boundary(self): self.assertEqual(score(.33)["safety_category"], "SAFE")
    def test_below_safe_boundary(self): self.assertEqual(score(.331)["safety_category"], "CAUTION")
    def test_above_safe_boundary(self): self.assertEqual(score(.329)["safety_category"], "SAFE")
    def test_missing_rejected(self):
        with self.assertRaises(SafetyScoreValidationError): calculate_safety_score({}, CONFIG)
    def test_nan_rejected(self):
        with self.assertRaises(SafetyScoreValidationError): score(math.nan)
    def test_infinity_rejected(self):
        with self.assertRaises(SafetyScoreValidationError): score(math.inf)
    def test_negative_rejected(self):
        with self.assertRaises(SafetyScoreValidationError): score(-.1)
    def test_above_one_rejected(self):
        with self.assertRaises(SafetyScoreValidationError): score(1.1)
