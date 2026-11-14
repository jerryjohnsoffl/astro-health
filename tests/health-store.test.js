import assert from 'node:assert/strict'
import test from 'node:test'

const storage = new Map()
globalThis.window = {
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null
    },
    setItem(key, value) {
      storage.set(key, value)
    },
    removeItem(key) {
      storage.delete(key)
    },
  },
}

const {
  clearHealthState,
  getHealthState,
  recordMeasurement,
  saveCDSSAssessment,
  saveSensorAnalysis,
  saveWellbeingCheckIn,
  setRegionStatus,
  setSymptoms,
  subscribeToHealthState,
} = await import('../src/store/useHealthStore.js')

test('recordMeasurement evaluates known inputs and persists the latest reading', () => {
  clearHealthState()
  let notifications = 0
  const unsubscribe = subscribeToHealthState(() => {
    notifications += 1
  })

  const state = recordMeasurement('heart_rate', 72, '2026-11-15T00:00:00.000Z')

  assert.deepEqual(state.measurements.heart_rate, {
    measurementId: 'heart_rate',
    value: 72,
    unit: 'bpm',
    status: 'unclassified',
    triageLevel: 'unknown',
    matchedThreshold: null,
    recordedAt: '2026-11-15T00:00:00.000Z',
  })
  assert.equal(state.triage.level, 'unknown')
  assert.equal(notifications, 1)
  assert.deepEqual(JSON.parse(storage.get('astro-health-state')).measurements, [
    {
      measurementId: 'heart_rate',
      value: 72,
      recordedAt: '2026-11-15T00:00:00.000Z',
    },
  ])
  unsubscribe()
})

test('setSymptoms and region statuses update and persist health state', () => {
  clearHealthState()

  const state = setSymptoms(['headache', 'headache'])
  assert.deepEqual(state.symptomIds, ['headache'])
  assert.deepEqual(state.symptomAssessment.unmatchedSymptoms, ['headache'])
  assert.equal(state.triage.level, 'unknown')

  const withRegion = setRegionStatus('neuro', 'watch')
  assert.equal(withRegion.regionStatuses.neuro, 'watch')

  const clearedRegion = setRegionStatus('neuro', null)
  assert.equal('neuro' in clearedRegion.regionStatuses, false)
  assert.deepEqual(JSON.parse(storage.get('astro-health-state')).symptomIds, ['headache'])
})

test('health state updates reject unknown measurements and invalid values', () => {
  const before = getHealthState()

  assert.throws(() => recordMeasurement('unknown-measurement', 1), /not defined/)
  assert.throws(() => recordMeasurement('heart_rate', Number.NaN), /finite number/)
  assert.throws(() => recordMeasurement('heart_rate', 1, 'not-a-date'), /valid date/)
  assert.throws(() => setSymptoms('headache'), /array/)
  assert.throws(() => setRegionStatus('neuro', 'critical'), /unsupported status/)
  assert.strictEqual(getHealthState(), before)
})

test('health state restores validated data from persistence', async () => {
  storage.set(
    'astro-health-state',
    JSON.stringify({
      measurements: [
        {
          measurementId: 'sleep_hours',
          value: 7,
          recordedAt: '2026-11-14T22:00:00.000Z',
        },
      ],
      symptomIds: [],
      regionStatuses: { neuro: 'normal' },
    }),
  )

  const restoredStore = await import('../src/store/useHealthStore.js?restore-test')
  const restoredState = restoredStore.getHealthState()

  assert.equal(restoredState.measurements.sleep_hours.value, 7)
  assert.equal(restoredState.measurements.sleep_hours.status, 'unclassified')
  assert.equal(restoredState.regionStatuses.neuro, 'normal')
})

test('latest wellbeing, CDSS, and sensor records persist across reloads', async () => {
  clearHealthState()
  const checkIn = {
    sleepHours: 7.5,
    sleepQuality: 4,
    awakenings: 1,
    rested: 3,
  }
  const cdssInput = {
    symptoms: { headache: 1 },
    context: { heart_rate: 72 },
  }
  const predictions = [{ name: 'normal', probability: 0.8 }]
  const ecgSamples = Array.from({ length: 180 }, (_, index) => Math.sin(index / 8))
  const sleepSamples = Array.from({ length: 3000 }, () => Array(7).fill(0.25))

  saveWellbeingCheckIn(checkIn)
  saveCDSSAssessment(cdssInput, predictions)
  saveSensorAnalysis('ecg', 'beat.csv', ecgSamples, predictions)
  const state = saveSensorAnalysis('sleep', 'epoch.csv', sleepSamples, predictions)
  const persisted = JSON.parse(storage.get('astro-health-state'))

  assert.deepEqual(state.wellbeingCheckIn, {
    ...checkIn,
    recordedAt: state.wellbeingCheckIn.recordedAt,
  })
  assert.deepEqual(state.cdssAssessment.input, cdssInput)
  assert.deepEqual(state.cdssAssessment.predictions, predictions)
  assert.deepEqual(state.sensorAnalyses.ecg.samples, ecgSamples)
  assert.equal(state.sensorAnalyses.sleep.samples.length, 3000)
  assert.deepEqual(persisted.wellbeingCheckIn, state.wellbeingCheckIn)
  assert.deepEqual(persisted.sensorAnalyses.sleep.samples[0], Array(7).fill(0.25))

  const restoredStore = await import('../src/store/useHealthStore.js?restore-latest')
  const restoredState = restoredStore.getHealthState()
  assert.deepEqual(restoredState.wellbeingCheckIn, state.wellbeingCheckIn)
  assert.deepEqual(restoredState.cdssAssessment, state.cdssAssessment)
  assert.deepEqual(restoredState.sensorAnalyses.ecg.samples, ecgSamples)
  assert.deepEqual(restoredState.sensorAnalyses.ecg.predictions, predictions)
  assert.deepEqual(restoredState.sensorAnalyses.sleep.samples[0], Array(7).fill(0.25))
})
