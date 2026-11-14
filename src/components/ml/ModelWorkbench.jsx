import { useState } from 'react'
import { CONTEXT, SYMPTOMS } from '../../ml/features.js'
import { normalizeEcgWindow, parseEcgCsvSamples, parseSleepCsv } from '../../ml/preprocessing.js'
import { predictECG, predictSleep } from '../../ml/workerApi.js'
import { useCDSSInference } from '../../hooks/useCDSSInference.js'
import { saveCDSSAssessment, saveSensorAnalysis, useHealthStore } from '../../store/useHealthStore.js'

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
  const { healthState } = useHealthStore()
  const savedCDSSAssessment = healthState.cdssAssessment
  const savedEcgAnalysis = healthState.sensorAnalyses.ecg
  const savedSleepAnalysis = healthState.sensorAnalyses.sleep
  const [symptoms, setSymptoms] = useState(() =>
    Object.fromEntries(
      SYMPTOMS.map((name) => [name, savedCDSSAssessment?.input.symptoms[name] ?? 0]),
    ),
  )
  const [context, setContext] = useState(() =>
    Object.fromEntries(
      CONTEXT.map(({ name }) => [
        name,
        savedCDSSAssessment ? String(savedCDSSAssessment.input.context[name] ?? '') : '',
      ]),
    ),
  )
  const [ecgRawSamples, setEcgRawSamples] = useState(savedEcgAnalysis?.samples ?? null)
  const [ecgSamples, setEcgSamples] = useState(() =>
    savedEcgAnalysis ? normalizeEcgWindow(savedEcgAnalysis.samples) : null,
  )
  const [ecgFileName, setEcgFileName] = useState(savedEcgAnalysis?.fileName ?? '')
  const [ecgSaved, setEcgSaved] = useState(Boolean(savedEcgAnalysis))
  const [sleepSamples, setSleepSamples] = useState(savedSleepAnalysis?.samples ?? null)
  const [sleepFileName, setSleepFileName] = useState(savedSleepAnalysis?.fileName ?? '')
  const [sleepSaved, setSleepSaved] = useState(Boolean(savedSleepAnalysis))
  const [sensorPredictions, setSensorPredictions] = useState(() =>
    activeModel === 'ecg'
      ? savedEcgAnalysis?.predictions ?? null
      : savedSleepAnalysis?.predictions ?? null,
  )
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

    const record = {
      symptoms,
      context: Object.fromEntries(CONTEXT.map(({ name }) => [name, Number(context[name])])),
    }

    try {
      saveCDSSAssessment(record)
      setFormError(null)
    } catch (error) {
      setFormError(`CDSS input could not be saved locally: ${error.message}`)
    }

    const predictions = await runDiagnosis(record)
    if (predictions) {
      try {
        saveCDSSAssessment(record, predictions)
        setFormError(null)
      } catch (error) {
        setFormError(`The result ran, but could not be saved locally: ${error.message}`)
      }
    }
  }

  async function handleSleepFileChange(event) {
    const file = event.target.files?.[0]
    setSleepSamples(null)
    setSleepFileName(file?.name ?? '')
    setSleepSaved(false)
    setSensorError(null)
    setSensorPredictions(null)

    if (!file) {
      return
    }

    try {
      const samples = parseSleepCsv(await file.text())
      setSleepSamples(samples)
      try {
        saveSensorAnalysis('sleep', file.name, samples)
        setSleepSaved(true)
      } catch (error) {
        setSensorError(`File loaded, but could not be saved locally: ${error.message}`)
      }
    } catch (error) {
      setSensorError(error instanceof Error ? error.message : String(error))
    }
  }

  async function handleEcgFileChange(event) {
    const file = event.target.files?.[0]
    setEcgSamples(null)
    setEcgRawSamples(null)
    setEcgFileName(file?.name ?? '')
    setEcgSaved(false)
    setSensorError(null)
    setSensorPredictions(null)

    if (!file) {
      return
    }

    try {
      const rawSamples = parseEcgCsvSamples(await file.text())
      const samples = normalizeEcgWindow(rawSamples)
      setEcgRawSamples(rawSamples)
      setEcgSamples(samples)
      try {
        saveSensorAnalysis('ecg', file.name, rawSamples)
        setEcgSaved(true)
      } catch (error) {
        setSensorError(`File loaded, but could not be saved locally: ${error.message}`)
      }
    } catch (error) {
      setSensorError(error instanceof Error ? error.message : String(error))
    }
  }

  async function submitSensorModel(event) {
    event.preventDefault()
    setSensorError(null)
    setSensorPredictions(null)
    if (activeModel === 'sleep' && !sleepSamples) {
      setSensorError('Choose a valid sleep CSV file before classifying.')
      return
    }
    if (activeModel === 'ecg' && !ecgSamples) {
      setSensorError('Choose a valid ECG CSV file before classifying.')
      return
    }

    setSensorLoading(true)
    try {
      const result = activeModel === 'ecg'
        ? await predictECG(ecgSamples)
        : await predictSleep(sleepSamples)
      setSensorPredictions(result)
      try {
        saveSensorAnalysis(
          activeModel,
          activeModel === 'ecg' ? ecgFileName : sleepFileName,
          activeModel === 'ecg' ? ecgRawSamples : sleepSamples,
          result,
        )
        if (activeModel === 'ecg') {
          setEcgSaved(true)
        } else {
          setSleepSaved(true)
        }
      } catch (error) {
        if (activeModel === 'ecg') {
          setEcgSaved(false)
        } else {
          setSleepSaved(false)
        }
        setSensorError(`The result ran, but could not be saved locally: ${error.message}`)
      }
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
                setSensorPredictions(healthState.sensorAnalyses[id]?.predictions ?? null)
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
          <PredictionList predictions={cdssPredictions ?? savedCDSSAssessment?.predictions} />
        </div>
      ) : (
        <div
          id={`model-panel-${activeModel}`}
          role={visibleTabs.length > 1 ? 'tabpanel' : undefined}
          aria-labelledby={visibleTabs.length > 1 ? `model-tab-${activeModel}` : undefined}
        >
          <form onSubmit={submitSensorModel} className="space-y-3">
            {activeModel === 'sleep' && (
              <div className="space-y-2">
                <label htmlFor="sleep-window" className="block text-sm font-medium text-sky-100">
                  Choose one 30-second PSG epoch as a numeric CSV file.
                </label>
                <input
                  id="sleep-window"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleSleepFileChange}
                  className="block w-full rounded-xl border border-sky-500/20 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500/15 file:px-3 file:py-2 file:text-sky-100"
                />
                {sleepFileName && sleepSamples && (
                  <p className="text-sm text-emerald-200" role="status">
                    {sleepFileName} prepared as 3,000 samples × 7 channels
                    {sleepSaved ? ' and saved locally.' : '; not saved locally.'}
                  </p>
                )}
                <p className="text-xs leading-5 text-slate-400">
                  The importer accepts 3,000 × 7 or 7 × 3,000 numeric CSVs and transposes the latter. It does not resample, normalize, or identify channels. Use only a file prepared with the model’s matching channel order and preprocessing; this bundle does not document those details. The file is read locally in your browser.
                </p>
              </div>
            )}
            {activeModel === 'ecg' && (
              <div className="space-y-2">
                <label htmlFor="ecg-window" className="block text-sm font-medium text-sky-100">
                  Choose one MLII ECG beat as a numeric CSV file.
                </label>
                <input
                  id="ecg-window"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleEcgFileChange}
                  className="block w-full rounded-xl border border-sky-500/20 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500/15 file:px-3 file:py-2 file:text-sky-100"
                />
                {ecgFileName && ecgSamples && (
                  <p className="text-sm text-emerald-200" role="status">
                    {ecgFileName} prepared as one 180-sample beat
                    {ecgSaved ? ' and saved locally.' : '; not saved locally.'}
                  </p>
                )}
                <p className="text-xs leading-5 text-slate-400">
                  The file must contain exactly 180 numeric samples from one MLII lead at 360 Hz, centered on one beat, with no header or timestamp column. A single row or single column is accepted. The importer applies the model’s per-window z-score normalization; it does not resample or identify leads. The file is read locally in your browser.
                </p>
              </div>
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
