import { ArrowLeft, ArrowRight, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { emergencyProtocols } from '../../data/emergencyProtocols'
import CPRGuide from './CPRGuide'
import ProtocolCard from './ProtocolCard'

function ProtocolStep({ protocol, step, stepIndex, onPrevious, onNext, onFinish }) {
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === protocol.steps.length - 1

  return (
    <section className="rounded-2xl border border-sky-500/15 bg-slate-950/45 p-4 sm:p-5" aria-live="polite">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-sky-200/70">
        Step {stepIndex + 1} of {protocol.steps.length}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
      <div className="mt-5 flex flex-wrap justify-between gap-3">
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
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            Finish protocol
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            Next step <ArrowRight aria-hidden="true" size={16} />
          </button>
        )}
      </div>
    </section>
  )
}

export default function EmergencyFlow() {
  const [selectedProtocolId, setSelectedProtocolId] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const selectedProtocol = emergencyProtocols.find(({ id }) => id === selectedProtocolId)

  function startProtocol(protocolId) {
    setSelectedProtocolId(protocolId)
    setStepIndex(0)
  }

  function returnToProtocols() {
    setSelectedProtocolId(null)
    setStepIndex(0)
  }

  function goToPreviousStep() {
    setStepIndex((currentStep) => Math.max(0, currentStep - 1))
  }

  function goToNextStep() {
    if (!selectedProtocol) {
      return
    }
    setStepIndex((currentStep) => Math.min(selectedProtocol.steps.length - 1, currentStep + 1))
  }

  return (
    <section aria-labelledby="emergency-flow-title">
      <div className="mb-5 rounded-2xl border border-rose-400/25 bg-rose-950/25 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-rose-200" size={20} />
          <div>
            <h2 className="font-semibold text-white">Get mission medical support now</h2>
            <p className="mt-1 text-sm leading-6 text-rose-100/85">
              For an immediate threat to life, alert the crew and contact flight medical support or mission control using your approved emergency channel. Follow the vehicle-specific checklist. Do not delay an emergency call to use this guide.
            </p>
          </div>
        </div>
      </div>

      {selectedProtocol ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300/80">Active protocol</p>
              <h2 id="emergency-flow-title" className="mt-1 text-xl font-semibold text-white">
                {selectedProtocol.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={returnToProtocols}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-600/50 px-3 text-sm text-slate-200 transition hover:bg-slate-800/70"
            >
              <ArrowLeft aria-hidden="true" size={16} /> All protocols
            </button>
          </div>
          <p className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-sm leading-6 text-amber-100/90">
            {selectedProtocol.warning}
          </p>
          {selectedProtocol.id === 'unresponsive' ? (
            <CPRGuide
              step={selectedProtocol.steps[stepIndex]}
              stepIndex={stepIndex}
              stepCount={selectedProtocol.steps.length}
              onPrevious={goToPreviousStep}
              onNext={goToNextStep}
              onFinish={returnToProtocols}
            />
          ) : (
            <ProtocolStep
              protocol={selectedProtocol}
              step={selectedProtocol.steps[stepIndex]}
              stepIndex={stepIndex}
              onPrevious={goToPreviousStep}
              onNext={goToNextStep}
              onFinish={returnToProtocols}
            />
          )}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h2 id="emergency-flow-title" className="text-lg font-semibold text-white">Choose a response guide</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Select the closest match, then follow each prompt while coordinating with mission medical support.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {emergencyProtocols.map((protocol) => (
              <ProtocolCard key={protocol.id} protocol={protocol} onSelect={startProtocol} />
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            These general guides do not replace training, the approved onboard medical checklist, or real-time direction from mission medical support.
          </p>
        </>
      )}
    </section>
  )
}
