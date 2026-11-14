import assert from 'node:assert/strict'
import test from 'node:test'
import { checkMeasurement, checkSymptoms, triage } from '../src/engine/index.js'
import { conditions } from '../src/data/conditions.js'
import { environments } from '../src/data/environments.js'
import { measurements } from '../src/data/measurements.js'
import { sources } from '../src/data/sources.js'

test('research catalog source references resolve', () => {
  const sourceIds = new Set(sources.map(({ id }) => id))
  const records = [...conditions, ...measurements, ...environments]

  records.forEach(({ sourceIds: recordSourceIds }) => {
    recordSourceIds.forEach((sourceId) => assert.equal(sourceIds.has(sourceId), true))
  })
})

test('draft measurements remain unclassified without validated thresholds', () => {
  measurements.forEach((measurement) => {
    const result = checkMeasurement(measurement, 1)

    assert.equal(result.status, 'unclassified')
    assert.equal(result.triageLevel, 'unknown')
  })
})

test('draft conditions do not create symptom matches or triage rules', () => {
  conditions.forEach((condition) => {
    assert.deepEqual(condition.symptoms, [])
    assert.deepEqual(condition.redFlags, [])
    assert.equal('triageLevel' in condition, false)
  })

  const symptomAssessment = checkSymptoms(['headache', 'blurred_vision'], conditions)
  assert.equal(symptomAssessment.matches.length, 0)
  assert.equal(triage({ symptoms: symptomAssessment }).level, 'unknown')
})

test('environment profiles expose no unverified operational limits', () => {
  assert.equal(environments.some(({ id }) => id === 'mars-transit'), true)
  environments.forEach(({ operationalLimits }) => assert.deepEqual(operationalLimits, []))
})
