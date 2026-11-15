import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyPoint,
  pointInPolygon,
  pointerToSvgPoint,
  structuresInRegion,
  validateCatalogue,
  viewBoxFor,
} from '../src/anatomy/classifier.js'
import { conditions } from '../src/data/conditions.js'
import { measurements } from '../src/data/measurements.js'
import { sources } from '../src/data/sources.js'
import { getModelAnatomyIndicators } from '../src/anatomy/modelIndicators.js'

const square = [[300, 100], [400, 100], [400, 200], [300, 200]]
const structures = [
  { id: 'kidney', layer: 'renal', view: 'front', polygon: square, regionIds: ['abdomen'] },
  { id: 'ribcage', layer: 'skeleton', view: 'front', polygon: square, regionIds: ['chest'] },
  { id: 'back-only', layer: 'renal', view: 'back', polygon: square, regionIds: ['abdomen'] },
]

test('point classifier filters by view and visible layer and prioritizes the active layer', () => {
  const hits = classifyPoint(350, 150, 'front', structures, {
    visibleLayers: ['skeleton', 'renal'],
    activeLayer: 'renal',
  })

  assert.deepEqual(hits.map(({ id }) => id), ['kidney', 'ribcage'])
  assert.deepEqual(
    classifyPoint(350, 150, 'front', structures, { visibleLayers: ['renal'] }).map(({ id }) => id),
    ['kidney'],
  )
})

test('point-in-polygon rejects degenerate outlines and detects interior points', () => {
  assert.equal(pointInPolygon(350, 150, square), true)
  assert.equal(pointInPolygon(450, 150, square), false)
  assert.equal(pointInPolygon(1, 1, [[0, 0], [1, 1]]), false)
})

test('pointer conversion accounts for object-contain offsets and SVG viewBox origin', () => {
  const rect = { left: 10, top: 20, width: 200, height: 300 }
  assert.deepEqual(pointerToSvgPoint(110, 120, rect), { x: 705, y: 259.5 })
  assert.equal(pointerToSvgPoint(110, 25, rect), null)
  assert.equal(pointerToSvgPoint(110, 70, { ...rect, width: 0 }), null)
})

test('front and back views map to their distinct halves of the shared coordinate space', () => {
  assert.deepEqual(viewBoxFor('front'), { x: 200, y: 0, width: 505, height: 1024 })
  assert.deepEqual(viewBoxFor('back'), { x: 705, y: 0, width: 505, height: 1024 })
  assert.deepEqual(
    pointerToSvgPoint(252.5, 512, { left: 0, top: 0, width: 505, height: 1024 }, viewBoxFor('back')),
    { x: 957.5, y: 512 },
  )
  assert.throws(() => viewBoxFor('side'), /front.*back/)
})

test('polygon edges count as hits', () => {
  assert.equal(pointInPolygon(300, 150, square), true)
})

test('structuresInRegion returns every linked structure', () => {
  assert.deepEqual(
    structuresInRegion('abdomen', structures).map(({ id }) => id),
    ['kidney', 'back-only'],
  )
})

test('catalogue validation checks uniqueness, bounds, region membership, and content links', () => {
  const catalog = {
    version: 1,
    viewBox: { x: 200, y: 0, width: 1010, height: 1024 },
    regions: [{ id: 'abdomen', name: 'Abdomen', view: 'front', polygon: square }],
    structures: [{
      id: 'kidney',
      name: 'Kidneys',
      kind: 'organ',
      layer: 'renal',
      view: 'front',
      polygon: square,
      regionIds: ['abdomen'],
      conditionIds: ['renal-stone-formation'],
      measurementIds: ['fluid_intake_l'],
      sourceIds: ['nasa-renal-stone-evidence'],
    }],
  }
  const contentIds = {
    conditions: new Set(conditions.map(({ id }) => id)),
    measurements: new Set(measurements.map(({ id }) => id)),
    sources: new Set(sources.map(({ id }) => id)),
  }

  assert.deepEqual(validateCatalogue(catalog, contentIds), [])
  assert.ok(validateCatalogue({
    ...catalog,
    structures: [{ ...catalog.structures[0], polygon: [[200, 0], [1300, 0], [200, 10]] }],
  }, contentIds).some((error) => error.includes('outside the viewBox')))
  assert.ok(validateCatalogue({
    ...catalog,
    structures: [{ ...catalog.structures[0], conditionIds: ['not-a-condition'] }],
  }, contentIds).some((error) => error.includes('unknown conditionIds')))
  assert.ok(validateCatalogue({
    ...catalog,
    structures: [{ ...catalog.structures[0], view: 'back' }],
  }, contentIds).some((error) => error.includes('different views')))
  assert.ok(validateCatalogue({
    ...catalog,
    structures: [],
  }, contentIds).some((error) => error.includes('has no structures')))
})

test('model indicators highlight only anatomy explicitly linked to the top CDSS result', () => {
  const catalogue = {
    structures: [
      { id: 'brain-front', name: 'Brain', layer: 'neuro', kind: 'organ', conditionIds: ['sans'] },
      { id: 'kidney-front', name: 'Kidney', layer: 'renal', kind: 'organ', conditionIds: ['renal-stone-formation'] },
      { id: 'heart-front', name: 'Heart', layer: 'cardio', kind: 'organ', conditionIds: [] },
    ],
  }
  const healthState = {
    cdssAssessment: {
      predictions: [
        { name: 'sans', probability: 0.61 },
        { name: 'renal-stone-formation', probability: 0.25 },
      ],
      recordedAt: '2026-11-15T00:00:00.000Z',
    },
    sensorAnalyses: {
      ecg: {
        predictions: [{ name: 'V', description: 'Ventricular ectopic', probability: 0.82 }],
        recordedAt: '2026-11-15T00:05:00.000Z',
      },
    },
  }

  assert.deepEqual(
    getModelAnatomyIndicators(healthState, catalogue).map(({ source, structureIds }) => ({
      source,
      structureIds,
    })),
    [
      { source: 'CDSS', structureIds: ['brain-front'] },
      { source: 'ECG', structureIds: ['heart-front'] },
    ],
  )
})

test('unmapped CDSS categories remain visible but do not infer anatomy', () => {
  const indicators = getModelAnatomyIndicators({
    cdssAssessment: {
      predictions: [{ name: 'cardiac-concern', probability: 0.7 }],
      recordedAt: '2026-11-15T00:00:00.000Z',
    },
    sensorAnalyses: { ecg: null },
  }, {
    structures: [{ id: 'heart-front', layer: 'cardio', kind: 'organ', conditionIds: [] }],
  })

  assert.equal(indicators[0].label, 'cardiac-concern')
  assert.deepEqual(indicators[0].structureIds, [])
})
