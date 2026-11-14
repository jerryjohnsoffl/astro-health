import { ArrowRight, BrainCircuit, Check, Sparkles } from 'lucide-react'
import brainSvg from '../../assets/Human_Brain_Symbol.svg'

const systemContent = {
  brain: {
    name: 'Brain & Eyes',
    tone: 'Healthy',
    note: 'Minor signs of fluid shift detected.',
    action: ['Take a cognitive test (10 min)', 'Check for vision changes', 'Stay hydrated'],
  },
  cardio: {
    name: 'Cardio',
    tone: 'Watch Closely',
    note: 'Slightly elevated recovery response after exertion.',
    action: ['Review exertion levels', 'Monitor hydration', 'Check resting heart variability'],
  },
  skeletal: {
    name: 'Skeletal',
    tone: 'Healthy',
    note: 'Bone density remains within expected range.',
    action: ['Continue microgravity resistance routine', 'Log any joint discomfort', 'Review load exposure'],
  },
  renal: {
    name: 'Renal',
    tone: 'Watch Closely',
    note: 'Urine concentration trending slightly high.',
    action: ['Increase water intake', 'Review electrolyte balance', 'Reassess before EVA'],
  },
}

export default function DetailDrawer({ activeLayer = 'brain', onOpenSelfCheck }) {
  const normalizedLayer = activeLayer === 'neuro' || activeLayer === 'brain' ? 'brain' : activeLayer
  const content = systemContent[normalizedLayer] ?? systemContent.brain

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-sky-500/15 bg-slate-900/30 p-4 shadow-[inset_0_1px_0_rgba(125,211,252,0.08)] backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-sky-400/30 bg-sky-500/10 text-sky-200">
              <BrainCircuit size={20} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-sky-200/70">Selected region</div>
              <h3 className="text-2xl font-semibold tracking-tight text-white">{content.name}</h3>
            </div>
          </div>
          <span
            className={[
              'rounded-full border px-2.5 py-1 text-[11px] font-medium',
              content.tone === 'Healthy'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300',
            ].join(' ')}
          >
            {content.tone}
          </span>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-sky-400/15 bg-sky-500/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-20 items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/10 p-2">
              <img src={brainSvg} alt="Brain icon" className="h-14 w-14 object-contain" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-sky-100/65">Status</div>
              <div className="text-lg font-semibold text-white">{content.tone}</div>
            </div>
          </div>
          <div className="text-right text-xs text-sky-100/70">
            {content.note}
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 text-lg font-semibold text-white">What to do?</div>
          <ul className="space-y-2 text-sm text-sky-100/80">
            {content.action.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 grid size-5 place-items-center rounded-full bg-emerald-400/20 text-emerald-300">
                  <Check size={12} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onOpenSelfCheck}
          className="flex w-full items-center justify-between rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-500/15"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} />
            View details
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
          Enter current symptoms and measurements to run an on-device differential ranking.
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
