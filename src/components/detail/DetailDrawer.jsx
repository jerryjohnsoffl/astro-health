import { ArrowRight, BrainCircuit, Sparkles } from 'lucide-react'
import { conditions } from '../../data/conditions.js'
import { measurements } from '../../data/measurements.js'
import { sources } from '../../data/sources.js'

export default function DetailDrawer({
  selectedStructure,
  modelIndicators = [],
  onOpenSelfCheck,
}) {
  const conditionById = new Map(conditions.map((condition) => [condition.id, condition]))
  const measurementById = new Map(measurements.map((measurement) => [measurement.id, measurement]))
  const sourceById = new Map(sources.map((source) => [source.id, source]))
  const linkedConditions = (selectedStructure?.conditionIds ?? [])
    .map((id) => conditionById.get(id))
    .filter(Boolean)
  const linkedMeasurements = (selectedStructure?.measurementIds ?? [])
    .map((id) => measurementById.get(id))
    .filter(Boolean)
  const linkedSources = (selectedStructure?.sourceIds ?? [])
    .map((id) => sourceById.get(id))
    .filter(Boolean)
  const linkedModelIndicators = modelIndicators.filter((indicator) =>
    indicator.structureIds.includes(selectedStructure?.id),
  )

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-sky-500/15 bg-slate-900/30 p-4 shadow-[inset_0_1px_0_rgba(125,211,252,0.08)] backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-sky-400/30 bg-sky-500/10 text-sky-200">
              <BrainCircuit size={20} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-sky-200/70">Selected structure</div>
              <h3 className="text-2xl font-semibold tracking-tight text-white">{selectedStructure?.name ?? 'Choose a structure'}</h3>
            </div>
          </div>
          {selectedStructure && <span className="rounded-full border border-slate-600 px-2.5 py-1 text-[11px] capitalize text-slate-300">{selectedStructure.kind}</span>}
        </div>

        {!selectedStructure && <p className="text-sm leading-6 text-slate-300">Select an annotated part of the map to see its linked research content. No health status is inferred from the artwork.</p>}

        {linkedModelIndicators.length > 0 && (
          <section className="mb-4 rounded-xl border border-violet-400/20 bg-violet-500/5 p-3">
            <h4 className="text-sm font-semibold text-violet-100">Associated saved model results</h4>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-300">
              {linkedModelIndicators.map((indicator) => (
                <li key={indicator.id}>
                  {indicator.source}: {indicator.label} ({(indicator.score * 100).toFixed(1)}% model score)
                  {indicator.recordedAt && ` · saved ${new Date(indicator.recordedAt).toLocaleString()}`}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-400">These are catalogue/model associations, not a diagnosis or confirmed problem.</p>
          </section>
        )}

        {selectedStructure && linkedConditions.length === 0 && linkedMeasurements.length === 0 && linkedSources.length === 0 && (
          <p className="text-sm text-slate-300">No content linked yet.</p>
        )}

        {linkedConditions.length > 0 && (
          <section className="mb-4 space-y-3">
            <h4 className="text-sm font-semibold text-white">Linked conditions</h4>
            {linkedConditions.map((condition) => (
              <article key={condition.id} className="rounded-xl border border-sky-500/10 bg-slate-950/40 p-3">
                <h5 className="text-sm font-medium text-sky-100">{condition.name}</h5>
                <p className="mt-1 text-xs leading-5 text-slate-300">{condition.summary}</p>
                <p className="mt-2 text-xs text-amber-200">Research status: {condition.researchStatus}</p>
              </article>
            ))}
          </section>
        )}

        {linkedMeasurements.length > 0 && (
          <section className="mb-4 space-y-2">
            <h4 className="text-sm font-semibold text-white">Linked measurements</h4>
            {linkedMeasurements.map((measurement) => (
              <article key={measurement.id} className="rounded-xl border border-sky-500/10 bg-slate-950/40 p-3">
                <h5 className="text-sm font-medium text-sky-100">{measurement.name}</h5>
                <p className="mt-1 text-xs leading-5 text-slate-300">{measurement.description}</p>
                <p className="mt-1 text-xs text-slate-400">Reference status: {measurement.referenceRangeStatus}</p>
              </article>
            ))}
          </section>
        )}

        {linkedSources.length > 0 && (
          <section className="mb-4 space-y-2">
            <h4 className="text-sm font-semibold text-white">Sources</h4>
            {linkedSources.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-sky-500/10 bg-slate-950/40 p-3 text-sm text-sky-200 hover:text-white">
                {source.title}
                <span className="mt-1 block text-xs leading-5 text-slate-400">{source.scope}</span>
              </a>
            ))}
          </section>
        )}

        <button
          type="button"
          onClick={onOpenSelfCheck}
          className="flex w-full items-center justify-between rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-500/15"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} />
            Open self-check
          </span>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="rounded-[28px] border border-sky-500/15 bg-slate-900/30 p-4 shadow-[inset_0_1px_0_rgba(125,211,252,0.08)] backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles size={18} className="text-sky-300" />
            CDSS Assistant
          </div>
          <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-sky-200">
            Beta
          </span>
        </div>
        <p className="mb-4 text-sm text-sky-100/75">
          Enter current symptoms and measurements to run an on-device differential ranking. Results are decision support, not a diagnosis.
        </p>
        <button
          type="button"
          onClick={onOpenSelfCheck}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-500/15"
        >
          <Sparkles size={16} />
          Open Self-Check
        </button>
      </div>
    </div>
  )
}
