import assert from 'node:assert/strict'
import test from 'node:test'
import { getVitalsSnapshot } from '../src/overview/vitalsSnapshot.js'

function emptyHealthState() {
  return {
    measurements: {},
    cdssAssessment: null,
    wellbeingCheckIn: null,
  }
}

test('vitals snapshot leaves missing values unrecorded instead of using demo data', () => {
  const snapshot = getVitalsSnapshot(emptyHealthState())

  assert.equal(snapshot.length, 5)
  assert.ok(snapshot.every(({ value, source, recordedAt }) =>
    value === undefined && source === undefined && recordedAt === undefined,
  ))
})

test('vitals snapshot picks the newest saved value and labels its source', () => {
  const healthState = emptyHealthState()
  healthState.measurements.heart_rate = {
    value: 74,
    recordedAt: '2026-11-15T10:00:00.000Z',
  }
  healthState.cdssAssessment = {
    input: { context: { heart_rate: 81, spo2: 98, sleep_hours: 6 } },
    recordedAt: '2026-11-15T11:00:00.000Z',
  }
  healthState.wellbeingCheckIn = {
    sleepHours: 7.5,
    recordedAt: '2026-11-15T12:00:00.000Z',
  }

  const snapshot = getVitalsSnapshot(healthState)

  assert.deepEqual(snapshot.find(({ id }) => id === 'heart_rate'), {
    id: 'heart_rate',
    label: 'Heart rate',
    unit: 'bpm',
    value: 81,
    recordedAt: '2026-11-15T11:00:00.000Z',
    source: 'Self-check input',
  })
  assert.deepEqual(snapshot.find(({ id }) => id === 'sleep_hours'), {
    id: 'sleep_hours',
    label: 'Sleep (24 h)',
    unit: 'h',
    value: 7.5,
    recordedAt: '2026-11-15T12:00:00.000Z',
    source: 'Self-reported check-in',
  })
  assert.equal(snapshot.find(({ id }) => id === 'spo2').value, 98)
})
