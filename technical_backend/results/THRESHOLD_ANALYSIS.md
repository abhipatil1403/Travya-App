# Phase 5.5 threshold analysis

## Original configuration (preserved)

`ORIGINAL_CONFIGURATION` contains the original model, scaler, configuration, schema, split, and executed result. Its default Isolation Forest prediction uses `decision_function < 0` as anomalous (equivalent to `anomaly_score = -decision_function > 0`). The original result was `{"confusion_matrix": [[42, 0], [29, 16]], "precision": 1.0, "recall": 0.35555555555555557, "f1_score": 0.5245901639344263, "false_positive_rate": 0.0, "false_negative_rate": 0.6444444444444445, "roc_auc": 0.9894179894179893}`.

## Score direction and distribution

Higher `anomaly_score` means more anomalous. It is the negative Isolation Forest `decision_function`; this is a custom reporting direction, while the original prediction threshold is the Isolation Forest default at score `0`. The score plot is `score_distribution.png`; normal and anomalous distribution summaries are `{"normal": {"count": 21.0, "mean": -0.154908, "std": 0.007516, "min": -0.166585, "25%": -0.161664, "50%": -0.155129, "75%": -0.148104, "max": -0.138945}, "anomalous": {"count": 20.0, "mean": -0.012031, "std": 0.074218, "min": -0.13949, "25%": -0.084615, "50%": 0.001687, "75%": 0.016742, "max": 0.133644}}`.

## Split and leakage control

The original held-out test set remains identical and untouched. Only its original 203 training samples were shuffled with seed `20260911` and split into a new train/validation partition. Counts and label distribution: `{"test": {"normal": 42, "anomalous": 45}, "train": {"normal": 87, "anomalous": 75}, "validation": {"normal": 21, "anomalous": 20}}`. The scaler and Isolation Forest are fitted only on `train`; labels are used only for validation metric calculation and final evaluation, never model fitting.

## Validation threshold experiment

Thresholds are empirical quantiles of **validation scores only**. Selection rule: maximum validation F1, breaking ties in favor of the lower false-positive rate. This provides a reproducible balance of missed controlled anomalies and unnecessary alerts; it is not a real-world tourist-safety operating policy.

| threshold | precision | recall | f1_score | false_positive_rate | false_negative_rate |
| --- | --- | --- | --- | --- | --- |
| -0.165427 | 0.500000 | 1.000000 | 0.666667 | 0.952381 | 0.000000 |
| -0.163338 | 0.512821 | 1.000000 | 0.677966 | 0.904762 | 0.000000 |
| -0.162572 | 0.526316 | 1.000000 | 0.689655 | 0.857143 | 0.000000 |
| -0.162206 | 0.540541 | 1.000000 | 0.701754 | 0.809524 | 0.000000 |
| -0.162001 | 0.555556 | 1.000000 | 0.714286 | 0.761905 | 0.000000 |
| -0.161470 | 0.571429 | 1.000000 | 0.727273 | 0.714286 | 0.000000 |
| -0.160626 | 0.588235 | 1.000000 | 0.740741 | 0.666667 | 0.000000 |
| -0.159229 | 0.606061 | 1.000000 | 0.754717 | 0.619048 | 0.000000 |
| -0.157630 | 0.625000 | 1.000000 | 0.769231 | 0.571429 | 0.000000 |
| -0.155883 | 0.645161 | 1.000000 | 0.784314 | 0.523810 | 0.000000 |
| -0.155107 | 0.666667 | 1.000000 | 0.800000 | 0.476190 | 0.000000 |
| -0.154889 | 0.689655 | 1.000000 | 0.816327 | 0.428571 | 0.000000 |
| -0.153863 | 0.714286 | 1.000000 | 0.833333 | 0.380952 | 0.000000 |
| -0.151440 | 0.740741 | 1.000000 | 0.851064 | 0.333333 | 0.000000 |
| -0.150195 | 0.769231 | 1.000000 | 0.869565 | 0.285714 | 0.000000 |
| -0.148054 | 0.800000 | 1.000000 | 0.888889 | 0.238095 | 0.000000 |
| -0.147588 | 0.833333 | 1.000000 | 0.909091 | 0.190476 | 0.000000 |
| -0.147368 | 0.869565 | 1.000000 | 0.930233 | 0.142857 | 0.000000 |
| -0.146604 | 0.909091 | 1.000000 | 0.952381 | 0.095238 | 0.000000 |
| -0.143735 | 0.952381 | 1.000000 | 0.975610 | 0.047619 | 0.000000 |
| -0.139490 | 0.952381 | 1.000000 | 0.975610 | 0.047619 | 0.000000 |
| -0.138956 | 0.950000 | 0.950000 | 0.950000 | 0.047619 | 0.050000 |
| -0.094976 | 1.000000 | 0.950000 | 0.974359 | 0.000000 | 0.050000 |
| -0.088420 | 1.000000 | 0.900000 | 0.947368 | 0.000000 | 0.100000 |
| -0.086749 | 1.000000 | 0.850000 | 0.918919 | 0.000000 | 0.150000 |
| -0.086155 | 1.000000 | 0.800000 | 0.888889 | 0.000000 | 0.200000 |
| -0.084358 | 1.000000 | 0.750000 | 0.857143 | 0.000000 | 0.250000 |
| -0.053549 | 1.000000 | 0.700000 | 0.823529 | 0.000000 | 0.300000 |
| -0.045065 | 1.000000 | 0.650000 | 0.787879 | 0.000000 | 0.350000 |
| -0.022771 | 1.000000 | 0.600000 | 0.750000 | 0.000000 | 0.400000 |
| -0.002328 | 1.000000 | 0.550000 | 0.709677 | 0.000000 | 0.450000 |
| 0.001738 | 1.000000 | 0.500000 | 0.666667 | 0.000000 | 0.500000 |
| 0.002376 | 1.000000 | 0.450000 | 0.620690 | 0.000000 | 0.550000 |
| 0.003838 | 1.000000 | 0.400000 | 0.571429 | 0.000000 | 0.600000 |
| 0.007210 | 1.000000 | 0.350000 | 0.518519 | 0.000000 | 0.650000 |
| 0.011030 | 1.000000 | 0.300000 | 0.461538 | 0.000000 | 0.700000 |
| 0.024587 | 1.000000 | 0.250000 | 0.400000 | 0.000000 | 0.750000 |
| 0.032839 | 1.000000 | 0.200000 | 0.333333 | 0.000000 | 0.800000 |
| 0.069472 | 1.000000 | 0.150000 | 0.260870 | 0.000000 | 0.850000 |
| 0.114374 | 1.000000 | 0.100000 | 0.181818 | 0.000000 | 0.900000 |
| 0.132064 | 1.000000 | 0.050000 | 0.095238 | 0.000000 | 0.950000 |

Selected validation threshold: `-0.143735`. No threshold was selected using the held-out test set.

## Final held-out test evaluation

The validation-selected threshold was applied once to the untouched original test partition: `{"threshold": -0.14373467326538011, "precision": 0.8461538461538461, "recall": 0.9777777777777777, "f1_score": 0.9072164948453608, "false_positive_rate": 0.19047619047619047, "false_negative_rate": 0.022222222222222223, "confusion_matrix": [[34, 8], [1, 44]], "roc_auc": 0.9899470899470899}`.

## Comparison with original result

Original default result: `{"confusion_matrix": [[42, 0], [29, 16]], "precision": 1.0, "recall": 0.35555555555555557, "f1_score": 0.5245901639344263, "false_positive_rate": 0.0, "false_negative_rate": 0.6444444444444445, "roc_auc": 0.9894179894179893}`. The result above is a separate validation-selected-threshold experiment and does not overwrite it.

## Scenario-wise detection analysis

| scenario | samples | detected | missed | detection_rate |
| --- | --- | --- | --- | --- |
| excessive_idle_duration | 7 | 7 | 0 | 1.000000 |
| fare_distance_inconsistency | 4 | 3 | 1 | 0.750000 |
| high_speed_abnormal_movement | 5 | 5 | 0 | 1.000000 |
| large_itinerary_deviation | 8 | 8 | 0 | 1.000000 |
| large_route_deviation | 6 | 6 | 0 | 1.000000 |
| significant_schedule_delay | 8 | 8 | 0 | 1.000000 |
| transport_mode_mismatch | 7 | 7 | 0 | 1.000000 |

## Limitations

This is Synthetic Controlled Evaluation Data, not real tourist data. Its distributions may not match operational trajectories. Isolation Forest is sensitive to contamination and the chosen score threshold. Sample counts are small, particularly per scenario. No real-tourist validation, fairness analysis, or real-world safety conclusion is supported.
