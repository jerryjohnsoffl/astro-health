import { Activity, BrainCircuit, HeartPulse, ShieldPlus } from 'lucide-react'

const layerOptions = [
  { id: 'skeleton', label: 'Skeleton', icon: Activity },
  { id: 'cardio', label: 'Cardio', icon: HeartPulse },
  { id: 'neuro', label: 'Neuro', icon: BrainCircuit },
  { id: 'renal', label: 'Renal', icon: ShieldPlus },
]

export default function LayerToggles({ activeLayer, onSelect }) {
  return (
    <div className="grid gap-2">
      {layerOptions.map(({ id, label, icon: Icon }) => {
        const active = activeLayer === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={[
              'flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-all',
              active
                ? 'border-sky-400/50 bg-sky-500/15 text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.18)]'
                : 'border-slate-700/80 bg-slate-900/20 text-slate-300 hover:border-sky-500/30 hover:text-sky-100',
            ].join(' ')}
          >
            <span className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-slate-900/50 text-sky-200">
                <Icon size={16} />
              </span>
              <span>{label}</span>
            </span>
            {active && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />}
          </button>
        )
      })}
    </div>
  )
}
