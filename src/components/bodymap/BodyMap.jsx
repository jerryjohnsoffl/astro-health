import bodySvg from '../../assets/body.svg'
import skeletonSvg from '../../assets/skeleton.svg'
import cardioSvg from '../../assets/cardio.svg'
import neuroSvg from '../../assets/neuro.svg'
import renalSvg from '../../assets/renal.svg'
import LayerToggles from './LayerToggles'
import { anatomyCatalogue } from '../../anatomy/catalogue.js'
import { classifyPoint, pointerToSvgPoint, viewBoxFor } from '../../anatomy/classifier.js'

const layers = [
  { id: 'body', src: bodySvg, label: 'Body', opacity: 1 },
  { id: 'skeleton', src: skeletonSvg, label: 'Skeleton', opacity: 0.8 },
  { id: 'cardio', src: cardioSvg, label: 'Cardio', opacity: 0.8 },
  { id: 'neuro', src: neuroSvg, label: 'Neuro', opacity: 0.8 },
  { id: 'renal', src: renalSvg, label: 'Renal', opacity: 0.8 },
]

export default function BodyMap({
  activeLayer,
  view,
  modelIndicators = [],
  onSelectLayer,
  onSelectStructure,
}) {
  const viewBox = viewBoxFor(view)
  const indicatorsByStructure = new Map()
  for (const indicator of modelIndicators) {
    for (const structureId of indicator.structureIds) {
      const current = indicatorsByStructure.get(structureId) ?? []
      current.push(indicator)
      indicatorsByStructure.set(structureId, current)
    }
  }
  const visibleStructures = anatomyCatalogue.structures
    .filter((structure) => structure.view === view)
    .sort((left, right) => {
      if (left.layer === activeLayer && right.layer !== activeLayer) return 1
      if (right.layer === activeLayer && left.layer !== activeLayer) return -1
      return 0
    })

  function handleMapClick(event) {
    const point = pointerToSvgPoint(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      viewBox,
    )
    if (!point) return
    const [structure] = classifyPoint(
      point.x,
      point.y,
      view,
      anatomyCatalogue.structures,
      { visibleLayers: ['skeleton', 'cardio', 'neuro', 'renal'], activeLayer },
    )
    if (structure) onSelectStructure(structure)
  }

  return (
    <div className="space-y-4">
      <LayerToggles activeLayer={activeLayer} onSelect={onSelectLayer} />
      <div className="relative mx-auto w-full max-w-[330px] overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_center,_rgba(21,88,160,0.28),_rgba(7,17,32,0.9)_55%,_rgba(2,6,18,0.96))]" style={{ aspectRatio: `${viewBox.width} / ${viewBox.height}` }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(72,152,255,0.12),transparent_55%)]" />
        {layers.map((layer) => (
          <img
            key={layer.id}
            src={layer.src}
            alt={layer.label}
            className="pointer-events-none absolute top-0 h-full max-w-none"
            style={{
              width: '200%',
              left: view === 'front' ? '0' : '-100%',
              opacity: layer.id === 'body' || layer.id === activeLayer ? layer.opacity : 0.38,
              filter: layer.id === 'body'
                ? 'drop-shadow(0 0 18px rgba(88, 194, 255, 0.42))'
                : 'drop-shadow(0 0 12px rgba(81, 208, 255, 0.28))',
              mixBlendMode: 'screen',
            }}
          />
        ))}
        <svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="absolute inset-0 h-full w-full cursor-pointer"
          onClick={handleMapClick}
          aria-label={`${view} body map`}
        >
          {visibleStructures.map((structure) => {
            const results = indicatorsByStructure.get(structure.id) ?? []
            const hasCDSS = results.some(({ source }) => source === 'CDSS')
            const hasECG = results.some(({ source }) => source === 'ECG')
            const stroke = hasCDSS && hasECG
              ? '#fbbf24'
              : hasCDSS
                ? '#c4b5fd'
                : hasECG
                  ? '#67e8f9'
                  : structure.layer === activeLayer
                    ? '#38bdf8'
                    : '#94a3b8'
            const fill = hasCDSS && hasECG
              ? 'rgba(251,191,36,.32)'
              : hasCDSS
                ? 'rgba(167,139,250,.32)'
                : hasECG
                  ? 'rgba(34,211,238,.32)'
                  : structure.layer === activeLayer
                    ? 'rgba(56,189,248,.26)'
                    : 'rgba(148,163,184,.12)'

            return (
              <polygon
                key={structure.id}
                points={structure.polygon.map((point) => point.join(',')).join(' ')}
                fill={fill}
                stroke={stroke}
                strokeWidth={results.length > 0 ? '3' : '2'}
                vectorEffect="non-scaling-stroke"
                role="button"
                tabIndex="0"
                aria-label={`Select ${structure.name}${results.length > 0 ? `, associated with ${results.map(({ source }) => source).join(' and ')} model result` : ''}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectStructure(structure)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectStructure(structure)
                  }
                }}
              />
            )
          })}
        </svg>
      </div>
      <section
        className="rounded-xl border border-sky-500/10 bg-slate-950/40 p-3 text-xs leading-5 text-slate-300"
        aria-live="polite"
        aria-label="Mapped model results"
      >
        <h3 className="font-semibold text-white">Model-linked areas</h3>
        {modelIndicators.length === 0 ? (
          <p className="mt-1 text-slate-400">No saved CDSS or ECG result to map yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {modelIndicators.map((indicator) => {
              const names = anatomyCatalogue.structures
                .filter((structure) => indicator.structureIds.includes(structure.id))
                .map((structure) => `${structure.name} (${structure.view})`)
              return (
                <li key={indicator.id}>
                  <span className={indicator.source === 'CDSS' ? 'text-violet-200' : 'text-cyan-200'}>
                    {indicator.source}
                  </span>
                  {indicator.source === 'CDSS' ? ' top-ranked category: ' : ' beat class: '}
                  {indicator.label} ({(indicator.score * 100).toFixed(1)}% model score).
                  {' '}{names.length > 0 ? `Mapped structure${names.length > 1 ? 's' : ''}: ${names.join(', ')}.` : 'No structure is linked to this result.'}
                  {indicator.recordedAt && ` Saved ${new Date(indicator.recordedAt).toLocaleString()}.`}
                </li>
              )
            })}
          </ul>
        )}
        {modelIndicators.length > 0 && (
          <p className="mt-2 text-slate-400">
            Violet marks CDSS links, cyan marks ECG links, and amber marks both. Highlighting shows a catalogue association only. CDSS scores are experimental rankings, and ECG labels classify a beat; neither identifies a diagnosed problem.
          </p>
        )}
      </section>
      {anatomyCatalogue.structures.length === 0 && (
        <p className="text-center text-xs leading-5 text-slate-400">
          No anatomy annotations are available yet. Draw and verify polygons at <code>/anatomy-editor</code>.
        </p>
      )}
    </div>
  )
}
