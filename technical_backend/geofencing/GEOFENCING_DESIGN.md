# Geofencing design

## Purpose and coordinate convention

The engine evaluates circular, **controlled prototype** geofences in the backend. Existing synthetic trajectory events already use `latitude` and `longitude`; no frontend location-object schema or map-zone format exists. The selected convention is WGS-84-style decimal degrees: `latitude` in [-90, 90], then `longitude` in [-180, 180]. Future risk assessment can call `evaluate_geofence(latitude, longitude)` directly.

## Model and calculation

Each JSON geofence has `geofence_id`, `name`, `center_latitude`, `center_longitude`, `radius_meters`, `risk_zone`, and `risk_value`. Distance is the Haversine great-circle distance with Earth radius 6,371,008.8 metres; output is metres. A point with distance <= radius (including equality, with 1e-6m tolerance) is inside.

## Controlled risk configuration

`SAFE=0.0`, `WARNING=0.5`, and `DANGER=1.0`. These are controlled prototype configuration values, not universal safety facts. The configuration is [prototype_geofences.json](prototype_geofences.json); its locations are test coordinates, not validated tourist danger zones.

## Overlap, output, and invalid input

For overlapping circles, highest `risk_value` wins; ties choose the nearest center then lexicographically smallest ID. The result includes selected zone, risk, centre and inward-boundary distance, all matched IDs, and a reason. Outside all circles returns `SAFE`, 0.0, and no matching geofence. Missing/null/non-numeric/out-of-range coordinates raise `GeofenceValidationError`; invalid input never becomes SAFE.

## Limitations

Only circles are supported. Haversine is spherical and does not model road access, boundaries, time, terrain, live incidents, consent, map accuracy, or real-world safety. This component has no risk fusion, Safety Score, frontend, or dispatch behaviour.
