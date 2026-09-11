import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.geofencing.engine import GeofenceValidationError, calculate_distance_meters, evaluate_geofence

class GeofencingTests(unittest.TestCase):
    def test_inside_safe(self):
        self.assertEqual(evaluate_geofence(12.9700, 77.5900)["zone"], "SAFE")
    def test_inside_warning(self):
        self.assertEqual(evaluate_geofence(12.9800, 77.6100)["zone"], "WARNING")
    def test_inside_danger(self):
        self.assertEqual(evaluate_geofence(12.9900, 77.6200)["zone"], "DANGER")
    def test_outside_all_geofences(self):
        self.assertEqual(evaluate_geofence(0, 0)["reason"], "outside_all_controlled_prototype_geofences")
    def test_exact_boundary_is_inside(self):
        # One degree latitude is Earth-radius based, matching the engine's Haversine calculation.
        boundary_latitude = 12.9700 + math.degrees(400 / 6_371_008.8)
        self.assertEqual(evaluate_geofence(boundary_latitude, 77.5900)["zone"], "SAFE")
    def test_near_boundary_is_inside(self):
        boundary_latitude = 12.9700 + math.degrees(400 / 6_371_008.8)
        self.assertEqual(evaluate_geofence(boundary_latitude - math.degrees(0.1 / 6_371_008.8), 77.5900)["zone"], "SAFE")
    def test_overlap_uses_highest_risk(self):
        result = evaluate_geofence(12.9900, 77.6200)
        self.assertIn("prototype-warning-overlap-01", result["matched_geofences"])
        self.assertEqual(result["geofence_id"], "prototype-danger-01")
    def test_distance_is_geographical(self):
        self.assertAlmostEqual(calculate_distance_meters(0, 0, 0, 0), 0.0)
        self.assertGreater(calculate_distance_meters(0, 0, 0, 0.01), 1000)
    def test_missing_latitude_rejected(self):
        with self.assertRaises(GeofenceValidationError): evaluate_geofence(None, 77)
    def test_missing_longitude_rejected(self):
        with self.assertRaises(GeofenceValidationError): evaluate_geofence(12, None)
    def test_non_numeric_rejected(self):
        with self.assertRaises(GeofenceValidationError): evaluate_geofence("north", 77)
    def test_invalid_latitude_rejected(self):
        with self.assertRaises(GeofenceValidationError): evaluate_geofence(91, 77)
    def test_invalid_longitude_rejected(self):
        with self.assertRaises(GeofenceValidationError): evaluate_geofence(12, 181)
    def test_null_like_nan_rejected(self):
        with self.assertRaises(GeofenceValidationError): evaluate_geofence(float("nan"), 77)
