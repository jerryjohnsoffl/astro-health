import { ArrowLeft, ArrowRight, HeartPulse } from 'lucide-react'

export default function CPRGuide({
  step,
  stepIndex,
  stepCount,
  onPrevious,
  onNext,
  onFinish,
}) {
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === stepCount - 1

  return (
    <section
      className="rounded-2xl border border-rose-400/20 bg-rose-950/20 p-4 sm:p-5"
      aria-labelledby="cpr-guide-title"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-rose-500/10 text-rose-200">
          <HeartPulse aria-hidden="true" size={19} />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-rose-200/75">Resuscitation guide</p>
          <h3 id="cpr-guide-title" className="font-semibold text-white">Mission-approved CPR</h3>
        </div>
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        Step {stepIndex + 1} of {stepCount}
      </p>
      <h4 className="mt-2 text-lg font-semibold text-white">{step.title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
      <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-sm leading-6 text-amber-100/90">
        Use the approved microgravity technique and anchoring method in your mission checklist. Do not improvise a restraint or CPR method.
      </p>
      <div className="mt-4 flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirstStep}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-600/50 px-3 text-sm text-slate-200 transition hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft aria-hidden="true" size={16} /> Previous
        </button>
        {isLastStep ? (
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
          >
            Finish guide
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
          >
            Next step <ArrowRight aria-hidden="true" size={16} />
          </button>
        )}
      </div>
    </section>
  )
}
