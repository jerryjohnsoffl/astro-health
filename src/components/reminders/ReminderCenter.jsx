import { AlarmClockCheck, BellRing, CheckCircle2, Clock3, ListTodo, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { useReminders } from '../../hooks/useReminders.js'

function formatReminderTime(dueAt) {
  const value = new Date(dueAt)
  if (Number.isNaN(value.getTime())) {
    return 'No due time'
  }

  const diffMs = value.getTime() - Date.now()
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000))

  if (diffMinutes < 60) {
    return `${diffMinutes} min from now`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hr from now`
  }

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} from now`
}

const priorityStyles = {
  high: 'border-rose-400/25 bg-rose-500/10 text-rose-100',
  medium: 'border-amber-400/25 bg-amber-500/10 text-amber-100',
  low: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100',
}

export default function ReminderCenter() {
  const { reminders, dueReminders, completeReminder, dismissReminder, snooze } = useReminders({
    crewName: 'Crew-07',
    environmentName: 'Mars transit',
  })

  const upcoming = useMemo(
    () => reminders.filter((reminder) => !reminder.completed && !reminder.dismissed).slice(0, 4),
    [reminders],
  )

  return (
    <section aria-labelledby="reminders-title">
      <header className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300/80">Crew operations</p>
        <h1 id="reminders-title" className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Reminders
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Timely prompts for hydration, recovery, and mission checks to keep the crew aligned with daily routines.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-sky-500/20 bg-slate-900/35 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-sky-500/10 text-sky-200">
                <BellRing size={18} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">Due now</h2>
                <p className="text-sm text-slate-400">{dueReminders.length} action-ready reminders</p>
              </div>
            </div>

            {dueReminders.length === 0 ? (
              <p className="rounded-2xl border border-sky-500/10 bg-slate-950/45 p-4 text-sm text-slate-300">
                No reminders are due right now. Upcoming prompts are scheduled below.
              </p>
            ) : (
              <ul className="space-y-3">
                {dueReminders.map((reminder) => (
                  <li key={reminder.id} className="rounded-2xl border border-sky-500/10 bg-slate-950/45 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{reminder.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-300">{reminder.body}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${priorityStyles[reminder.priority] ?? priorityStyles.medium}`}>
                        {reminder.priority}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/10 bg-sky-500/5 px-2 py-1">
                        <Clock3 size={12} /> {formatReminderTime(reminder.dueAt)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/10 bg-sky-500/5 px-2 py-1">
                        <Sparkles size={12} /> {reminder.category}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => completeReminder(reminder.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/15"
                      >
                        <CheckCircle2 size={15} /> Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => snooze(reminder.id, 2)}
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/15"
                      >
                        <AlarmClockCheck size={15} /> Snooze 2h
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="rounded-[28px] border border-sky-500/20 bg-slate-900/35 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-200">
              <ListTodo size={18} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Upcoming</h2>
              <p className="text-sm text-slate-400">Next scheduled tasks</p>
            </div>
          </div>

          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-300">All reminders are cleared for now.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((reminder) => (
                <li key={reminder.id} className="rounded-2xl border border-sky-500/10 bg-slate-950/45 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{reminder.title}</p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${priorityStyles[reminder.priority] ?? priorityStyles.medium}`}>
                      {reminder.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{reminder.body}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                    <span>{reminder.category}</span>
                    <span>{formatReminderTime(reminder.dueAt)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => dismissReminder(reminder.id)}
                      className="rounded-xl border border-slate-600 bg-slate-900 px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => completeReminder(reminder.id)}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-500/15"
                    >
                      Done
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  )
}
