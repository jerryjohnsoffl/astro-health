import { Wifi, WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { getModelStatusSnapshot, subscribeToModelStatus } from '../../ml/workerApi.js'

const modelLabels = {
  'cdss-mlp': 'CDSS',
  ecg_model: 'ECG',
  'sleep-cnn': 'Sleep',
}

const statusLabels = {
  'not-loaded': 'Not loaded',
  loading: 'Loading',
  ready: 'Ready',
  error: 'Error',
}

export default function ModelStatusFooter({ isOnline }) {
  const ConnectionIcon = isOnline ? Wifi : WifiOff
  const modelStatuses = useSyncExternalStore(
    subscribeToModelStatus,
    getModelStatusSnapshot,
    getModelStatusSnapshot,
  )

  return (
    <footer className="border-t border-slate-800 bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-3 text-xs text-slate-400 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}
              aria-hidden="true"
            />
            <ConnectionIcon aria-hidden="true" size={14} />
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <span className="text-slate-600" aria-hidden="true">|</span>
          <span>Models</span>
          {Object.entries(modelStatuses).map(([modelId, modelStatus]) => (
            <span
              key={modelId}
              className={`rounded-full border px-2.5 py-1 ${
                modelStatus.status === 'ready'
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                  : modelStatus.status === 'error'
                    ? 'border-rose-500/20 bg-rose-500/5 text-rose-300'
                    : modelStatus.status === 'loading'
                      ? 'border-sky-500/20 bg-sky-500/5 text-sky-300'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
              title={modelStatus.error ?? `${modelLabels[modelId]} model ${statusLabels[modelStatus.status].toLowerCase()}`}
              role="status"
              aria-live="polite"
            >
              {modelLabels[modelId]}: {statusLabels[modelStatus.status]}
            </span>
          ))}
        </div>
        <span>Models run locally in this browser</span>
      </div>
    </footer>
  )
}
