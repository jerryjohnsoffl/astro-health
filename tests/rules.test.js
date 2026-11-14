import assert from 'node:assert/strict'
import test from 'node:test'
import { checkMeasurement, checkSymptoms } from '../src/engine/index.js'

const sampleMeasurement = {
  id: 'sample-reading',
  unit: 'unit',
  thresholds: [
    { status: 'normal', min: 0, max: 10 },
    { status: 'watch', min: 10, minInclusive: false, max: 15 },
    {
      status: 'attention',
      min: 15,
      minInclusive: false,
      triageLevel: 'urgent',
    },
  ],
}

test('checkMeasurement applies explicit inclusive and exclusive bounds', () => {
  assert.equal(checkMeasurement(sampleMeasurement, 10).status, 'normal')
  assert.equal(checkMeasurement(sampleMeasurement, 10.1).status, 'watch')
  assert.equal(checkMeasurement(sampleMeasurement, 15).status, 'watch')
  assert.equal(checkMeasurement(sampleMeasurement, 15.1).triageLevel, 'urgent')
})

test('checkMeasurement leaves values outside configured ranges unclassified', () => {
  const result = checkMeasurement(
    { id: 'sample-reading', unit: 'unit', thresholds: [{ status: 'normal', min: 0, max: 10 }] },
    -1,
  )

  assert.equal(result.status, 'unclassified')
  assert.equal(result.triageLevel, 'unknown')
  assert.equal(result.matchedThreshold, null)
})

test('checkMeasurement rejects overlapping or invalid threshold definitions', () => {
  assert.throws(
    () =>
      checkMeasurement(
        {
          id: 'sample-reading',
          unit: 'unit',
          thresholds: [
            { status: 'normal', min: 0, max: 10 },
            { status: 'watch', min: 10, max: 20 },
          ],
        },
        10,
      ),
    /overlap/,
  )
  assert.throws(() => checkMeasurement(sampleMeasurement, Number.NaN), /finite number/)
})

test('checkSymptoms returns matched conditions and red flags without probabilities', () => {
  const result = checkSymptoms(
    ['symptom-a', 'symptom-b', 'symptom-c'],
    [
      {
        id: 'condition-a',
        name: 'Condition A',
        symptoms: ['symptom-a', 'symptom-b'],
        redFlags: ['symptom-b'],
        triageLevel: 'emergency',
      },
    ],
  )

  assert.deepEqual(result.selectedSymptoms, ['symptom-a', 'symptom-b', 'symptom-c'])
  assert.deepEqual(result.matches[0].matchedSymptoms, ['symptom-a', 'symptom-b'])
  assert.equal(result.matches[0].triageLevel, 'emergency')
  assert.equal(result.redFlags[0].symptomId, 'symptom-b')
  assert.deepEqual(result.unmatchedSymptoms, ['symptom-c'])
  assert.equal('probability' in result.matches[0], false)
})

test('checkSymptoms rejects red flags without an urgent or emergency rule', () => {
  assert.throws(
    () =>
      checkSymptoms(['symptom-a'], [
        {
          id: 'condition-a',
          symptoms: ['symptom-a'],
          redFlags: ['symptom-a'],
          triageLevel: 'watch',
        },
      ]),
    /urgent or emergency/,
  )
})
