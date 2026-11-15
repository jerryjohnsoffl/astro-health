import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCsvReport,
  createHealthReport,
  createPdfReport,
} from '../src/report/exportReport.js'

function emptyHealthState() {
  return {
    measurements: {},
    symptomIds: [],
    regionStatuses: {},
    wellbeingCheckIn: null,
    cdssAssessment: null,
    sensorAnalyses: { ecg: null, sleep: null },
    triage: { level: 'unknown', reasons: [] },
  }
}

const settings = {
  environment: 'mars-transit',
  units: 'metric',
  crewProfile: { crewId: 'C-01', displayName: 'Crew Member' },
}

test('health report includes saved wellness, predictions, and sensor metadata but not samples', () => {
  const healthState = emptyHealthState()
  healthState.wellbeingCheckIn = {
    sleepHours: 7,
    sleepQuality: 4,
    awakenings: 1,
    rested: 3,
    recordedAt: '2026-11-15T10:00:00.000Z',
  }
  healthState.cdssAssessment = {
    input: { context: {}, symptoms: {} },
    predictions: [{ name: 'Example result', probability: 0.75 }],
    recordedAt: '2026-11-15T11:00:00.000Z',
  }
  healthState.sensorAnalyses.ecg = {
    fileName: 'ecg.csv',
    samples: [1, 2, 3],
    predictions: [{ name: 'Normal', probability: 0.9 }],
    recordedAt: '2026-11-15T12:00:00.000Z',
  }

  const rows = createHealthReport(healthState, settings, '2026-11-16T00:00:00.000Z')

  assert.ok(rows.some(({ item, value }) => item === 'Sleep duration' && value === 7))
  assert.ok(rows.some(({ item, value }) => item === 'Example result' && value === '75.0%'))
  assert.ok(rows.some(({ item, value }) => item === 'ECG file' && value === 'ecg.csv'))
  assert.ok(rows.some(({ notes }) => notes === 'Raw samples are not included.'))
  assert.ok(!JSON.stringify(rows).includes('"samples"'))
})

test('CSV quotes fields and neutralizes spreadsheet formulas', () => {
  const csv = createCsvReport([
    {
      section: 'Crew',
      item: 'Name',
      value: '=IMPORT("private")',
      unit: '',
      recordedAt: '',
      notes: 'Said "hello"',
    },
  ])

  assert.match(csv, /"'=IMPORT\(""private""\)"/)
  assert.match(csv, /"Said ""hello"""/)
})

test('PDF output has a valid header and cross-reference offsets', () => {
  const pdf = createPdfReport([
    { section: 'Report', item: 'Generated at', value: '2026-11-16T00:00:00.000Z' },
    { section: 'Crew profile', item: 'Display name', value: 'Crew Member' },
    { section: 'Crew profile', item: 'Crew ID', value: 'C-01' },
    { section: 'Mission context', item: 'Environment', value: 'Mars transit' },
    { section: 'Mission context', item: 'Units', value: 'metric' },
    { section: 'Health', item: 'Value (mmHg)', value: '120', unit: 'mmHg' },
  ])
  const startXref = Number(pdf.match(/startxref\n(\d+)\n%%EOF$/)[1])

  assert.ok(pdf.startsWith('%PDF-1.4\n'))
  assert.equal(pdf.slice(startXref, startXref + 4), 'xref')
  assert.ok(pdf.includes('(MEDICAL HEALTH REPORT)'))
  assert.ok(pdf.includes('(Name: Crew Member)'))
  assert.ok(pdf.includes('(Crew ID: C-01)'))
  assert.match(pdf, /BT \/F1 10 Tf 4\d{2}\.\d{2} 740\.00 Td \(Name: Crew Member\)/)
  assert.ok(pdf.includes('(Date:'))
  assert.ok(pdf.includes('(Time:'))
  assert.ok(pdf.includes('50.00 616.00 Td (Value \\(mmHg\\))'))
  assert.match(pdf, /BT \/F1 9 Tf 5\d{2}\.\d{2} 616\.00 Td \(120 mmHg\)/)
})
