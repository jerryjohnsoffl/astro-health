import assert from 'node:assert/strict'
import test from 'node:test'
import { CONTEXT, FEATURE_NAMES, SYMPTOMS } from '../src/ml/features.js'
import {
  encodeCDSSRecord,
  normalizeEcgWindow,
  parseEcgCsv,
  parseEcgCsvSamples,
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
  const rawSamples = Array.from({ length: 180 }, (_, index) => index)
  const normalized = normalizeEcgWindow(rawSamples)
  const parsedRawSamples = parseEcgCsvSamples(rawSamples.join('\n'))
  const rowCsv = parseEcgCsv(rawSamples.join(','))
  const columnCsv = parseEcgCsv(rawSamples.join('\n'))
  const mean = normalized.reduce((sum, value) => sum + value, 0) / normalized.length
  const variance = normalized.reduce((sum, value) => sum + value ** 2, 0) / normalized.length

  assert.ok(Math.abs(mean) < 1e-12)
  assert.ok(Math.abs(variance - 1) < 1e-12)
  assert.deepEqual(parsedRawSamples, rawSamples)
  assert.deepEqual(rowCsv, normalized)
  assert.deepEqual(columnCsv, normalized)
  assert.throws(() => normalizeEcgWindow([1, 2]), /exactly 180/)
  assert.throws(() => normalizeEcgWindow(Array(180).fill(4)), /constant signal/)
  assert.throws(() => parseEcgCsv(rawSamples.slice(0, 179).join(',')), /exactly 180/)
  assert.throws(() => parseEcgCsv(`sample\n${rawSamples.join('\n')}`), /sample 1/)
  assert.throws(() => parseEcgCsv('1,not-a-number'), /sample 2/)
})

test('sleep preprocessing accepts either channel-major or sample-major epochs', () => {
  const window = Array.from({ length: 3000 }, () => Array(7).fill(0))
  const channelMajor = Array.from({ length: 7 }, (_, channelIndex) =>
    Array.from({ length: 3000 }, (_, sampleIndex) => channelIndex * 10000 + sampleIndex),
  )
  const channelMajorCsv = channelMajor.map((channel) => channel.join(',')).join('\n')
  const converted = parseSleepCsv(channelMajorCsv)

  assert.equal(validateSleepWindow(window).length, 3000)
  assert.deepEqual(converted[0], [0, 10000, 20000, 30000, 40000, 50000, 60000])
  assert.deepEqual(converted[2999], [2999, 12999, 22999, 32999, 42999, 52999, 62999])
  assert.deepEqual(
    parseSleepCsv(window.map((row) => row.join(',')).join('\n')),
    window,
  )
  assert.throws(() => validateSleepWindow(window.slice(0, 2999)), /3000 rows/)
  assert.throws(() => validateSleepWindow([[1, 2, 3]]), /3000 rows/)
  assert.throws(() => parseSleepCsv('1,2,3'), /row 1/)
  assert.throws(() => parseSleepCsv(`${Array(7).fill('1').join(',')}\n${Array(7).fill('x').join(',')}`), /row 2, column 1/)
})
