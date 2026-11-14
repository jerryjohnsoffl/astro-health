import HeaderBar from '../components/layout/HeaderBar'
import ModelStatusFooter from '../components/layout/ModelStatusFooter'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function AppShell({ children, header, footer }) {
  const isOnline = useOnlineStatus()

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {header ?? <HeaderBar isOnline={isOnline} />}
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8"
      >
        {children ?? (
          <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
            <p className="max-w-md text-sm leading-6 text-slate-400">
              Dashboard modules will appear here.
            </p>
          </div>
        )}
      </main>
      {footer ?? <ModelStatusFooter isOnline={isOnline} />}
    </div>
  )
}
