import { ShieldAlert } from 'lucide-react'

export default function EmergencyButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open emergency response guides"
      className="fixed bottom-4 right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full border border-rose-300/30 bg-rose-600 px-4 text-sm font-semibold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200 sm:bottom-6 sm:right-6"
    >
      <ShieldAlert aria-hidden="true" size={18} />
      Emergency
    </button>
  )
}
