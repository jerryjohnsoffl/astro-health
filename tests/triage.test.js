import assert from 'node:assert/strict'
import test from 'node:test'
import { checkMeasurement, checkSymptoms, triage } from '../src/engine/index.js'

test('triage selects the highest configured measurement and symptom level', () => {
  const measurement = checkMeasurement(
    {
      id: 'sample-reading',
      unit: 'unit',
      thresholds: [
        { status: 'normal', min: 0, max: 10 },
        { status: 'attention', min: 10, minInclusive: false, triageLevel: 'urgent' },
      ],
    },
    11,
  )
  const symptoms = checkSymptoms(['symptom-a'], [
    { id: 'condition-a', symptoms: ['symptom-a'], triageLevel: 'emergency' },
  ])

  const result = triage({ measurements: [measurement], symptoms })

  assert.equal(result.level, 'emergency')
  assert.equal(result.requiresReview, true)
  assert.equal(result.reasons.some((reason) => reason.source === 'measurement'), true)
  assert.equal(result.reasons.some((reason) => reason.source === 'condition'), true)
})

test('triage preserves a known urgent result when another input is unknown', () => {
  const symptoms = checkSymptoms(['unmatched-symptom'], [])

  const result = triage({
    measurements: [
      {
        measurementId: 'sample-reading',
        status: 'attention',
        triageLevel: 'urgent',
      },
    ],
    symptoms,
  })

  assert.equal(result.level, 'urgent')
  assert.equal(result.requiresReview, true)
})

test('triage does not treat an empty or unclassified assessment as routine', () => {
  assert.deepEqual(triage(), {
    level: 'unknown',
    requiresReview: true,
    reasons: [],
  })

  const symptoms = checkSymptoms([], [])
  assert.equal(triage({ symptoms }).level, 'unknown')
})

test('triage rejects malformed inputs instead of silently assigning a level', () => {
  assert.throws(() => triage({ measurements: null }), /measurements must be an array/)
  assert.throws(() => triage({ measurements: [{ measurementId: '', status: 'normal' }] }), /id/)
})
