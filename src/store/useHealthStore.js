import { useSyncExternalStore } from 'react'
import { conditions } from '../data/conditions.js'
import { measurements as measurementDefinitions } from '../data/measurements.js'
import { checkMeasurement, checkSymptoms, triage } from '../engine/index.js'
import { readPersisted, writePersisted } from './persist.js'

const STORAGE_KEY = 'astro-health-state'
const REGION_STATUSES = new Set(['normal', 'watch', 'attention', 'unclassified'])
const measurementDefinitionsById = new Map(
  measurementDefinitions.map((definition) => [definition.id, definition]),
)

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty string.`)
  }
  return value.trim()
}

function normalizeTimestamp(value, label) {
  const timestamp = assertNonEmptyString(value, label)
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new TypeError(`${label} must be a valid date string.`)
  }
  return new Date(timestamp).toISOString()
}

function normalizePredictions(value, label) {
  if (value === null) {
    return null
  }
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array or null.`)
  }
  return value.map((prediction, index) => {
    if (!isRecord(prediction)) {
      throw new TypeError(`${label} item at index ${index} must be an object.`)
    }
    const name = assertNonEmptyString(prediction.name, `${label} item at index ${index} name`)
    if (!Number.isFinite(prediction.probability) || prediction.probability < 0 || prediction.probability > 1) {
      throw new TypeError(`${label} item "${name}" must have a probability from 0 to 1.`)
    }
    if (prediction.description !== undefined && typeof prediction.description !== 'string') {
      throw new TypeError(`${label} item "${name}" description must be a string.`)
    }
    return {
      name,
      probability: prediction.probability,
      ...(prediction.description === undefined ? {} : { description: prediction.description }),
    }
  })
}

function normalizeWellbeingCheckIn(value) {
  if (value === null) {
    return null
  }
  if (!isRecord(value)) {
    throw new TypeError('Saved wellbeing check-in must be an object or null.')
  }
  if (!Number.isFinite(value.sleepHours) || value.sleepHours < 0 || value.sleepHours > 24) {
    throw new TypeError('Sleep hours must be a number from 0 to 24.')
  }
  if (!Number.isInteger(value.sleepQuality) || value.sleepQuality < 1 || value.sleepQuality > 5) {
    throw new TypeError('Sleep quality must be an integer from 1 to 5.')
  }
  if (!Number.isInteger(value.awakenings) || value.awakenings < 0 || value.awakenings > 50) {
    throw new TypeError('Awakenings must be an integer from 0 to 50.')
  }
  if (!Number.isInteger(value.rested) || value.rested < 1 || value.rested > 5) {
    throw new TypeError('Rested rating must be an integer from 1 to 5.')
  }
  return {
    sleepHours: value.sleepHours,
    sleepQuality: value.sleepQuality,
    awakenings: value.awakenings,
    rested: value.rested,
    recordedAt: normalizeTimestamp(value.recordedAt, 'Wellbeing check-in timestamp'),
  }
}

function normalizeCDSSAssessment(value) {
  if (value === null) {
    return null
  }
  if (!isRecord(value) || !isRecord(value.input)) {
    throw new TypeError('Saved CDSS assessment must include an input object.')
  }
  const { symptoms, context } = value.input
  if (!isRecord(symptoms) || !isRecord(context)) {
    throw new TypeError('Saved CDSS input must include symptom and context objects.')
  }
  for (const [name, severity] of Object.entries(symptoms)) {
    assertNonEmptyString(name, 'CDSS symptom name')
    if (!Number.isFinite(severity) || severity < 0 || severity > 3) {
      throw new TypeError(`CDSS symptom "${name}" severity must be a number from 0 to 3.`)
    }
  }
  for (const [name, measurement] of Object.entries(context)) {
    assertNonEmptyString(name, 'CDSS context name')
    if (!Number.isFinite(measurement)) {
      throw new TypeError(`CDSS context "${name}" must be a finite number.`)
    }
  }

  return {
    input: { symptoms: { ...symptoms }, context: { ...context } },
    predictions: normalizePredictions(value.predictions, 'CDSS predictions'),
    recordedAt: normalizeTimestamp(value.recordedAt, 'CDSS assessment timestamp'),
  }
}

function normalizeSensorAnalysis(modelId, value) {
  if (value === null) {
    return null
  }
  if (!isRecord(value)) {
    throw new TypeError(`Saved ${modelId} analysis must be an object or null.`)
  }
  const fileName = assertNonEmptyString(value.fileName, `${modelId} file name`)
  if (!Array.isArray(value.samples)) {
    throw new TypeError(`${modelId} samples must be an array.`)
  }

  let samples
  if (modelId === 'ecg') {
    if (value.samples.length !== 180 || value.samples.some((sample) => !Number.isFinite(sample))) {
      throw new TypeError('Saved ECG data must contain exactly 180 finite samples.')
    }
    samples = [...value.samples]
    const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length
    const variance = samples.reduce((sum, sample) => sum + (sample - mean) ** 2, 0) / samples.length
    if (variance === 0) {
      throw new TypeError('Saved ECG data must not be a constant signal.')
    }
  } else {
    if (
      value.samples.length !== 3000 ||
      value.samples.some(
        (row) => !Array.isArray(row) || row.length !== 7 || row.some((sample) => !Number.isFinite(sample)),
      )
    ) {
      throw new TypeError('Saved sleep data must contain exactly 3000 rows of 7 finite samples.')
    }
    samples = value.samples.map((row) => [...row])
  }

  return {
    fileName,
    samples,
    predictions: normalizePredictions(value.predictions, `${modelId} predictions`),
    recordedAt: normalizeTimestamp(value.recordedAt, `${modelId} analysis timestamp`),
  }
}

function normalizePersistedState(value) {
  if (!isRecord(value)) {
    throw new TypeError('Saved health state must be an object.')
  }

  if (!Array.isArray(value.measurements)) {
    throw new TypeError('Saved health measurements must be an array.')
  }
  const measurements = value.measurements.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new TypeError(`Saved measurement at index ${index} must be an object.`)
    }

    const measurementId = assertNonEmptyString(
      entry.measurementId,
      `Saved measurement at index ${index} id`,
    )
    if (!measurementDefinitionsById.has(measurementId)) {
      throw new TypeError(`Saved measurement "${measurementId}" is not defined.`)
    }
    if (!Number.isFinite(entry.value)) {
      throw new TypeError(`Saved measurement "${measurementId}" must have a finite value.`)
    }

    return {
      measurementId,
      value: entry.value,
      recordedAt: normalizeTimestamp(
        entry.recordedAt,
        `Saved measurement "${measurementId}" timestamp`,
      ),
    }
  })

  if (!Array.isArray(value.symptomIds)) {
    throw new TypeError('Saved symptom ids must be an array.')
  }
  const symptomIds = [...new Set(
    value.symptomIds.map((id, index) => assertNonEmptyString(id, `Saved symptom at index ${index}`)),
  )]

  if (!isRecord(value.regionStatuses)) {
    throw new TypeError('Saved region statuses must be an object.')
  }
  const regionStatuses = {}
  for (const [regionId, status] of Object.entries(value.regionStatuses)) {
    const normalizedRegionId = assertNonEmptyString(regionId, 'Region id')
    if (!REGION_STATUSES.has(status)) {
      throw new TypeError(`Saved region "${normalizedRegionId}" has an unsupported status.`)
    }
    regionStatuses[normalizedRegionId] = status
  }

  const sensorAnalyses = value.sensorAnalyses ?? {}
  if (!isRecord(sensorAnalyses)) {
    throw new TypeError('Saved sensor analyses must be an object.')
  }

  return {
    measurements,
    symptomIds,
    regionStatuses,
    wellbeingCheckIn: normalizeWellbeingCheckIn(value.wellbeingCheckIn ?? null),
    cdssAssessment: normalizeCDSSAssessment(value.cdssAssessment ?? null),
    sensorAnalyses: {
      ecg: normalizeSensorAnalysis('ecg', sensorAnalyses.ecg ?? null),
      sleep: normalizeSensorAnalysis('sleep', sensorAnalyses.sleep ?? null),
    },
  }
}

function createHealthSnapshot(data) {
  const measurementResults = {}
  for (const entry of data.measurements) {
    const definition = measurementDefinitionsById.get(entry.measurementId)
    const result = checkMeasurement(definition, entry.value)
    measurementResults[entry.measurementId] = {
      ...result,
      recordedAt: entry.recordedAt,
    }
  }

  const symptomAssessment = checkSymptoms(data.symptomIds, conditions)
  return {
    measurements: measurementResults,
    symptomIds: [...data.symptomIds],
    symptomAssessment,
    regionStatuses: { ...data.regionStatuses },
    wellbeingCheckIn: data.wellbeingCheckIn,
    cdssAssessment: data.cdssAssessment,
    sensorAnalyses: data.sensorAnalyses,
    triage: triage({
      measurements: Object.values(measurementResults),
      symptoms: symptomAssessment,
    }),
  }
}

function snapshotForPersistence(snapshot) {
  return {
    measurements: Object.values(snapshot.measurements).map(
      ({ measurementId, value, recordedAt }) => ({ measurementId, value, recordedAt }),
    ),
    symptomIds: snapshot.symptomIds,
    regionStatuses: snapshot.regionStatuses,
    wellbeingCheckIn: snapshot.wellbeingCheckIn,
    cdssAssessment: snapshot.cdssAssessment,
    sensorAnalyses: snapshot.sensorAnalyses,
  }
}

function emptyHealthData() {
  return {
    measurements: [],
    symptomIds: [],
    regionStatuses: {},
    wellbeingCheckIn: null,
    cdssAssessment: null,
    sensorAnalyses: { ecg: null, sleep: null },
  }
}

function restoreHealthState() {
  const savedState = readPersisted(STORAGE_KEY)
  if (savedState === null) {
    return createHealthSnapshot(emptyHealthData())
  }

  try {
    return createHealthSnapshot(normalizePersistedState(savedState))
  } catch (error) {
    console.error('Saved AstroHealth health state is invalid; using an empty state.', error)
    return createHealthSnapshot(emptyHealthData())
  }
}

let healthSnapshot = restoreHealthState()
const subscribers = new Set()

function subscribe(callback) {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

function getSnapshot() {
  return healthSnapshot
}

function commitHealthState(data) {
  const nextSnapshot = createHealthSnapshot(normalizePersistedState(data))
  writePersisted(STORAGE_KEY, snapshotForPersistence(nextSnapshot))
  healthSnapshot = nextSnapshot
  subscribers.forEach((callback) => callback())
  return healthSnapshot
}

export function getHealthState() {
  return healthSnapshot
}

export function subscribeToHealthState(callback) {
  return subscribe(callback)
}

export function recordMeasurement(measurementId, value, recordedAt = new Date().toISOString()) {
  const normalizedId = assertNonEmptyString(measurementId, 'Measurement id')
  if (!measurementDefinitionsById.has(normalizedId)) {
    throw new TypeError(`Measurement "${normalizedId}" is not defined.`)
  }
  if (!Number.isFinite(value)) {
    throw new TypeError('Measurement value must be a finite number.')
  }
  if (typeof recordedAt !== 'string' || !Number.isFinite(Date.parse(recordedAt))) {
    throw new TypeError('Measurement timestamp must be a valid date string.')
  }

  const current = snapshotForPersistence(healthSnapshot)
  const measurements = current.measurements.filter(
    (measurement) => measurement.measurementId !== normalizedId,
  )
  measurements.push({
    measurementId: normalizedId,
    value,
    recordedAt: new Date(recordedAt).toISOString(),
  })

  return commitHealthState({ ...current, measurements })
}

export function saveWellbeingCheckIn(checkIn) {
  const current = snapshotForPersistence(healthSnapshot)
  return commitHealthState({
    ...current,
    wellbeingCheckIn: normalizeWellbeingCheckIn({
      ...checkIn,
      recordedAt: checkIn.recordedAt ?? new Date().toISOString(),
    }),
  })
}

export function saveCDSSAssessment(input, predictions = null) {
  const current = snapshotForPersistence(healthSnapshot)
  return commitHealthState({
    ...current,
    cdssAssessment: normalizeCDSSAssessment({
      input,
      predictions,
      recordedAt: new Date().toISOString(),
    }),
  })
}

export function saveSensorAnalysis(modelId, fileName, samples, predictions = null) {
  if (modelId !== 'ecg' && modelId !== 'sleep') {
    throw new TypeError('Sensor analysis model must be "ecg" or "sleep".')
  }
  const current = snapshotForPersistence(healthSnapshot)
  return commitHealthState({
    ...current,
    sensorAnalyses: {
      ...current.sensorAnalyses,
      [modelId]: normalizeSensorAnalysis(modelId, {
        fileName,
        samples,
        predictions,
        recordedAt: new Date().toISOString(),
      }),
    },
  })
}

export function setSymptoms(symptomIds) {
  if (!Array.isArray(symptomIds)) {
    throw new TypeError('Symptoms must be an array of ids.')
  }
  const normalizedSymptomIds = [...new Set(
    symptomIds.map((id, index) => assertNonEmptyString(id, `Symptom at index ${index}`)),
  )]
  const current = snapshotForPersistence(healthSnapshot)
  return commitHealthState({ ...current, symptomIds: normalizedSymptomIds })
}

export function setRegionStatus(regionId, status) {
  const normalizedRegionId = assertNonEmptyString(regionId, 'Region id')
  if (status !== null && !REGION_STATUSES.has(status)) {
    throw new TypeError(`Region "${normalizedRegionId}" has an unsupported status.`)
  }

  const current = snapshotForPersistence(healthSnapshot)
  const regionStatuses = { ...current.regionStatuses }
  if (status === null) {
    delete regionStatuses[normalizedRegionId]
  } else {
    regionStatuses[normalizedRegionId] = status
  }
  return commitHealthState({ ...current, regionStatuses })
}

export function clearHealthState() {
  return commitHealthState(emptyHealthData())
}

export function useHealthStore() {
  const healthState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return {
    healthState,
    recordMeasurement,
    saveWellbeingCheckIn,
    saveCDSSAssessment,
    saveSensorAnalysis,
    setSymptoms,
    setRegionStatus,
    clearHealthState,
  }
}
