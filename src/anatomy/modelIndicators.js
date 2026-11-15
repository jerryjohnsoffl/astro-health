import { conditions } from '../data/conditions.js'

function topPrediction(analysis) {
  const prediction = analysis?.predictions?.[0]
  if (
    !prediction ||
    typeof prediction.name !== 'string' ||
    !Number.isFinite(prediction.probability)
  ) {
    return null
  }
  return prediction
}

export function getModelAnatomyIndicators(healthState, catalogue) {
  const indicators = []
  const cdssPrediction = topPrediction(healthState.cdssAssessment)

  if (cdssPrediction) {
    const condition = conditions.find(({ id }) => id === cdssPrediction.name)
    const structures = catalogue.structures.filter((structure) =>
      structure.conditionIds?.includes(cdssPrediction.name),
    )
    indicators.push({
      id: `cdss:${cdssPrediction.name}`,
      source: 'CDSS',
      label: condition?.name ?? cdssPrediction.name,
      score: cdssPrediction.probability,
      structureIds: structures.map(({ id }) => id),
      recordedAt: healthState.cdssAssessment.recordedAt,
    })
  }

  const ecgPrediction = topPrediction(healthState.sensorAnalyses.ecg)
  if (ecgPrediction) {
    const structures = catalogue.structures.filter(
      (structure) => structure.layer === 'cardio' && structure.kind === 'organ',
    )
    indicators.push({
      id: `ecg:${ecgPrediction.name}`,
      source: 'ECG',
      label: ecgPrediction.description ?? ecgPrediction.name,
      score: ecgPrediction.probability,
      structureIds: structures.map(({ id }) => id),
      recordedAt: healthState.sensorAnalyses.ecg.recordedAt,
    })
  }

  return indicators
}
