import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(ROOT / "scripts"))
from app.feature_extraction.trajectory_features import FEATURE_ORDER, extract_features
import generate_controlled_trajectories as generator


class FeatureExtractionTests(unittest.TestCase):
    def events(self, scenario="normal_tourist_movement"):
        return generator.build_trajectory(1, scenario, __import__("random").Random(42))[0]

    def test_all_controlled_scenarios_extract(self):
        for scenario in ("normal_tourist_movement", *generator.ANOMALY_TYPES):
            with self.subTest(scenario=scenario):
                features = extract_features(self.events(scenario))
                self.assertEqual(tuple(features), FEATURE_ORDER)

    def test_scenario_signals(self):
        self.assertGreater(extract_features(self.events("high_speed_abnormal_movement"))["avg_speed"], 90)
        self.assertGreater(extract_features(self.events("large_route_deviation"))["route_deviation_percent"], 1)
        self.assertGreater(extract_features(self.events("excessive_idle_duration"))["total_idle_minutes"], 50)
        fare = extract_features(self.events("fare_distance_inconsistency"))["fare_distance_ratio"]
        self.assertTrue(fare < 1 or fare > 30)
        self.assertGreater(extract_features(self.events("large_itinerary_deviation"))["itinerary_deviation_km"], 3)
        self.assertEqual(extract_features(self.events("transport_mode_mismatch"))["transport_mode_mismatch"], 1)
        self.assertGreater(extract_features(self.events("significant_schedule_delay"))["schedule_delay_minutes"], 70)

    def test_missing_negative_coordinate_and_time_rejected(self):
        cases = [("fare_amount", None), ("segment_distance_km", -1), ("latitude", 91), ("timestamp_minutes", 540)]
        for field, value in cases:
            with self.subTest(field=field):
                events = self.events(); events[-1][field] = value
                with self.assertRaises(ValueError): extract_features(events)

    def test_zero_moving_time_rejected(self):
        events = self.events()
        for event in events: event["idle_minutes"] = 0
        events[-1]["idle_minutes"] = events[-1]["timestamp_minutes"] - events[0]["timestamp_minutes"]
        with self.assertRaises(ValueError): extract_features(events)
