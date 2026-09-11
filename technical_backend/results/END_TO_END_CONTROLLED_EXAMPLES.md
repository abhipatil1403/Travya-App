# Controlled Prototype End-to-End Examples

Generated from actual local API execution. These are not real tourist incidents.

## Normal trajectory + SAFE zone

```json
{
  "features": {
    "distance_time_ratio": 0.071277,
    "avg_speed": 4.386635,
    "route_deviation_percent": 1.643921,
    "total_idle_minutes": 2.181,
    "fare_distance_ratio": 0.0,
    "itinerary_deviation_km": 0.015387,
    "transport_mode_mismatch": 0,
    "schedule_delay_minutes": 9.664
  },
  "anomaly_detection": {
    "anomaly_score": -0.15445501394083444,
    "anomaly_status": "normal",
    "ml_risk": 0.043803998811943044,
    "threshold": -0.14373467326538011
  },
  "geofencing": {
    "latitude": 12.97,
    "longitude": 77.59,
    "geofence_id": "prototype-safe-01",
    "geofence_name": "Prototype Safe Circle",
    "zone": "SAFE",
    "geofence_risk": 0.0,
    "distance_to_center_meters": 0.0,
    "distance_to_boundary_meters": 400.0,
    "matched_geofences": [
      "prototype-safe-01"
    ],
    "reason": "inside_controlled_prototype_geofence"
  },
  "risk_assessment": {
    "final_risk": 0.026282399287165827,
    "risk_level": "LOW",
    "fusion_formula_version": "controlled-prototype-linear-v1",
    "component_contributions": {
      "ml": 0.026282399287165827,
      "geofence": 0.0,
      "interaction": 0.0
    }
  },
  "safety_assessment": {
    "safety_score": 97.4,
    "safety_category": "SAFE",
    "score_formula_version": "controlled-prototype-inverse-risk-v1"
  },
  "explanation": {
    "anomaly_status": "normal",
    "geofence_reason": "inside_controlled_prototype_geofence",
    "fusion_reason": "controlled_prototype_weighted_fusion",
    "safety_explanation": "Safety Score is the controlled-prototype inverse of final_risk; higher fused risk lowers the score."
  }
}
```

## Anomalous trajectory + SAFE zone

```json
{
  "features": {
    "distance_time_ratio": 1.621341,
    "avg_speed": 226.49408,
    "route_deviation_percent": 1.643921,
    "total_idle_minutes": 2.181,
    "fare_distance_ratio": 0.0,
    "itinerary_deviation_km": 0.015387,
    "transport_mode_mismatch": 0,
    "schedule_delay_minutes": -73.475
  },
  "anomaly_detection": {
    "anomaly_score": 0.11852323611828841,
    "anomaly_status": "anomalous",
    "ml_risk": 0.773930529810076,
    "threshold": -0.14373467326538011
  },
  "geofencing": {
    "latitude": 12.97,
    "longitude": 77.59,
    "geofence_id": "prototype-safe-01",
    "geofence_name": "Prototype Safe Circle",
    "zone": "SAFE",
    "geofence_risk": 0.0,
    "distance_to_center_meters": 0.0,
    "distance_to_boundary_meters": 400.0,
    "matched_geofences": [
      "prototype-safe-01"
    ],
    "reason": "inside_controlled_prototype_geofence"
  },
  "risk_assessment": {
    "final_risk": 0.4643583178860456,
    "risk_level": "MEDIUM",
    "fusion_formula_version": "controlled-prototype-linear-v1",
    "component_contributions": {
      "ml": 0.4643583178860456,
      "geofence": 0.0,
      "interaction": 0.0
    }
  },
  "safety_assessment": {
    "safety_score": 53.6,
    "safety_category": "CAUTION",
    "score_formula_version": "controlled-prototype-inverse-risk-v1"
  },
  "explanation": {
    "anomaly_status": "anomalous",
    "geofence_reason": "inside_controlled_prototype_geofence",
    "fusion_reason": "controlled_prototype_weighted_fusion",
    "safety_explanation": "Safety Score is the controlled-prototype inverse of final_risk; higher fused risk lowers the score."
  }
}
```

## Normal trajectory + DANGER zone

```json
{
  "features": {
    "distance_time_ratio": 0.071277,
    "avg_speed": 4.386635,
    "route_deviation_percent": 1.643921,
    "total_idle_minutes": 2.181,
    "fare_distance_ratio": 0.0,
    "itinerary_deviation_km": 0.015387,
    "transport_mode_mismatch": 0,
    "schedule_delay_minutes": 9.664
  },
  "anomaly_detection": {
    "anomaly_score": -0.15445501394083444,
    "anomaly_status": "normal",
    "ml_risk": 0.043803998811943044,
    "threshold": -0.14373467326538011
  },
  "geofencing": {
    "latitude": 12.99,
    "longitude": 77.62,
    "geofence_id": "prototype-danger-01",
    "geofence_name": "Prototype Danger Circle",
    "zone": "DANGER",
    "geofence_risk": 1.0,
    "distance_to_center_meters": 0.0,
    "distance_to_boundary_meters": 250.0,
    "matched_geofences": [
      "prototype-warning-overlap-01",
      "prototype-danger-01"
    ],
    "reason": "inside_controlled_prototype_geofence"
  },
  "risk_assessment": {
    "final_risk": 0.4262823992871658,
    "risk_level": "MEDIUM",
    "fusion_formula_version": "controlled-prototype-linear-v1",
    "component_contributions": {
      "ml": 0.026282399287165827,
      "geofence": 0.4,
      "interaction": 0.0
    }
  },
  "safety_assessment": {
    "safety_score": 57.4,
    "safety_category": "CAUTION",
    "score_formula_version": "controlled-prototype-inverse-risk-v1"
  },
  "explanation": {
    "anomaly_status": "normal",
    "geofence_reason": "inside_controlled_prototype_geofence",
    "fusion_reason": "controlled_prototype_weighted_fusion",
    "safety_explanation": "Safety Score is the controlled-prototype inverse of final_risk; higher fused risk lowers the score."
  }
}
```

## Anomalous trajectory + DANGER zone

```json
{
  "features": {
    "distance_time_ratio": 1.621341,
    "avg_speed": 226.49408,
    "route_deviation_percent": 1.643921,
    "total_idle_minutes": 2.181,
    "fare_distance_ratio": 0.0,
    "itinerary_deviation_km": 0.015387,
    "transport_mode_mismatch": 0,
    "schedule_delay_minutes": -73.475
  },
  "anomaly_detection": {
    "anomaly_score": 0.11852323611828841,
    "anomaly_status": "anomalous",
    "ml_risk": 0.773930529810076,
    "threshold": -0.14373467326538011
  },
  "geofencing": {
    "latitude": 12.99,
    "longitude": 77.62,
    "geofence_id": "prototype-danger-01",
    "geofence_name": "Prototype Danger Circle",
    "zone": "DANGER",
    "geofence_risk": 1.0,
    "distance_to_center_meters": 0.0,
    "distance_to_boundary_meters": 250.0,
    "matched_geofences": [
      "prototype-warning-overlap-01",
      "prototype-danger-01"
    ],
    "reason": "inside_controlled_prototype_geofence"
  },
  "risk_assessment": {
    "final_risk": 0.8643583178860457,
    "risk_level": "HIGH",
    "fusion_formula_version": "controlled-prototype-linear-v1",
    "component_contributions": {
      "ml": 0.4643583178860456,
      "geofence": 0.4,
      "interaction": 0.0
    }
  },
  "safety_assessment": {
    "safety_score": 13.6,
    "safety_category": "UNSAFE",
    "score_formula_version": "controlled-prototype-inverse-risk-v1"
  },
  "explanation": {
    "anomaly_status": "anomalous",
    "geofence_reason": "inside_controlled_prototype_geofence",
    "fusion_reason": "controlled_prototype_weighted_fusion",
    "safety_explanation": "Safety Score is the controlled-prototype inverse of final_risk; higher fused risk lowers the score."
  }
}
```
