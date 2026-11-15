import { BellRing, Sparkles } from 'lucide-react'

export default function ReminderToast({ reminder, onDismiss }) {
  if (!reminder) {
    return null
  }

  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-sky-400/25 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-200">
          <BellRing size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-white">{reminder.title}</p>
            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(reminder.id)}
                className="text-xs text-slate-400 hover:text-white"
                aria-label={`Dismiss ${reminder.title}`}
              >
                Dismiss
              </button>
            )}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-300">{reminder.body}</p>
          <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-sky-200/80">
            <Sparkles size={12} />
            <span>{reminder.category}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
