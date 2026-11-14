export const MEASUREMENT_STATUSES = Object.freeze(['normal', 'watch', 'attention'])
export const TRIAGE_LEVELS = Object.freeze(['routine', 'watch', 'urgent', 'emergency'])

const VALID_MEASUREMENT_STATUSES = new Set(MEASUREMENT_STATUSES)
const VALID_TRIAGE_LEVELS = new Set(TRIAGE_LEVELS)

function assertRecord(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`)
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty string.`)
  }
}

function validateThreshold(threshold, index) {
  const label = `Threshold at index ${index}`
  assertRecord(threshold, label)

  if (!VALID_MEASUREMENT_STATUSES.has(threshold.status)) {
    throw new TypeError(`${label} has an unsupported status.`)
  }

  for (const bound of ['min', 'max']) {
    if (threshold[bound] !== undefined && !Number.isFinite(threshold[bound])) {
      throw new TypeError(`${label} ${bound} bound must be a finite number.`)
    }
  }

  if (
    threshold.min !== undefined &&
    threshold.max !== undefined &&
    threshold.min > threshold.max
  ) {
    throw new RangeError(`${label} has a minimum greater than its maximum.`)
  }

  for (const inclusive of ['minInclusive', 'maxInclusive']) {
    if (threshold[inclusive] !== undefined && typeof threshold[inclusive] !== 'boolean') {
      throw new TypeError(`${label} ${inclusive} must be a boolean.`)
    }
  }

  if (threshold.triageLevel !== undefined && !VALID_TRIAGE_LEVELS.has(threshold.triageLevel)) {
    throw new TypeError(`${label} has an unsupported triage level.`)
  }

  if (
    threshold.min !== undefined &&
    threshold.min === threshold.max &&
    (threshold.minInclusive === false || threshold.maxInclusive === false)
  ) {
    throw new RangeError(`${label} does not include any values.`)
  }
}

function contains(threshold, value) {
  const aboveMinimum =
    threshold.min === undefined ||
    (threshold.minInclusive === false ? value > threshold.min : value >= threshold.min)
  const belowMaximum =
    threshold.max === undefined ||
    (threshold.maxInclusive === false ? value < threshold.max : value <= threshold.max)

  return aboveMinimum && belowMaximum
}

function overlaps(left, right) {
  const lowerBound = Math.max(left.min ?? -Infinity, right.min ?? -Infinity)
  const upperBound = Math.min(left.max ?? Infinity, right.max ?? Infinity)

  if (lowerBound < upperBound) {
    return true
  }

  return lowerBound === upperBound && contains(left, lowerBound) && contains(right, lowerBound)
}

function defaultTriageLevel(status) {
  if (status === 'normal') {
    return 'routine'
  }
  if (status === 'watch') {
    return 'watch'
  }
  return 'unknown'
}

export function evaluateThreshold(value, thresholds) {
  if (!Number.isFinite(value)) {
    throw new TypeError('Measurement value must be a finite number.')
  }
  if (!Array.isArray(thresholds)) {
    throw new TypeError('Measurement thresholds must be an array.')
  }

  thresholds.forEach(validateThreshold)

  for (let index = 0; index < thresholds.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < thresholds.length; otherIndex += 1) {
      if (overlaps(thresholds[index], thresholds[otherIndex])) {
        throw new RangeError(
          `Measurement thresholds at indexes ${index} and ${otherIndex} overlap.`,
        )
      }
    }
  }

  const matchedThreshold = thresholds.find((threshold) => contains(threshold, value))
  if (!matchedThreshold) {
    return {
      status: 'unclassified',
      triageLevel: 'unknown',
      matchedThreshold: null,
    }
  }

  return {
    status: matchedThreshold.status,
    triageLevel: matchedThreshold.triageLevel ?? defaultTriageLevel(matchedThreshold.status),
    matchedThreshold: { ...matchedThreshold },
  }
}

export function assertMeasurementDefinition(definition) {
  assertRecord(definition, 'Measurement definition')
  assertNonEmptyString(definition.id, 'Measurement id')
  assertNonEmptyString(definition.unit, 'Measurement unit')

  if (!Array.isArray(definition.thresholds)) {
    throw new TypeError('Measurement definition thresholds must be an array.')
  }
}
