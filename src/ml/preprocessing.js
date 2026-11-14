import { CONTEXT, FEATURE_NAMES, SYMPTOMS, encode } from './features.js'

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

export function encodeCDSSRecord(record) {
  if (!isRecord(record)) {
    throw new TypeError('CDSS input must be an object.')
  }
  if (record.symptoms !== undefined && !isRecord(record.symptoms)) {
    throw new TypeError('CDSS symptoms must be an object.')
  }
  if (!isRecord(record.context)) {
    throw new TypeError('CDSS context must be an object.')
  }

  for (const symptom of SYMPTOMS) {
    const severity = record.symptoms?.[symptom] ?? 0
    if (typeof severity !== 'number' || !Number.isFinite(severity) || severity < 0 || severity > 3) {
      throw new TypeError(`Symptom "${symptom}" severity must be a number from 0 to 3.`)
    }
  }

  for (const { name } of CONTEXT) {
    const value = record.context[name]
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(`Context value "${name}" must be a finite number.`)
    }
  }

  const features = encode(record)
  if (features.length !== FEATURE_NAMES.length) {
    throw new Error('CDSS feature encoding does not match the model feature specification.')
  }
  return features
}

function assertFiniteVector(values, label, expectedLength) {
  if (!Array.isArray(values) || values.length !== expectedLength) {
    throw new TypeError(`${label} must contain exactly ${expectedLength} samples.`)
  }
  values.forEach((value, index) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(`${label} sample ${index + 1} must be a finite number.`)
    }
  })
}

export function normalizeEcgWindow(samples) {
  assertFiniteVector(samples, 'ECG window', 180)

  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length
  const variance = samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / samples.length
  const standardDeviation = Math.sqrt(variance)

  if (standardDeviation === 0) {
    throw new TypeError('ECG window must not be a constant signal.')
  }

  return samples.map((value) => (value - mean) / standardDeviation)
}

export function validateSleepWindow(samples) {
  if (!Array.isArray(samples) || samples.length !== 3000) {
    throw new TypeError('Sleep window must contain exactly 3000 rows.')
  }

  samples.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== 7) {
      throw new TypeError(`Sleep window row ${rowIndex + 1} must contain exactly 7 values.`)
    }
    row.forEach((value, columnIndex) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new TypeError(`Sleep window value at row ${rowIndex + 1}, column ${columnIndex + 1} must be finite.`)
      }
    })
  })

  return samples
}

export function parseEcgCsvSamples(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new TypeError('Choose an ECG CSV containing exactly 180 numeric samples.')
  }
  const tokens = text.trim().split(/[,\s]+/)
  const samples = tokens.map((token, index) => {
    const value = Number(token)
    if (!Number.isFinite(value)) {
      throw new TypeError(`ECG sample ${index + 1} is not a finite number.`)
    }
    return value
  })
  assertFiniteVector(samples, 'ECG window', 180)
  return samples
}

export function parseEcgCsv(text) {
  return normalizeEcgWindow(parseEcgCsvSamples(text))
}

export function parseSleepCsv(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new TypeError('Choose a sleep CSV containing one 7-channel, 3000-sample epoch.')
  }

  const rows = text.trim().split(/\r?\n/).map((line, rowIndex) => {
    const tokens = line.trim().split(/[,\s]+/)
    if (tokens.length !== 7 && tokens.length !== 3000) {
      throw new TypeError(`Sleep row ${rowIndex + 1} must contain 7 or 3000 values.`)
    }
    return tokens.map((token, columnIndex) => {
      const value = Number(token)
      if (!Number.isFinite(value)) {
        throw new TypeError(`Sleep value at row ${rowIndex + 1}, column ${columnIndex + 1} is not a finite number.`)
      }
      return value
    })
  })

  if (rows.length === 7 && rows.every((row) => row.length === 3000)) {
    return validateSleepWindow(
      Array.from({ length: 3000 }, (_, sampleIndex) =>
        rows.map((channel) => channel[sampleIndex]),
      ),
    )
  }

  if (rows.length !== 3000 || rows.some((row) => row.length !== 7)) {
    throw new TypeError(
      'Sleep CSV must contain one epoch as either 3000 samples × 7 channels or 7 channels × 3000 samples.',
    )
  }

  return validateSleepWindow(rows)
}
