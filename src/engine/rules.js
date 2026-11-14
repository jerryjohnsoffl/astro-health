import {
  assertMeasurementDefinition,
  evaluateThreshold,
  TRIAGE_LEVELS,
} from './thresholds.js'

function assertStringList(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array of strings.`)
  }

  const normalized = values.map((value, index) => {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(`${label} item at index ${index} must be a non-empty string.`)
    }
    return value.trim()
  })

  return [...new Set(normalized)]
}

function validateCondition(condition, index, seenIds) {
  if (condition === null || typeof condition !== 'object' || Array.isArray(condition)) {
    throw new TypeError(`Condition at index ${index} must be an object.`)
  }
  if (typeof condition.id !== 'string' || condition.id.trim() === '') {
    throw new TypeError(`Condition at index ${index} must have a non-empty id.`)
  }
  const conditionId = condition.id.trim()
  if (seenIds.has(conditionId)) {
    throw new TypeError(`Condition id "${conditionId}" is duplicated.`)
  }
  seenIds.add(conditionId)

  const symptoms = assertStringList(condition.symptoms, `Symptoms for condition "${conditionId}"`)
  const redFlags = assertStringList(
    condition.redFlags ?? [],
    `Red flags for condition "${conditionId}"`,
  )

  if (condition.triageLevel !== undefined && !TRIAGE_LEVELS.includes(condition.triageLevel)) {
    throw new TypeError(`Condition "${conditionId}" has an unsupported triage level.`)
  }
  if (
    condition.name !== undefined &&
    (typeof condition.name !== 'string' || condition.name.trim() === '')
  ) {
    throw new TypeError(`Condition "${conditionId}" name must be a non-empty string.`)
  }

  if (redFlags.some((redFlag) => !symptoms.includes(redFlag))) {
    throw new TypeError(`Condition "${conditionId}" has a red flag not listed as a symptom.`)
  }

  if (
    redFlags.length > 0 &&
    condition.triageLevel !== 'urgent' &&
    condition.triageLevel !== 'emergency'
  ) {
    throw new TypeError(
      `Condition "${conditionId}" must define urgent or emergency triage for red flags.`,
    )
  }

  return {
    id: conditionId,
    name: condition.name?.trim() || conditionId,
    symptoms,
    redFlags,
    triageLevel: condition.triageLevel ?? 'unknown',
  }
}

export function checkMeasurement(definition, value) {
  assertMeasurementDefinition(definition)
  const result = evaluateThreshold(value, definition.thresholds)

  return {
    measurementId: definition.id,
    value,
    unit: definition.unit,
    status: result.status,
    triageLevel: result.triageLevel,
    matchedThreshold: result.matchedThreshold,
  }
}

export function checkSymptoms(symptomIds, conditions) {
  const selectedSymptoms = assertStringList(symptomIds, 'Symptoms')
  if (!Array.isArray(conditions)) {
    throw new TypeError('Conditions must be an array.')
  }

  const seenIds = new Set()
  const matches = []
  const redFlags = []
  const matchedSymptomIds = new Set()

  conditions.forEach((condition, index) => {
    const {
      id: conditionId,
      name: conditionName,
      symptoms,
      redFlags: conditionRedFlags,
      triageLevel,
    } = validateCondition(
      condition,
      index,
      seenIds,
    )
    const matchedSymptoms = selectedSymptoms.filter((symptom) => symptoms.includes(symptom))

    if (matchedSymptoms.length === 0) {
      return
    }

    matchedSymptoms.forEach((symptom) => matchedSymptomIds.add(symptom))
    const matchedRedFlags = matchedSymptoms.filter((symptom) =>
      conditionRedFlags.includes(symptom),
    )

    matches.push({
      conditionId,
      name: conditionName,
      matchedSymptoms,
      triageLevel,
      redFlags: matchedRedFlags,
    })

    matchedRedFlags.forEach((symptomId) => {
      redFlags.push({
        symptomId,
        conditionId,
        triageLevel,
      })
    })
  })

  matches.sort(
    (left, right) =>
      right.matchedSymptoms.length - left.matchedSymptoms.length ||
      left.conditionId.localeCompare(right.conditionId),
  )

  return {
    selectedSymptoms,
    matches,
    redFlags,
    unmatchedSymptoms: selectedSymptoms.filter((symptom) => !matchedSymptomIds.has(symptom)),
  }
}
