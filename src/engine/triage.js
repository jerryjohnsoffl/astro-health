import { TRIAGE_LEVELS } from './thresholds.js'

const PRIORITY = new Map([
  ['routine', 0],
  ['watch', 1],
  ['urgent', 2],
  ['emergency', 3],
])
const VALID_MEASUREMENT_STATUSES = new Set([
  'normal',
  'watch',
  'attention',
  'unclassified',
])

function assertRecord(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`)
  }
}

function assertTriageLevel(level, label) {
  if (level !== 'unknown' && !TRIAGE_LEVELS.includes(level)) {
    throw new TypeError(`${label} has an unsupported triage level.`)
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty string.`)
  }
}

function levelForMeasurement(result) {
  if (result.triageLevel !== undefined) {
    assertTriageLevel(result.triageLevel, `Measurement "${result.measurementId}"`)
    return result.triageLevel
  }
  if (result.status === 'normal') {
    return 'routine'
  }
  if (result.status === 'watch') {
    return 'watch'
  }
  return 'unknown'
}

function getHighestKnownLevel(reasons) {
  return reasons.reduce((highest, reason) => {
    if (reason.level === 'unknown') {
      return highest
    }
    return PRIORITY.get(reason.level) > PRIORITY.get(highest) ? reason.level : highest
  }, 'routine')
}

export function triage(input = {}) {
  assertRecord(input, 'Triage input')
  const measurements = input.measurements === undefined ? [] : input.measurements
  const symptoms = input.symptoms === undefined ? null : input.symptoms

  if (!Array.isArray(measurements)) {
    throw new TypeError('Triage measurements must be an array.')
  }

  const reasons = []
  let hasUnknown = false

  measurements.forEach((result, index) => {
    assertRecord(result, `Measurement result at index ${index}`)
    if (typeof result.measurementId !== 'string' || result.measurementId.trim() === '') {
      throw new TypeError(`Measurement result at index ${index} must have a measurement id.`)
    }
    if (!VALID_MEASUREMENT_STATUSES.has(result.status)) {
      throw new TypeError(`Measurement "${result.measurementId}" has an unsupported status.`)
    }

    const level = levelForMeasurement(result)
    hasUnknown ||= level === 'unknown'
    reasons.push({
      source: 'measurement',
      id: result.measurementId.trim(),
      status: result.status,
      level,
    })
  })

  if (symptoms !== null) {
    assertRecord(symptoms, 'Symptom assessment')
    if (
      !Array.isArray(symptoms.matches) ||
      !Array.isArray(symptoms.redFlags) ||
      !Array.isArray(symptoms.unmatchedSymptoms) ||
      !Array.isArray(symptoms.selectedSymptoms)
    ) {
      throw new TypeError('Symptom assessment has an invalid result shape.')
    }

    symptoms.matches.forEach((match, index) => {
      assertRecord(match, `Symptom match at index ${index}`)
      assertNonEmptyString(match.conditionId, `Symptom match at index ${index} condition id`)
      assertTriageLevel(match.triageLevel, `Condition "${match.conditionId}"`)
      hasUnknown ||= match.triageLevel === 'unknown'
      reasons.push({
        source: 'condition',
        id: match.conditionId.trim(),
        status: match.triageLevel === 'unknown' ? 'unclassified' : 'matched',
        level: match.triageLevel,
      })
    })

    symptoms.redFlags.forEach((redFlag, index) => {
      assertRecord(redFlag, `Red flag at index ${index}`)
      assertNonEmptyString(redFlag.symptomId, `Red flag at index ${index} symptom id`)
      assertNonEmptyString(redFlag.conditionId, `Red flag at index ${index} condition id`)
      assertTriageLevel(redFlag.triageLevel, `Red flag "${redFlag.symptomId}"`)
      if (redFlag.triageLevel !== 'urgent' && redFlag.triageLevel !== 'emergency') {
        throw new TypeError(`Red flag "${redFlag.symptomId}" must be urgent or emergency.`)
      }
      reasons.push({
        source: 'red-flag',
        id: redFlag.symptomId,
        conditionId: redFlag.conditionId,
        status: 'flagged',
        level: redFlag.triageLevel,
      })
    })

    symptoms.selectedSymptoms.forEach((symptomId, index) => {
      assertNonEmptyString(symptomId, `Selected symptom at index ${index}`)
    })
    symptoms.unmatchedSymptoms.forEach((symptomId, index) => {
      assertNonEmptyString(symptomId, `Unmatched symptom at index ${index}`)
    })

    if (symptoms.unmatchedSymptoms.length > 0) {
      hasUnknown = true
      symptoms.unmatchedSymptoms.forEach((symptomId) => {
        reasons.push({
          source: 'symptom',
          id: symptomId,
          status: 'unmatched',
          level: 'unknown',
        })
      })
    }
  }

  const hasAssessment =
    measurements.length > 0 ||
    (symptoms !== null &&
      (symptoms.selectedSymptoms.length > 0 ||
        symptoms.matches.length > 0 ||
        symptoms.redFlags.length > 0))
  const highestKnownLevel = getHighestKnownLevel(reasons)
  const hasKnownUrgentLevel =
    highestKnownLevel === 'urgent' || highestKnownLevel === 'emergency'
  const level =
    !hasAssessment || (hasUnknown && !hasKnownUrgentLevel) ? 'unknown' : highestKnownLevel

  return {
    level,
    requiresReview: level !== 'routine',
    reasons,
  }
}
