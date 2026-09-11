# Context-aware risk fusion design

## Purpose and actual input schemas

This module combines existing component outputs; it does not retrain Isolation Forest or modify geofencing. Feature extraction returns the fixed eight-feature dictionary. Isolation Forest inference returns `anomaly_score` (negative `decision_function`, so higher is more anomalous), `raw_model_prediction`, `normalized_score` (currently `null`), and `anomaly_status`. The calibrated threshold experiment stores its model/scaler separately. Geofencing returns `geofence_risk`, `zone`, `geofence_id`, name, coordinates, centre/boundary distances, matches, and reason.

## ML risk normalization

`prepare_ml_score_normalizer.py` runs the validation-selected model over **only its training split**, saves training minimum and maximum anomaly scores, then transforms an inference score by `clip((score-min)/(max-min), 0, 1)`. Thus no validation or held-out test score enters the normalizer. Missing, non-finite, or invalid bounds raise a validation error.

## Configuration and equation

The configuration is [fusion_config.json](fusion_config.json). Formula `controlled-prototype-linear-v1` is:

`final_risk = 0.60 × ml_risk + 0.40 × geofence_risk`

Both inputs and final risk are constrained to [0,1]. The interaction weight is `0.0`: no interaction was included because a simple weighted model is more defensible until experimental evidence establishes a justified non-linear effect. Weights and level thresholds `LOW < 0.34`, `MEDIUM < 0.67`, `HIGH >= 0.67` are controlled prototype parameters, not operationally validated safety policy.

## Explainability and invalid inputs

Results include risks, formula version, individual component contributions, level, selected geofence metadata, and reason. Missing component result/risk, null, NaN, infinity, values outside [0,1], invalid normalizer, invalid weights, or invalid thresholds raise `RiskFusionValidationError`; no invalid input silently becomes LOW.

## Limitations

This combines Synthetic Controlled Evaluation Data and controlled prototype geofences. It lacks real tourist validation, calibrated operational thresholds, causal evidence, temporal context, fairness validation, and live incident data. It is not a Dynamic Safety Score, frontend feature, or SOS system.
