import { Activity, Orbit, Ruler, UserRound } from 'lucide-react'
import { useSettingsStore } from '../../store/useSettingsStore'

function formatEnvironment(environment) {
  return environment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function HeaderBar({ isOnline }) {
  const { settings } = useSettingsStore()
  const statusClasses = isOnline
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    : 'border-amber-500/20 bg-amber-500/10 text-amber-300'

  return (
    <header className="border-b border-slate-800 bg-slate-950/90">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <a
          className="flex items-center gap-3 text-inherit no-underline"
          href="#main-content"
          aria-label="AstroHealth dashboard"
        >
          <span className="grid size-10 place-items-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
            <Activity aria-hidden="true" size={21} />
          </span>
          <span className="grid leading-tight">
            <strong className="text-base font-semibold tracking-tight text-slate-100">
              AstroHealth
            </strong>
            <span className="mt-1 text-xs text-slate-400">Crew Health Companion</span>
          </span>
        </a>

        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2 border-l border-slate-800 pl-5 text-xs text-slate-300">
          <span className="inline-flex items-center gap-2">
            <UserRound aria-hidden="true" className="text-slate-400" size={16} />
            Crew ID: {settings.crewProfile.crewId || 'Not set'}
          </span>
          <span className="inline-flex items-center gap-2">
            <Orbit aria-hidden="true" className="text-slate-400" size={16} />
            {formatEnvironment(settings.environment)}
          </span>
          <span className="inline-flex items-center gap-2">
            <Ruler aria-hidden="true" className="text-slate-400" size={16} />
            {settings.units === 'metric' ? 'Metric units' : 'Imperial units'}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusClasses}`}
          role="status"
          aria-live="polite"
        >
          <span className={`size-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </header>
  )
}
