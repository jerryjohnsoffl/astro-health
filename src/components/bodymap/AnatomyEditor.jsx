import { useMemo, useRef, useState } from 'react'
import bodySvg from '../../assets/body.svg'
import skeletonSvg from '../../assets/skeleton.svg'
import cardioSvg from '../../assets/cardio.svg'
import neuroSvg from '../../assets/neuro.svg'
import renalSvg from '../../assets/renal.svg'
import { anatomyCatalogue, validateAnatomyCatalogue } from '../../anatomy/catalogue.js'
import { pointerToSvgPoint, viewBoxFor } from '../../anatomy/classifier.js'

const layers = [
  { id: 'body', label: 'Body silhouette', src: bodySvg },
  { id: 'skeleton', label: 'Skeleton', src: skeletonSvg },
  { id: 'cardio', label: 'Cardiovascular', src: cardioSvg },
  { id: 'neuro', label: 'Nervous system', src: neuroSvg },
  { id: 'renal', label: 'Renal', src: renalSvg },
]
const editorStorageKey = 'astro-health-anatomy-editor-draft'

function readDraft() {
  try {
    const saved = window.localStorage.getItem(editorStorageKey)
    if (saved === null) return { catalogue: anatomyCatalogue, error: '' }
    const catalogue = JSON.parse(saved)
    if (!Array.isArray(catalogue.regions) || !Array.isArray(catalogue.structures)) {
      throw new TypeError('The saved draft must contain regions and structures arrays.')
    }
    return { catalogue, error: '' }
  } catch (draftError) {
    return {
      catalogue: anatomyCatalogue,
      error: `Could not load the saved editor draft: ${draftError.message}`,
    }
  }
}

function parseIdList(value) {
  return value.split(',').map((id) => id.trim()).filter(Boolean)
}

function downloadCatalogue(catalogue) {
  const blob = new Blob([`${JSON.stringify(catalogue, null, 2)}\n`], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'anatomy-catalogue.json'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function AnatomyEditor() {
  const [initialDraft] = useState(readDraft)
  const [catalogue, setCatalogue] = useState(initialDraft.catalogue)
  const [mode, setMode] = useState('structure')
  const [view, setView] = useState('front')
  const [visibleLayers, setVisibleLayers] = useState(['body', 'skeleton', 'cardio', 'neuro', 'renal'])
  const [points, setPoints] = useState([])
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState('bone')
  const [layer, setLayer] = useState('skeleton')
  const [regionIds, setRegionIds] = useState('')
  const [conditionIds, setConditionIds] = useState('')
  const [measurementIds, setMeasurementIds] = useState('')
  const [sourceIds, setSourceIds] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(initialDraft.error)
  const fileInput = useRef(null)
  const catalogueErrors = useMemo(() => validateAnatomyCatalogue(catalogue), [catalogue])
  const viewBox = viewBoxFor(view)

  function updateCatalogue(nextCatalogue) {
    setCatalogue(nextCatalogue)
    setError('')
    setMessage('')
    try {
      window.localStorage.setItem(editorStorageKey, JSON.stringify(nextCatalogue))
    } catch (storageError) {
      setError(`Could not save the editor draft: ${storageError.message}`)
    }
  }

  function addPoint(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const point = pointerToSvgPoint(event.clientX, event.clientY, rect, viewBox)
    if (point) setPoints((current) => [...current, [Number(point.x.toFixed(2)), Number(point.y.toFixed(2))]])
  }

  function savePolygon() {
    setError('')
    if (!id.trim() || !name.trim()) {
      setError('Enter an id and name before saving this polygon.')
      return
    }
    if (points.length < 3) {
      setError('Add at least three points to close a polygon.')
      return
    }

    if (mode === 'region') {
      if (catalogue.regions.some((region) => region.id === id.trim())) {
        setError(`Region id "${id.trim()}" already exists.`)
        return
      }
      updateCatalogue({
        ...catalogue,
        regions: [...catalogue.regions, {
          id: id.trim(),
          name: name.trim(),
          view,
          polygon: points,
        }],
      })
    } else {
      if (catalogue.structures.some((structure) => structure.id === id.trim())) {
        setError(`Structure id "${id.trim()}" already exists.`)
        return
      }
      updateCatalogue({
        ...catalogue,
        structures: [...catalogue.structures, {
          id: id.trim(),
          name: name.trim(),
          kind,
          layer,
          view,
          polygon: points,
          regionIds: parseIdList(regionIds),
          conditionIds: parseIdList(conditionIds),
          measurementIds: parseIdList(measurementIds),
          sourceIds: parseIdList(sourceIds),
        }],
      })
    }

    setPoints([])
    setId('')
    setName('')
    setMessage(`${mode === 'region' ? 'Region' : 'Structure'} polygon saved to the draft.`)
  }

  async function importCatalogue(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setMessage('')
    try {
      const imported = JSON.parse(await file.text())
      const errors = validateAnatomyCatalogue(imported)
      if (errors.length > 0) {
        setError(`Catalogue is invalid: ${errors.join(' ')}`)
        return
      }
      updateCatalogue(imported)
      setMessage('Catalogue imported.')
    } catch (importError) {
      setError(`Could not read the catalogue: ${importError.message}`)
    } finally {
      event.target.value = ''
    }
  }

  function exportCatalogue() {
    if (catalogue.structures.length === 0) {
      setError('Add structure annotations before exporting the catalogue.')
      return
    }
    if (catalogueErrors.length > 0) {
      setError(`Fix catalogue errors before exporting: ${catalogueErrors.join(' ')}`)
      return
    }
    downloadCatalogue(catalogue)
    setMessage('Catalogue exported. Review the polygons against a trusted anatomy reference before using them in the health map.')
  }

  function removeAnnotation(annotationId, annotationType) {
    updateCatalogue({
      ...catalogue,
      [annotationType]: catalogue[annotationType].filter((annotation) => annotation.id !== annotationId),
    })
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300/80">Development tool</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Anatomy catalogue annotator</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Draw polygons in the shared SVG coordinate space. These source layers are system-level artwork,
              not labeled individual organs or bones; verify every annotation against a trusted anatomy reference.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileInput.current?.click()} className="rounded-xl border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800">
              Import JSON
            </button>
            <input ref={fileInput} type="file" accept="application/json,.json" onChange={importCatalogue} className="hidden" />
            <button type="button" onClick={exportCatalogue} className="rounded-xl border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-sm text-sky-100 hover:bg-sky-500/25">
              Export catalogue
            </button>
          </div>
        </header>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <section className="space-y-3 rounded-2xl border border-sky-500/15 bg-slate-900/50 p-3 sm:p-5" aria-label="Annotation canvas">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {['front', 'back'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={view === option}
                    onClick={() => { setView(option); setPoints([]) }}
                    className={`rounded-lg px-3 py-2 text-sm capitalize ${view === option ? 'bg-sky-500/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                  >
                    {option} view
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {['region', 'structure'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={mode === option}
                    onClick={() => { setMode(option); setPoints([]) }}
                    className={`rounded-lg px-3 py-2 text-sm capitalize ${mode === option ? 'bg-emerald-500/20 text-emerald-100' : 'text-slate-400 hover:bg-slate-800'}`}
                  >
                    Draw {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[500px] overflow-hidden rounded-xl border border-sky-500/10 bg-slate-950" style={{ aspectRatio: `${viewBox.width} / ${viewBox.height}` }}>
              {layers.filter(({ id: layerId }) => visibleLayers.includes(layerId)).map((item) => (
                <img
                  key={item.id}
                  src={item.src}
                  alt=""
                  draggable="false"
                  className="pointer-events-none absolute top-0 h-full max-w-none"
                  style={{
                    width: '200%',
                    left: view === 'front' ? '0' : '-100%',
                  }}
                />
              ))}
              <svg
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                className="absolute inset-0 h-full w-full cursor-crosshair"
                onClick={addPoint}
                aria-label={`${view} anatomy annotation canvas`}
              >
                {catalogue.regions.filter((region) => region.view === view).map((region) => (
                  <polygon key={`region-${region.id}`} points={region.polygon.map((point) => point.join(',')).join(' ')} fill="rgba(34,197,94,.08)" stroke="#4ade80" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                ))}
                {catalogue.structures.filter((structure) => structure.view === view).map((structure) => (
                  <polygon key={`structure-${structure.id}`} points={structure.polygon.map((point) => point.join(',')).join(' ')} fill="rgba(56,189,248,.12)" stroke="#38bdf8" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                ))}
                {points.length > 0 && (
                  <>
                    {points.length > 2 && <polygon points={points.map((point) => point.join(',')).join(' ')} fill="rgba(250,204,21,.14)" stroke="#facc15" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
                    {points.map(([x, y], index) => <circle key={`${x}-${y}-${index}`} cx={x} cy={y} r="4" fill="#facc15" vectorEffect="non-scaling-stroke" />)}
                  </>
                )}
              </svg>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
              {layers.map(({ id: layerId, label }) => (
                <label key={layerId} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleLayers.includes(layerId)}
                    onChange={(event) => setVisibleLayers((current) =>
                      event.target.checked
                        ? [...current, layerId]
                        : current.filter((entry) => entry !== layerId),
                    )}
                  />
                  {label}
                </label>
              ))}
              <span className="text-slate-500">Points: {points.length}</span>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-sky-500/15 bg-slate-900/50 p-4">
              <h2 className="font-semibold text-white">Annotation details</h2>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm text-slate-300">
                  {mode === 'region' ? 'Region ID' : 'Structure ID'}
                  <input value={id} onChange={(event) => setId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
                </label>
                <label className="grid gap-1 text-sm text-slate-300">
                  Name
                  <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
                </label>
                {mode === 'structure' && (
                  <>
                    <label className="grid gap-1 text-sm text-slate-300">
                      Kind
                      <select value={kind} onChange={(event) => setKind(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
                        {['bone', 'organ', 'vessel', 'nerve'].map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm text-slate-300">
                      Visible layer
                      <select value={layer} onChange={(event) => setLayer(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
                        {layers.filter(({ id: layerId }) => layerId !== 'body').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </label>
                    {[
                      ['Region IDs', regionIds, setRegionIds],
                      ['Condition IDs', conditionIds, setConditionIds],
                      ['Measurement IDs', measurementIds, setMeasurementIds],
                      ['Source IDs', sourceIds, setSourceIds],
                    ].map(([label, value, setter]) => (
                      <label key={label} className="grid gap-1 text-sm text-slate-300">
                        {label} <span className="text-xs text-slate-500">(comma-separated)</span>
                        <input value={value} onChange={(event) => setter(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
                      </label>
                    ))}
                  </>
                )}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={savePolygon} className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/30">
                    Save {mode}
                  </button>
                  <button type="button" onClick={() => setPoints([])} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                    Clear points
                  </button>
                </div>
                {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
                {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-sky-500/15 bg-slate-900/50 p-4">
              <h2 className="font-semibold text-white">Draft catalogue</h2>
              <p className="mt-1 text-xs text-slate-400">
                {catalogue.regions.length} regions · {catalogue.structures.length} structures
              </p>
              {catalogueErrors.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-200" aria-label="Catalogue validation errors">
                  {catalogueErrors.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
                  {catalogueErrors.length > 5 && <li>And {catalogueErrors.length - 5} more validation errors.</li>}
                </ul>
              )}
              <ul className="mt-3 max-h-56 space-y-2 overflow-auto text-sm">
                {[
                  ...catalogue.regions.map((annotation) => ({ ...annotation, type: 'region', key: 'regions' })),
                  ...catalogue.structures.map((annotation) => ({ ...annotation, type: 'structure', key: 'structures' })),
                ].map((annotation) => (
                  <li key={`${annotation.type}-${annotation.id}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/60 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate text-white">{annotation.name}</span>
                      <span className="block truncate text-xs text-slate-500">{annotation.type} · {annotation.id} · {annotation.view}</span>
                    </span>
                    <button type="button" onClick={() => removeAnnotation(annotation.id, annotation.key)} className="shrink-0 rounded px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
