export const ANATOMY_VIEWBOX = Object.freeze({ x: 200, y: 0, width: 1010, height: 1024 })

export function viewBoxFor(view) {
  if (view !== 'front' && view !== 'back') {
    throw new TypeError('Anatomy view must be "front" or "back".')
  }
  return {
    x: view === 'front' ? ANATOMY_VIEWBOX.x : ANATOMY_VIEWBOX.x + ANATOMY_VIEWBOX.width / 2,
    y: ANATOMY_VIEWBOX.y,
    width: ANATOMY_VIEWBOX.width / 2,
    height: ANATOMY_VIEWBOX.height,
  }
}

export function pointerToSvgPoint(clientX, clientY, rect, viewBox = ANATOMY_VIEWBOX) {
  const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height)
  if (!Number.isFinite(scale) || scale <= 0) {
    return null
  }

  const renderedWidth = viewBox.width * scale
  const renderedHeight = viewBox.height * scale
  const offsetX = (rect.width - renderedWidth) / 2
  const offsetY = (rect.height - renderedHeight) / 2
  const localX = clientX - rect.left - offsetX
  const localY = clientY - rect.top - offsetY

  if (localX < 0 || localY < 0 || localX > renderedWidth || localY > renderedHeight) {
    return null
  }

  return {
    x: viewBox.x + localX / scale,
    y: viewBox.y + localY / scale,
  }
}

export function pointInPolygon(x, y, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) {
    return false
  }

  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const cross = (x - xi) * (yj - yi) - (y - yi) * (xj - xi)
    if (
      Math.abs(cross) < 1e-8 &&
      x >= Math.min(xi, xj) &&
      x <= Math.max(xi, xj) &&
      y >= Math.min(yi, yj) &&
      y <= Math.max(yi, yj)
    ) {
      return true
    }
    const crosses = (yi > y) !== (yj > y)
    if (crosses && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function classifyPoint(
  x,
  y,
  view,
  structures,
  { visibleLayers = [], activeLayer = null } = {},
) {
  const visible = new Set(visibleLayers)
  return structures
    .filter((structure) =>
      structure.view === view &&
      (visible.size === 0 || visible.has(structure.layer)) &&
      pointInPolygon(x, y, structure.polygon),
    )
    .sort((left, right) => {
      if (left.layer === activeLayer && right.layer !== activeLayer) return -1
      if (right.layer === activeLayer && left.layer !== activeLayer) return 1
      const leftOrder = visibleLayers.indexOf(left.layer)
      const rightOrder = visibleLayers.indexOf(right.layer)
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return left.id.localeCompare(right.id)
    })
}

export function structuresInRegion(regionId, structures) {
  return structures.filter((structure) => structure.regionIds.includes(regionId))
}

export function validateCatalogue(catalogue, contentIds = {}) {
  const errors = []
  if (!catalogue || catalogue.version !== 1) {
    return ['Catalogue version must be 1.']
  }

  const { regions, structures } = catalogue
  if (!Array.isArray(regions) || !Array.isArray(structures)) {
    return ['Catalogue must include regions and structures arrays.']
  }

  const regionIds = new Set()
  const structureIds = new Set()
  const validViews = new Set(['front', 'back'])
  const validLayers = new Set(['skeleton', 'cardio', 'neuro', 'renal'])
  const validKinds = new Set(['bone', 'organ', 'vessel', 'nerve'])
  const bounds = {
    minX: catalogue.viewBox?.x ?? ANATOMY_VIEWBOX.x,
    minY: catalogue.viewBox?.y ?? ANATOMY_VIEWBOX.y,
    maxX: (catalogue.viewBox?.x ?? ANATOMY_VIEWBOX.x) +
      (catalogue.viewBox?.width ?? ANATOMY_VIEWBOX.width),
    maxY: (catalogue.viewBox?.y ?? ANATOMY_VIEWBOX.y) +
      (catalogue.viewBox?.height ?? ANATOMY_VIEWBOX.height),
  }

  function checkPolygon(polygon, label) {
    if (!Array.isArray(polygon) || polygon.length < 3) {
      errors.push(`${label} must have at least three polygon points.`)
      return
    }
    polygon.forEach((point, index) => {
      if (
        !Array.isArray(point) ||
        point.length !== 2 ||
        !Number.isFinite(point[0]) ||
        !Number.isFinite(point[1]) ||
        point[0] < bounds.minX ||
        point[0] > bounds.maxX ||
        point[1] < bounds.minY ||
        point[1] > bounds.maxY
      ) {
        errors.push(`${label} point ${index + 1} is outside the viewBox or invalid.`)
      }
    })
  }

  regions.forEach((region) => {
    if (!region || typeof region.id !== 'string' || region.id.trim() === '') {
      errors.push('Every region needs a non-empty id.')
      return
    }
    if (regionIds.has(region.id)) errors.push(`Duplicate region id "${region.id}".`)
    regionIds.add(region.id)
    if (typeof region.name !== 'string' || region.name.trim() === '') {
      errors.push(`Region "${region.id}" needs a non-empty name.`)
    }
    if (!validViews.has(region.view)) errors.push(`Region "${region.id}" has an invalid view.`)
    checkPolygon(region.polygon, `Region "${region.id}"`)
  })

  structures.forEach((structure) => {
    if (!structure || typeof structure.id !== 'string' || structure.id.trim() === '') {
      errors.push('Every structure needs a non-empty id.')
      return
    }
    if (structureIds.has(structure.id)) errors.push(`Duplicate structure id "${structure.id}".`)
    structureIds.add(structure.id)
    if (typeof structure.name !== 'string' || structure.name.trim() === '') {
      errors.push(`Structure "${structure.id}" needs a non-empty name.`)
    }
    if (!validKinds.has(structure.kind)) errors.push(`Structure "${structure.id}" has an invalid kind.`)
    if (!validLayers.has(structure.layer)) errors.push(`Structure "${structure.id}" has an invalid layer.`)
    if (!validViews.has(structure.view)) errors.push(`Structure "${structure.id}" has an invalid view.`)
    checkPolygon(structure.polygon, `Structure "${structure.id}"`)

    if (!Array.isArray(structure.regionIds) || structure.regionIds.length === 0) {
      errors.push(`Structure "${structure.id}" must belong to at least one region.`)
    } else {
      structure.regionIds.forEach((regionId) => {
        const region = regions.find((entry) => entry?.id === regionId)
        if (!region) {
          errors.push(`Structure "${structure.id}" references unknown region "${regionId}".`)
        } else if (region.view !== structure.view) {
          errors.push(`Structure "${structure.id}" and region "${regionId}" use different views.`)
        }
      })
    }

    for (const [field, ids] of Object.entries({
      conditionIds: contentIds.conditions,
      measurementIds: contentIds.measurements,
      sourceIds: contentIds.sources,
    })) {
      if (structure[field] !== undefined && !Array.isArray(structure[field])) {
        errors.push(`Structure "${structure.id}" ${field} must be an array.`)
        continue
      }
      for (const id of structure[field] ?? []) {
        if (!ids?.has(id)) {
          errors.push(`Structure "${structure.id}" references unknown ${field} item "${id}".`)
        }
      }
    }
  })

  for (const region of regions) {
    if (!structures.some((structure) => structure.regionIds?.includes(region.id))) {
      errors.push(`Region "${region.id}" has no structures.`)
    }
  }

  return errors
}
