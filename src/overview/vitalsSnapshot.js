const snapshotDefinitions = [
  { id: 'heart_rate', label: 'Heart rate', unit: 'bpm', measurementId: 'heart_rate' },
  { id: 'spo2', label: 'SpO₂', unit: '%', measurementId: 'spo2' },
  { id: 'systolic_bp', label: 'Systolic blood pressure', unit: 'mmHg', measurementId: 'systolic_bp' },
  { id: 'fluid_intake_l', label: 'Fluid intake (24 h)', unit: 'L', measurementId: 'fluid_intake_l' },
  {
    id: 'sleep_hours',
    label: 'Sleep (24 h)',
    unit: 'h',
    measurementId: 'sleep_hours',
    wellbeingField: 'sleepHours',
  },
]

function latestEntry(entries) {
  return entries
    .filter((entry) => Number.isFinite(entry?.value) && Number.isFinite(Date.parse(entry.recordedAt)))
    .reduce((latest, entry) =>
      latest === null || Date.parse(entry.recordedAt) > Date.parse(latest.recordedAt)
        ? entry
        : latest,
    null)
}

export function getVitalsSnapshot(healthState) {
  const cdss = healthState.cdssAssessment
  const measurements = healthState.measurements

  return snapshotDefinitions.map((definition) => {
    const entries = [
      measurements[definition.measurementId] && {
        value: measurements[definition.measurementId].value,
        recordedAt: measurements[definition.measurementId].recordedAt,
        source: 'Saved measurement',
      },
      Number.isFinite(cdss?.input.context[definition.id]) && {
        value: cdss.input.context[definition.id],
        recordedAt: cdss.recordedAt,
        source: 'Self-check input',
      },
      definition.wellbeingField &&
        healthState.wellbeingCheckIn && {
          value: healthState.wellbeingCheckIn[definition.wellbeingField],
          recordedAt: healthState.wellbeingCheckIn.recordedAt,
          source: 'Self-reported check-in',
        },
    ].filter(Boolean)

    return {
      id: definition.id,
      label: definition.label,
      unit: definition.unit,
      ...latestEntry(entries),
    }
  })
}
