import { ChevronRight, Siren } from 'lucide-react'

const urgencyClasses = {
  'Immediate response': 'border-rose-400/20 bg-rose-500/10 text-rose-200',
  'Urgent response': 'border-amber-400/20 bg-amber-500/10 text-amber-200',
}

export default function ProtocolCard({ protocol, onSelect }) {
  return (
    <article className="flex flex-col rounded-2xl border border-sky-500/15 bg-slate-950/45 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-200">
          <Siren aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-white">{protocol.title}</h3>
          <span
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
              urgencyClasses[protocol.urgency] ?? 'border-slate-500/20 bg-slate-500/10 text-slate-200'
            }`}
          >
            {protocol.urgency}
          </span>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{protocol.summary}</p>
      <button
        type="button"
        onClick={() => onSelect(protocol.id)}
        className="mt-4 inline-flex min-h-11 items-center justify-between gap-2 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
      >
        Start protocol <ChevronRight aria-hidden="true" size={16} />
      </button>
    </article>
  )
}
