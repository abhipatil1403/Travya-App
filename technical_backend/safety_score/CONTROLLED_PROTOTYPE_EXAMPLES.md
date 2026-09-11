# Controlled Prototype Safety Score Examples

All figures below are deterministic prototype demonstrations; they are not real-world tourist cases. Score formula: `100 × (1 - final_risk)`.

| Example | ml_risk | geofence_risk | final_risk | risk_level | safety_score | safety_category |
| --- | ---: | ---: | ---: | --- | ---: | --- |
| Low anomaly + SAFE zone | 0.10 | 0.00 | 0.06 | LOW | 94.0 | SAFE |
| High anomaly + SAFE zone | 0.95 | 0.00 | 0.57 | MEDIUM | 43.0 | CAUTION |
| Low anomaly + DANGER zone | 0.10 | 1.00 | 0.46 | MEDIUM | 54.0 | CAUTION |
| High anomaly + DANGER zone | 0.95 | 1.00 | 0.97 | HIGH | 3.0 | UNSAFE |
