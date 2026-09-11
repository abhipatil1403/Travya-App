# Controlled Prototype Integration Examples

These deterministic examples use already normalized illustrative component outputs; they are not real-world tourist cases. Formula: `0.6 × ml_risk + 0.4 × geofence_risk`.

| Example | ml_risk | geofence_risk | final_risk | risk_level | Explanation |
| --- | ---: | ---: | ---: | --- | --- |
| Normal trajectory + SAFE zone | 0.10 | 0.00 | 0.06 | LOW | Small ML contribution, no geographical contribution. |
| Anomalous trajectory + SAFE zone | 0.95 | 0.00 | 0.57 | MEDIUM | High ML contribution, no geographical contribution. |
| Normal trajectory + DANGER zone | 0.10 | 1.00 | 0.46 | MEDIUM | Small ML contribution plus controlled DANGER-zone contribution. |
| Anomalous trajectory + DANGER zone | 0.95 | 1.00 | 0.97 | HIGH | Both controlled component risks contribute. |
