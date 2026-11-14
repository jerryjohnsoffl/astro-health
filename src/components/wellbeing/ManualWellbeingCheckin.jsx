import { useState } from 'react'
import { useHealthStore } from '../../store/useHealthStore.js'

const initialCheckIn = {
  sleepHours: '',
  sleepQuality: '',
  awakenings: '',
  rested: '',
}

const ratingLabels = {
  1: 'Very low',
  2: 'Low',
  3: 'Fair',
  4: 'Good',
  5: 'Very good',
}

export default function ManualWellbeingCheckin() {
  const { healthState, saveWellbeingCheckIn } = useHealthStore()
  const savedCheckIn = healthState.wellbeingCheckIn
  const [checkIn, setCheckIn] = useState(() =>
    savedCheckIn
      ? {
          sleepHours: String(savedCheckIn.sleepHours),
          sleepQuality: String(savedCheckIn.sleepQuality),
          awakenings: String(savedCheckIn.awakenings),
          rested: String(savedCheckIn.rested),
        }
      : initialCheckIn,
  )
  const [summary, setSummary] = useState(savedCheckIn)
  const [saveError, setSaveError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setCheckIn((current) => ({ ...current, [name]: value }))
    setSummary(null)
  }

  function submitCheckIn(event) {
    event.preventDefault()
    setSaveError('')
    try {
      const state = saveWellbeingCheckIn({
        sleepHours: Number(checkIn.sleepHours),
        sleepQuality: Number(checkIn.sleepQuality),
        awakenings: Number(checkIn.awakenings),
        rested: Number(checkIn.rested),
      })
      setSummary(state.wellbeingCheckIn)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <section className="mt-6 rounded-[28px] border border-sky-500/20 bg-slate-900/35 p-4 sm:p-6" aria-labelledby="manual-checkin-title">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300/80">Manual check-in</p>
      <h2 id="manual-checkin-title" className="mt-1 text-xl font-semibold text-white">How was your sleep?</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        A short self-report. This creates a summary only; it is not an AI prediction or medical assessment.
      </p>

      <form onSubmit={submitCheckIn} className="mt-5 space-y-4">
        <label className="block space-y-1 text-sm text-slate-300">
          <span>Hours asleep</span>
          <input
            type="number"
            name="sleepHours"
            min="0"
            max="24"
            step="0.25"
            required
            value={checkIn.sleepHours}
            onChange={updateField}
            className="w-full rounded-lg border border-sky-500/20 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-300/60"
          />
        </label>

        <label className="block space-y-1 text-sm text-slate-300">
          <span>How would you rate your sleep quality?</span>
          <select
            name="sleepQuality"
            required
            value={checkIn.sleepQuality}
            onChange={updateField}
            className="w-full rounded-lg border border-sky-500/20 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-300/60"
          >
            <option value="">Choose a rating</option>
            {Object.entries(ratingLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-slate-300">
          <span>How many times did you wake up?</span>
          <input
            type="number"
            name="awakenings"
            min="0"
            max="50"
            step="1"
            required
            value={checkIn.awakenings}
            onChange={updateField}
            className="w-full rounded-lg border border-sky-500/20 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-300/60"
          />
        </label>

        <label className="block space-y-1 text-sm text-slate-300">
          <span>How rested do you feel now?</span>
          <select
            name="rested"
            required
            value={checkIn.rested}
            onChange={updateField}
            className="w-full rounded-lg border border-sky-500/20 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-300/60"
          >
            <option value="">Choose a rating</option>
            {Object.entries(ratingLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="min-h-11 rounded-xl border border-sky-300/30 bg-sky-500/15 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          Review my check-in
        </button>
      </form>

      {summary && (
        <div className="mt-5 rounded-2xl border border-sky-500/15 bg-slate-950/45 p-4" role="status">
          <h3 className="font-semibold text-white">Your self-reported summary</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-400">Sleep</dt>
              <dd className="mt-1 text-slate-100">{summary.sleepHours} hours</dd>
            </div>
            <div>
              <dt className="text-slate-400">Quality</dt>
              <dd className="mt-1 text-slate-100">{ratingLabels[summary.sleepQuality]}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Awakenings</dt>
              <dd className="mt-1 text-slate-100">{summary.awakenings}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Feeling rested</dt>
              <dd className="mt-1 text-slate-100">{ratingLabels[summary.rested]}</dd>
            </div>
          </dl>
        </div>
      )}

      {saveError && <p className="mt-4 text-sm text-rose-300" role="alert">{saveError}</p>}
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Your latest check-in is saved only in this browser’s local storage; it is not sent to a server.
      </p>
    </section>
  )
}
