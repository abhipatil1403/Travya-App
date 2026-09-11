# Explainable Dynamic Safety Score

## Purpose, inputs, and semantics

This module uses actual risk-fusion fields: `final_risk`, `ml_risk`, and `geofence_risk`. It produces a controlled-prototype indicator where `0` means the least safe prototype state and `100` the safest. It is not a clinically, legally, or universally validated real-world safety measurement.

## Formula and configuration

The simplest defensible method is used because it does not double-count component risks already combined by fusion: `safety_score = round(100 × (1 - final_risk), 1)`. All parameters live in [safety_score_config.json](safety_score_config.json): score range 0–100, one-decimal rounding, formula version, and prototype category thresholds. `SAFE >= 67`, `CAUTION >= 34`, otherwise `UNSAFE`; these are controlled prototype thresholds only.

## Invariants and explainability

The score is bounded [0,100], deterministic, and monotonic: higher `final_risk` can never increase safety score, while lower risk can never decrease it. Output returns score/category, the three referenced risk values, formula/version, range/rounding/threshold metadata, and explanation text. This permits a user-facing explanation of score change without claiming a new ML prediction.

## Invalid input and limitations

Missing/null/non-numeric/non-finite `final_risk`, or values outside [0,1], raise `SafetyScoreValidationError`; they never become a high score. This is limited by controlled synthetic data, prototype geofences, fusion configuration, rounding, and lack of real-world validation. It does not train ML, expose a frontend feature, or dispatch SOS.
