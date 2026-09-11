# TRAVYA technical backend

This isolated Python service is the foundation for the TRAVYA technical upgrade. It does not alter the existing React/Vite frontend and does not yet calculate risk scores.

## Runtime

- Python: 3.11 or newer
- FastAPI: 0.115.6
- Uvicorn: 0.34.0
- scikit-learn: 1.6.1
- NumPy: 2.2.1
- Pandas: 2.2.3

Install dependencies from this directory:

```powershell
python -m pip install -r requirements.txt
```

Run the service:

```powershell
python -m uvicorn app.main:app --reload
```

`GET /health` is live. `POST /api/v1/risk-assessment` is intentionally present but returns HTTP 501 until later phases implement the technical pipeline.

## Synthetic Controlled Evaluation Data

Generate the Phase 3 dataset:

```powershell
python scripts/generate_controlled_trajectories.py
```

The generator uses a fixed seed and creates underlying trajectory/event records in `data/raw/`, then derives evaluation features in `data/processed/`. It never presents this data as real-world tourist data. See [data/DATASET_DOCUMENTATION.md](data/DATASET_DOCUMENTATION.md).

## Phase 4–5 commands

```powershell
# Generate data and validate all feature calculations
python scripts/generate_controlled_trajectories.py
python -m unittest discover -s tests -v

# Train only after generation; writes models/ artifacts
python scripts/train_isolation_forest.py

# Calculate metrics from the held-out labelled partition (prints only computed values)
python scripts/evaluate_isolation_forest.py

# Phase 5.5: preserve original artifacts, calibrate only on validation data,
# then evaluate once on the unchanged held-out test partition.
python -m pip install -r requirements.txt
python scripts/threshold_analysis.py

# Phase 6: actual geofencing test execution; writes results/geofencing_test_execution.txt
python scripts/run_geofencing_tests.py

# Phase 7: prepare a train-only ML score normalizer, then execute fusion tests.
python scripts/prepare_ml_score_normalizer.py
python scripts/run_risk_fusion_tests.py

# Phase 8: execute deterministic Safety Score tests.
python scripts/run_safety_score_tests.py

# Phase 9: prepare required train-only normalizer, then execute API integration tests.
python scripts/prepare_ml_score_normalizer.py
python scripts/run_end_to_end_tests.py
python scripts/record_end_to_end_examples.py

# Phase 11: executes reproducible tables and figures from preserved artifacts.
# It does not train, tune, or recalibrate any model component.
python scripts/run_phase11_experiments.py
```

The model consumes the eight features in the exact `FEATURE_ORDER` declared by the feature extraction module and documented in [data/FEATURE_DEFINITIONS.md](data/FEATURE_DEFINITIONS.md). The data is shuffled with fixed seed `20260911`, with the first 70% used for unsupervised training and the remaining 30% held out solely for labelled evaluation. Labels are never included in model inputs. A `StandardScaler` is fitted only on training rows and saved alongside the model. Isolation Forest uses 200 estimators, contamination 0.15, `max_samples="auto"`, `n_jobs=1`, and random state `20260911`.
