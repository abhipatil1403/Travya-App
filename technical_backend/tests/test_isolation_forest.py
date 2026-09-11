import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
from app.anomaly_detection import isolation_forest as detector
from app.feature_extraction.trajectory_features import FEATURE_ORDER


class IsolationForestTests(unittest.TestCase):
    def test_schema_is_fixed(self):
        self.assertEqual(len(FEATURE_ORDER), 8)
        self.assertEqual(detector.PARAMETERS["random_state"], 20260911)

    def test_missing_artifacts_and_invalid_inference_rejected(self):
        with self.assertRaises(FileNotFoundError): detector.load()
        with patch.object(detector, "load", return_value=(object(), object())):
            with self.assertRaises((KeyError, ValueError)):
                detector.infer({"avg_speed": 3})

    def test_train_load_and_infer_output_format(self):
        rows = []
        for index in range(12):
            rows.append({name: float(index + position + 1) for position, name in enumerate(FEATURE_ORDER)})
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            with patch.multiple(detector, MODEL_DIR=directory, MODEL_PATH=directory / "model.joblib",
                                SCALER_PATH=directory / "scaler.joblib", CONFIG_PATH=directory / "config.json",
                                SCHEMA_PATH=directory / "schema.json"):
                detector.train(pd.DataFrame(rows))
                model, scaler = detector.load()
                self.assertIsNotNone(model); self.assertIsNotNone(scaler)
                output = detector.infer(rows[0])
        self.assertEqual(set(output), {"anomaly_score", "raw_model_prediction", "normalized_score", "anomaly_status"})
        self.assertIn(output["raw_model_prediction"], (-1, 1))
