// Controlled Prototype Assessment Input only. These fixtures are not live GPS or tourist behaviour.
const baseEvents = (scenario) => {
  const highSpeed = scenario.includes('anomalous')
  const timestamps = highSpeed ? [540, 541, 542, 543, 544] : [540, 550, 560, 570, 580]
  return timestamps.map((timestamp_minutes, event_index) => ({
    trajectory_id: `CONTROLLED-${scenario}`, event_index, timestamp_minutes,
    latitude: 12.95 + event_index * 0.002, longitude: 77.60 + event_index * 0.002,
    planned_latitude: 12.95 + event_index * 0.002, planned_longitude: 77.60 + event_index * 0.002,
    actual_mode: 'taxi', planned_mode: 'taxi', segment_distance_km: event_index ? 0.5 : 0,
    idle_minutes: 0, fare_amount: event_index === 4 ? 40 : 0, scheduled_arrival_minutes: 580,
  }))
}

export const CONTROLLED_SCENARIOS = [
  { id: 'normal-safe', label: 'Normal trajectory + SAFE zone', scenario: 'normal', latitude: 12.97, longitude: 77.59 },
  { id: 'anomalous-safe', label: 'Anomalous trajectory + SAFE zone', scenario: 'anomalous', latitude: 12.97, longitude: 77.59 },
  { id: 'normal-danger', label: 'Normal trajectory + DANGER zone', scenario: 'normal', latitude: 12.99, longitude: 77.62 },
  { id: 'anomalous-danger', label: 'Anomalous trajectory + DANGER zone', scenario: 'anomalous', latitude: 12.99, longitude: 77.62 },
]

export function controlledAssessmentPayload(id) {
  const selected = CONTROLLED_SCENARIOS.find((scenario) => scenario.id === id)
  if (!selected) throw new Error('Unknown controlled prototype scenario')
  return { events: baseEvents(selected.scenario), current_latitude: selected.latitude, current_longitude: selected.longitude }
}
