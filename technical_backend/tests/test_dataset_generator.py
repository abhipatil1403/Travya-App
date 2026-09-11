import csv
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import generate_controlled_trajectories as generator


class DatasetGeneratorTests(unittest.TestCase):
    def test_generation_is_deterministic_and_valid(self):
        first = generator.generate()
        second = generator.generate()
        self.assertEqual(first["processed_sha256"], second["processed_sha256"])
        with (generator.PROCESSED_DIR / "trajectory_features.csv").open(newline="", encoding="utf-8") as file:
            rows = list(csv.DictReader(file))
        self.assertEqual(len(rows), 290)
        self.assertFalse(any(not value for row in rows for value in row.values()))
        for row in rows:
            self.assertGreaterEqual(float(row["avg_speed"]), 0)
            self.assertGreaterEqual(float(row["total_idle_minutes"]), 0)
            self.assertGreaterEqual(float(row["itinerary_deviation_km"]), 0)
        with (generator.RAW_DIR / "trajectory_events.csv").open(newline="", encoding="utf-8") as file:
            events = list(csv.DictReader(file))
        self.assertEqual(len(events), 290 * 5)
        for event in events:
            self.assertTrue(-90 <= float(event["latitude"]) <= 90)
            self.assertTrue(-180 <= float(event["longitude"]) <= 180)
            self.assertGreaterEqual(float(event["segment_distance_km"]), 0)
            self.assertGreaterEqual(float(event["timestamp_minutes"]), 0)


if __name__ == "__main__":
    unittest.main()
