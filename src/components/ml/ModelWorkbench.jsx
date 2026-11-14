import { useState } from 'react'
import { CONTEXT, SYMPTOMS } from '../../ml/features.js'
import { parseEcgCsv, parseSleepCsv } from '../../ml/preprocessing.js'
import { predictECG, predictSleep } from '../../ml/workerApi.js'
import { useCDSSInference } from '../../hooks/useCDSSInference.js'

const modelTabs = [
  { id: 'cdss', label: 'Differential support' },
  { id: 'ecg', label: 'ECG beat' },
  { id: 'sleep', label: 'Sleep stage' },
]

const symptomLabels = {
  blurred_vision: 'Blurred vision',
  near_vision_change: 'Near-vision change',
  shortness_of_breath: 'Shortness of breath',
  skin_tingling_rash: 'Skin tingling or rash',
  faint_on_standing: 'Faint on standing',
  low_urine_output: 'Low urine output',
  poor_sleep: 'Poor sleep',
  poor_concentration: 'Poor concentration',
  head_motion_worsens: 'Head motion worsens symptoms',
}

const contextLabels = {
  spo2: ['SpO₂', '%'],
  heart_rate: ['Heart rate', 'bpm'],
  systolic_bp: ['Systolic blood pressure', 'mmHg'],
  ppo2_kpa: ['O₂ partial pressure', 'kPa'],
  ambient_kpa: ['Ambient pressure', 'kPa'],
  prebreathe_min: ['Pre-breathe duration', 'min'],
  sleep_hours: ['Sleep in last 24 h', 'h'],
  fluid_intake_l: ['Fluid intake in last 24 h', 'L'],
  urine_output_l: ['Urine output in last 24 h', 'L'],
  mission_day: ['Mission day', 'day'],
  hrs_since_entry_microg: ['Hours since microgravity entry', 'h'],
  hrs_since_landing: ['Hours since landing', 'h'],
  eva_recent: ['EVA in progress or within 24 h', '0 or 1'],
  hr_irregular: ['Irregular heart rhythm flag', '0 or 1'],
}

const sleepLabels = {
  W: 'Awake',
  N1: 'Light sleep (N1)',
  N2: 'Light sleep (N2)',
  N3: 'Deep sleep (N3)',
  REM: 'REM sleep',
}

function displayName(name) {
  return name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function PredictionList({ predictions, labels = {} }) {
  if (!predictions?.length) return null

  return (
    <ol className="mt-4 space-y-3" aria-label="Model results">
      {predictions.map(({ name, description, probability }) => (
        <li key={name} className="rounded-xl border border-sky-500/15 bg-slate-950/50 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-white">{labels[name] ?? displayName(name)}</span>
            <span className="shrink-0 text-sky-200">{(probability * 100).toFixed(1)}% model score</span>
          </div>
          {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
              style={{ width: `${Math.max(0, Math.min(100, probability * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function ModelWorkbench({
  models = modelTabs.map(({ id }) => id),
  title = 'Model workbench',
}) {
  const [activeModel, setActiveModel] = useState(models[0] ?? 'cdss')
  const [symptoms, setSymptoms] = useState(() => Object.fromEntries(SYMPTOMS.map((name) => [name, 0])))
  const [context, setContext] = useState(() => Object.fromEntries(CONTEXT.map(({ name }) => [name, ''])))
  const [ecgText, setEcgText] = useState('')
  const [sleepText, setSleepText] = useState('')
  const [sensorPredictions, setSensorPredictions] = useState(null)
  const [sensorError, setSensorError] = useState(null)
  const [sensorLoading, setSensorLoading] = useState(false)
  const [formError, setFormError] = useState(null)
  const { runDiagnosis, predictions: cdssPredictions, loading: cdssLoading, error: cdssError } =
    useCDSSInference()
  const visibleTabs = modelTabs.filter(({ id }) => models.includes(id))

  async function submitCDSS(event) {
    event.preventDefault()
    setFormError(null)
    const emptyField = CONTEXT.find(({ name }) => context[name].trim() === '')
    if (emptyField) {
      setFormError(`Enter a value for ${contextLabels[emptyField.name][0]}.`)
      return
    }

    await runDiagnosis({
      symptoms,
      context: Object.fromEntries(CONTEXT.map(({ name }) => [name, Number(context[name])])),
    })
  }

  async function submitSensorModel(event) {
    event.preventDefault()
    setSensorError(null)
    setSensorPredictions(null)
    setSensorLoading(true)
    try {
      const result = activeModel === 'ecg'
        ? await predictECG(parseEcgCsv(ecgText))
        : await predictSleep(parseSleepCsv(sleepText))
      setSensorPredictions(result)
    } catch (error) {
      setSensorError(error.message)
    } finally {
      setSensorLoading(false)
    }
  }

  return (
    <section id="model-workbench" className="mt-6 rounded-[28px] border border-sky-500/20 bg-slate-900/35 p-4 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300/80">On-device ML</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Inference runs locally in a background worker.
          {models.includes('cdss') && ' CDSS results are experimental rankings, not diagnoses. This model was trained on synthetic, rule-derived data; do not use its scores to make care decisions.'}
        </p>
      </div>

      {visibleTabs.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="ML models">
          {visibleTabs.map(({ id, label }) => (
            <button
              key={id}
              id={`model-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={activeModel === id}
              aria-controls={`model-panel-${id}`}
              onClick={() => {
                setActiveModel(id)
                setSensorError(null)
                setSensorPredictions(null)
              }}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeModel === id
                  ? 'border-sky-300/50 bg-sky-500/20 text-white'
                  : 'border-sky-500/15 bg-slate-950/40 text-sky-100/70 hover:bg-sky-500/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {activeModel === 'cdss' ? (
        <div
          id="model-panel-cdss"
          role={visibleTabs.length > 1 ? 'tabpanel' : undefined}
          aria-labelledby={visibleTabs.length > 1 ? 'model-tab-cdss' : undefined}
        >
          <form onSubmit={submitCDSS} className="space-y-5">
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-sky-100">Symptoms</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SYMPTOMS.map((name) => (
                  <label key={name} className="flex items-center justify-between gap-3 rounded-xl border border-sky-500/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
                    <span>{symptomLabels[name] ?? displayName(name)}</span>
                    <select
                      value={symptoms[name]}
                      onChange={(event) => setSymptoms((current) => ({ ...current, [name]: Number(event.target.value) }))}
                      className="rounded-lg border border-sky-500/20 bg-slate-900 px-2 py-1 text-sky-100"
                      aria-label={`${symptomLabels[name] ?? displayName(name)} severity`}
                    >
                      <option value={0}>None</option>
                      <option value={1}>Mild</option>
                      <option value={2}>Moderate</option>
                      <option value={3}>Severe</option>
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-sky-100">Context and measurements</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CONTEXT.map(({ name, min, max }) => {
                  const [label, unit] = contextLabels[name]
                  return (
                    <label key={name} className="space-y-1 text-sm text-slate-300">
                      <span className="block">{label} <span className="text-slate-500">({unit})</span></span>
                      <input
                        type="number"
                        required
                        min={min}
                        max={max}
                        step="any"
                        value={context[name]}
                        onChange={(event) => setContext((current) => ({ ...current, [name]: event.target.value }))}
                        className="w-full rounded-lg border border-sky-500/20 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-300/60"
                      />
                    </label>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">Model feature ranges: use the measurement ranges shown by the input controls.</p>
            </fieldset>

            <button
              type="submit"
              disabled={cdssLoading}
              className="rounded-xl border border-sky-300/30 bg-sky-500/15 px-4 py-2.5 text-sm font-medium text-sky-100 hover:bg-sky-500/25 disabled:cursor-wait disabled:opacity-60"
            >
              {cdssLoading ? 'Running CDSS…' : 'Rank possible conditions'}
            </button>
          </form>

          {(formError || cdssError) && <p className="mt-3 text-sm text-rose-300" role="alert">{formError ?? cdssError}</p>}
          <PredictionList predictions={cdssPredictions} />
        </div>
      ) : (
        <div
          id={`model-panel-${activeModel}`}
          role={visibleTabs.length > 1 ? 'tabpanel' : undefined}
          aria-labelledby={visibleTabs.length > 1 ? `model-tab-${activeModel}` : undefined}
        >
          <form onSubmit={submitSensorModel} className="space-y-3">
            <label htmlFor={`${activeModel}-window`} className="block text-sm font-medium text-sky-100">
              {activeModel === 'ecg'
                ? 'Paste one MLII ECG beat as 180 comma- or whitespace-separated samples (360 Hz).'
                : 'Paste one sleep window as 3000 CSV rows with 7 numeric columns per row; no header.'}
            </label>
            <textarea
              id={`${activeModel}-window`}
              required
              rows={activeModel === 'ecg' ? 5 : 8}
              value={activeModel === 'ecg' ? ecgText : sleepText}
              onChange={(event) => activeModel === 'ecg' ? setEcgText(event.target.value) : setSleepText(event.target.value)}
              placeholder={activeModel === 'ecg' ? 'sample 1, sample 2, …' : 'feature 1, feature 2, … (one row per sample)'}
              className="w-full rounded-xl border border-sky-500/20 bg-slate-950 px-3 py-2 font-mono text-xs text-white outline-none focus:border-sky-300/60"
            />
            {activeModel === 'sleep' && (
              <p className="text-xs text-slate-500">
                The model expects 7 features per sample. Confirm the feature order against your sensor export; this bundle does not provide feature names.
              </p>
            )}
            <button
              type="submit"
              disabled={sensorLoading}
              className="rounded-xl border border-sky-300/30 bg-sky-500/15 px-4 py-2.5 text-sm font-medium text-sky-100 hover:bg-sky-500/25 disabled:cursor-wait disabled:opacity-60"
            >
              {sensorLoading ? 'Running model…' : `Classify ${activeModel === 'ecg' ? 'ECG beat' : 'sleep window'}`}
            </button>
          </form>

          {sensorError && <p className="mt-3 text-sm text-rose-300" role="alert">{sensorError}</p>}
          <PredictionList predictions={sensorPredictions} labels={activeModel === 'sleep' ? sleepLabels : {}} />
        </div>
      )}
    </section>
  )
}
