import { conditions } from '../data/conditions.js'
import { measurements } from '../data/measurements.js'
import { sources } from '../data/sources.js'
import { ANATOMY_VIEWBOX, validateCatalogue } from './classifier.js'
import catalogue from './catalogue.json'

export const anatomyCatalogue = catalogue

export function validateAnatomyCatalogue(catalogue) {
  if (
    catalogue?.viewBox?.x !== ANATOMY_VIEWBOX.x ||
    catalogue?.viewBox?.y !== ANATOMY_VIEWBOX.y ||
    catalogue?.viewBox?.width !== ANATOMY_VIEWBOX.width ||
    catalogue?.viewBox?.height !== ANATOMY_VIEWBOX.height
  ) {
    return ['Catalogue viewBox must match the artwork coordinates.']
  }
  return validateCatalogue(catalogue, {
    conditions: new Set(conditions.map(({ id }) => id)),
    measurements: new Set(measurements.map(({ id }) => id)),
    sources: new Set(sources.map(({ id }) => id)),
  })
}
