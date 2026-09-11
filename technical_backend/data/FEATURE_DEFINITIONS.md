# Eight-feature definitions

All feature calculations are deterministic from raw events using [`app/feature_extraction/trajectory_features.py`](../app/feature_extraction/trajectory_features.py). Missing required fields, non-finite values, invalid coordinates, negative numeric inputs, duplicate event indexes, non-monotonic time, and zero elapsed/moving/planned-route time or distance are rejected with `ValueError`.

| Feature name | Description; source fields | Formula; unit | Expected range; validation rules |
|---|---|---|---|
| `distance_time_ratio` | Travel distance over duration. `segment_distance_km`, `timestamp_minutes` | `sum(segment_distance_km)/(last_timestamp-first_timestamp)`; km/min | >=0; elapsed time >0 |
| `avg_speed` | Moving speed. distance, timestamps, `idle_minutes` | `sum(distance)/(elapsed-idle)*60`; km/h | >=0; moving time >0 |
| `route_deviation_percent` | Greatest actual-vs-planned position displacement relative to planned route length. actual/planned coordinates | `max(haversine(actual, planned))/sum(haversine(planned consecutive))*100`; % | >=0; planned distance >0 |
| `total_idle_minutes` | Total stationary duration. `idle_minutes` | `sum(idle_minutes)`; minutes | >=0; each input non-negative |
| `fare_distance_ratio` | Final-record fare per actual distance. `fare_amount`, `segment_distance_km` | `final_fare/sum(distance)`; currency/km | >=0; zero distance with positive fare rejected (zero fare/zero distance is 0) |
| `itinerary_deviation_km` | Final actual position from final planned itinerary position. final coordinates | `haversine(final_actual, final_planned)`; km | >=0; coordinates valid |
| `transport_mode_mismatch` | Difference between final actual and planned transport mode. modes | `int(actual_mode != planned_mode)`; binary | 0 or 1; both modes non-empty |
| `schedule_delay_minutes` | Arrival relative to scheduled arrival. final timestamp, final scheduled arrival | `final_timestamp-final_scheduled_arrival`; minutes | signed; schedules/timestamps non-negative |

The fixed model order is: `distance_time_ratio`, `avg_speed`, `route_deviation_percent`, `total_idle_minutes`, `fare_distance_ratio`, `itinerary_deviation_km`, `transport_mode_mismatch`, `schedule_delay_minutes`.
