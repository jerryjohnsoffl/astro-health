import assert from 'node:assert/strict'
import test from 'node:test'
import { CONTEXT, FEATURE_NAMES, SYMPTOMS } from '../src/ml/features.js'
import {
  encodeCDSSRecord,
  normalizeEcgWindow,
  parseEcgCsv,
  parseSleepCsv,
  validateSleepWindow,
} from '../src/ml/preprocessing.js'

function validCDSSRecord() {
  return {
    symptoms: Object.fromEntries(SYMPTOMS.map((name) => [name, 0])),
    context: Object.fromEntries(CONTEXT.map(({ name, min, max }) => [name, (min + max) / 2])),
  }
}

test('CDSS encoding returns the ordered feature vector and rejects missing context', () => {
  const record = validCDSSRecord()
  const features = encodeCDSSRecord(record)

  assert.equal(features.length, FEATURE_NAMES.length)
  assert.equal(features[0], 0)
  assert.equal(features[22], 0.5)
  assert.throws(() => encodeCDSSRecord({ symptoms: {} }), /context must be an object/)
  assert.throws(() => encodeCDSSRecord({ ...record, context: {} }), /must be a finite number/)
})

test('ECG preprocessing standardizes a 180-sample window and rejects invalid signals', () => {
  const normalized = normalizeEcgWindow(Array.from({ length: 180 }, (_, index) => index))
  const mean = normalized.reduce((sum, value) => sum + value, 0) / normalized.length
  const variance = normalized.reduce((sum, value) => sum + value ** 2, 0) / normalized.length

  assert.ok(Math.abs(mean) < 1e-12)
  assert.ok(Math.abs(variance - 1) < 1e-12)
  assert.throws(() => normalizeEcgWindow([1, 2]), /exactly 180/)
  assert.throws(() => normalizeEcgWindow(Array(180).fill(4)), /constant signal/)
  assert.throws(() => parseEcgCsv('1,not-a-number'), /sample 2/)
})

test('sleep preprocessing requires exactly 3000 finite rows of 7 features', () => {
  const window = Array.from({ length: 3000 }, () => Array(7).fill(0))

  assert.equal(validateSleepWindow(window).length, 3000)
  assert.throws(() => validateSleepWindow(window.slice(0, 2999)), /3000 rows/)
  assert.throws(() => validateSleepWindow([[1, 2, 3]]), /3000 rows/)
  assert.throws(() => parseSleepCsv('1,2,3'), /row 1/)
  assert.throws(() => parseSleepCsv(`${Array(7).fill('1').join(',')}\n${Array(7).fill('x').join(',')}`), /row 2, column 1/)
})
