# Synthetic Controlled Evaluation Data

## Dataset type and purpose

This dataset is **Synthetic Controlled Evaluation Data**. It is generated deterministically for controlled prototype evaluation. It does not represent a real-world tourist population, collected tourist data, or a real-world GPS dataset.

## Reproducibility and size

- Fixed random seed: `20260911`
- Trajectories/samples: 290
- Normal samples: 150
- Controlled anomalous samples: 140 (20 per anomaly scenario)
- Raw event records: five generated event records per trajectory

## Generation procedure

For each sample, the generator creates an origin, itinerary destination, planned mode, planned route points, actual route points, timestamps, segment distances, an optional idle event, fare, and scheduled arrival. It then derives the processed feature table from those event records. Raw files are preserved when a repeat generation produces the same content; the generator refuses to replace divergent raw content unless explicitly given `--replace-raw`.

## Controlled labels and anomaly rules

`label=0` is a normal controlled trajectory: route offset, speed, idle time, destination offset and arrival delay remain within the generator's normal tolerance.

`label=1` is a controlled anomalous trajectory. Each is assigned one primary scenario:

- `high_speed_abnormal_movement`: deliberately elevated average speed (95–135 km/h).
- `large_route_deviation`: a 2–4 km controlled offset from the planned path.
- `excessive_idle_duration`: a 55–100 minute stationary event.
- `fare_distance_inconsistency`: deliberately very low or very high fare per travelled kilometre.
- `large_itinerary_deviation`: a destination 3.5–7 km away from the itinerary destination.
- `transport_mode_mismatch`: actual and planned transport modes deliberately differ.
- `significant_schedule_delay`: a 75–150 minute controlled arrival delay.

The raw manifest records the reason for every label-1 sample individually.

## Input fields and derived schema

Raw event fields: `trajectory_id`, `event_index`, `event_type`, `timestamp_minutes`, `latitude`, `longitude`, `planned_latitude`, `planned_longitude`, `actual_mode`, `planned_mode`, `segment_distance_km`, `idle_minutes`, `fare_amount`, `scheduled_arrival_minutes`.

The processed feature table contains: `trajectory_id`, `distance_time_ratio`, `avg_speed`, `route_deviation_percent`, `total_idle_minutes`, `fare_distance_ratio`, `itinerary_deviation_km`, `transport_mode_mismatch`, `schedule_delay_minutes`, `label`, `scenario`.

## Limitations

The route geometry uses a small local-coordinate approximation and intentionally simple scenario controls. It lacks real road networks, GPS noise characteristics, pricing rules, demographics, consent, weather, traffic, and behavioural diversity. It supports deterministic engineering checks only; it must not be used to infer real-world safety, tourist behaviour, model performance, or fairness.
