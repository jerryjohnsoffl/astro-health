import {
  Activity,
  Bell,
  BrainCircuit,
  ChevronRight,
  CloudSun,
  HeartPulse,
  Home,
  Leaf,
  Menu,
  MoonStar,
  Ruler,
  Settings,
  ShieldAlert,
  Smile,
  Stethoscope,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import AppShell from './core/AppShell'
import BodyMap from './components/bodymap/BodyMap'
import DetailDrawer from './components/detail/DetailDrawer'
import EmergencyFlow from './components/emergency/EmergencyFlow'
import EmergencyButton from './components/layout/EmergencyButton'
import ModelWorkbench from './components/ml/ModelWorkbench'
import ReminderCenter from './components/reminders/ReminderCenter'
import ManualWellbeingCheckin from './components/wellbeing/ManualWellbeingCheckin'
import astrohealthIcon from './assets/astrohealth-icon.svg'
import { environments } from './data/environments.js'
import { useSettingsStore } from './store/useSettingsStore.js'

const navItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'self-check', label: 'Self-Check', icon: Stethoscope },
  { id: 'health-map', label: 'Health Map', icon: Activity },
  { id: 'emergency', label: 'Emergency', icon: ShieldAlert },
  { id: 'wellbeing', label: 'Wellbeing', icon: Smile },
  { id: 'environment', label: 'Environment', icon: Leaf },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const panelClasses = 'rounded-[28px] border border-sky-500/15 bg-slate-900/35 p-4 sm:p-5'

function PageHeading({ id, eyebrow, title, description }) {
  return (
    <header className="mb-5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300/80">{eyebrow}</p>
      <h1 id={id} className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
    </header>
  )
}

function SectionLink({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${panelClasses} flex w-full items-start gap-4 text-left transition hover:border-sky-300/30 hover:bg-sky-500/5`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-200">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3 font-semibold text-white">
          {title}
          <ChevronRight size={16} className="shrink-0 text-sky-200/70" />
        </span>
        <span className="mt-1 block text-sm leading-5 text-slate-400">{description}</span>
      </span>
    </button>
  )
}

function OverviewSection({ navigate }) {
  return (
    <section aria-labelledby="overview-title">
      <PageHeading
        id="overview-title"
        eyebrow="Mission health"
        title="Overview"
        description="A high-level view of crew health tools. Open a section to enter measurements or run a model."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SectionLink
          icon={Stethoscope}
          title="Start a self-check"
          description="Enter symptoms and measurements for an on-device differential ranking."
          onClick={() => navigate('self-check')}
        />
        <SectionLink
          icon={Activity}
          title="Open the health map"
          description="Review body-system context and classify an ECG beat."
          onClick={() => navigate('health-map')}
        />
        <SectionLink
          icon={MoonStar}
          title="Review wellbeing"
          description="Complete a quick self-report or import a wearable sleep file."
          onClick={() => navigate('wellbeing')}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <section className={panelClasses} aria-labelledby="overview-vitals">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-rose-500/10 text-rose-300">
              <HeartPulse size={18} />
            </span>
            <div>
              <h2 id="overview-vitals" className="text-lg font-semibold text-white">Vitals snapshot</h2>
              <p className="text-xs text-slate-400">Illustrative dashboard values — not live sensor readings</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Heart rate', '68 bpm'],
              ['Hydration', '72%'],
              ['Body temperature', '36.6 °C'],
              ['Sleep (24 h)', '7.2 h'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-sky-500/10 bg-slate-950/45 p-3">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${panelClasses} border-amber-500/20`} aria-labelledby="overview-alert">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-300">
              <Zap size={18} />
            </span>
            <h2 id="overview-alert" className="text-lg font-semibold text-white">Mission alert</h2>
          </div>
          <p className="text-sm leading-6 text-slate-300">
            Example alert: radiation dose approaching 75% of the daily limit.
          </p>
          <button
            type="button"
            onClick={() => navigate('environment')}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-200 hover:text-white"
          >
            View environment <ChevronRight size={16} />
          </button>
        </section>
      </div>
    </section>
  )
}

function SelfCheckSection() {
  return (
    <section aria-labelledby="self-check-title">
      <PageHeading
        id="self-check-title"
        eyebrow="Self-Check"
        title="Symptoms and differential support"
        description="Enter current symptom severity and context measurements. The model ranks possible conditions; it does not diagnose."
      />
      <ModelWorkbench models={['cdss']} title="Differential support" />
    </section>
  )
}

function HealthMapSection({ onOpenSelfCheck }) {
  return (
    <section aria-labelledby="health-map-title">
      <PageHeading
        id="health-map-title"
        eyebrow="Health map"
        title="Body systems and cardiovascular signals"
        description="Review body-system context and run the ECG beat classifier with one 180-sample MLII window."
      />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className={panelClasses} aria-label="Body map">
          <BodyMap />
        </section>
        <DetailDrawer activeLayer="cardio" onOpenSelfCheck={onOpenSelfCheck} />
      </div>
      <ModelWorkbench models={['ecg']} title="Cardiovascular · ECG beat classification" />
    </section>
  )
}

function WellbeingSection() {
  return (
    <section aria-labelledby="wellbeing-title">
      <PageHeading
        id="wellbeing-title"
        eyebrow="Wellbeing"
        title="Sleep and recovery"
        description="Choose a quick self-report or analyze a compatible wearable/PSG export. Self-reported answers are not converted into sensor signals or sent to the sleep model."
      />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <ManualWellbeingCheckin />
        <ModelWorkbench models={['sleep']} title="Wearable sleep-stage analysis" />
      </div>
    </section>
  )
}

function EnvironmentSection() {
  return (
    <section aria-labelledby="environment-title">
      <PageHeading
        id="environment-title"
        eyebrow="Environment"
        title="Mission environment"
        description="Environmental readings and thresholds for crew context."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Radiation dose', '48.2 / 100 mSv', 'Illustrative value'],
          ['Cabin air quality', 'Nominal', 'Illustrative status'],
          ['O₂ level', '21.0%', 'Illustrative value'],
        ].map(([label, value, note]) => (
          <section key={label} className={panelClasses}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{note}</p>
          </section>
        ))}
      </div>
    </section>
  )
}

function EmergencySection() {
  return (
    <section aria-labelledby="emergency-title">
      <PageHeading
        id="emergency-title"
        eyebrow="Emergency response"
        title="Crew emergency guides"
        description="Use mission-approved procedures and contact flight medical support or mission control for real-time guidance."
      />
      <EmergencyFlow />
    </section>
  )
}

function SettingsSection() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()
  const [draft, setDraft] = useState(settings)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const selectedEnvironment = environments.find(({ id }) => id === draft.environment)

  function updateDraft(updates) {
    setDraft((current) => ({ ...current, ...updates }))
    setSaveMessage('')
    setSaveError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSaveMessage('')
    setSaveError('')

    try {
      updateSettings(draft)
      setSaveMessage('Settings saved on this device.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error))
    }
  }

  function handleReset() {
    setSaveMessage('')
    setSaveError('')

    try {
      setDraft(resetSettings())
      setSaveMessage('Settings restored to defaults.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <section aria-labelledby="settings-title">
      <PageHeading
        id="settings-title"
        eyebrow="Preferences"
        title="Settings"
        description="Set your mission context, measurement units, and crew profile. Profile details and preferences are saved locally in this browser and can be changed anytime."
      />
      <form onSubmit={handleSubmit} className={`${panelClasses} space-y-6`}>
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-white">Mission context</legend>
          <label className="block space-y-2 text-sm text-slate-200">
            <span>Environment</span>
            <select
              value={draft.environment}
              onChange={(event) => updateDraft({ environment: event.target.value })}
              className="w-full rounded-xl border border-sky-500/20 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-sky-300/60 sm:max-w-xl"
            >
              {environments.map(({ id, name }) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </label>
          {selectedEnvironment && (
            <div className="rounded-xl border border-sky-500/10 bg-slate-950/50 p-4 text-sm">
              <p className="text-slate-200">{selectedEnvironment.missionContext}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Operational limits are not configured from the available research summaries.
              </p>
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-white">Display preferences</legend>
          <label className="block space-y-2 text-sm text-slate-200 sm:max-w-xl">
            <span>Measurement units</span>
            <select
              value={draft.units}
              onChange={(event) => updateDraft({ units: event.target.value })}
              className="w-full rounded-xl border border-sky-500/20 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-sky-300/60"
            >
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
            </select>
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-white">Crew profile</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              <span>Crew ID</span>
              <input
                type="text"
                autoComplete="off"
                value={draft.crewProfile.crewId}
                onChange={(event) =>
                  updateDraft({
                    crewProfile: { ...draft.crewProfile, crewId: event.target.value },
                  })
                }
                className="w-full rounded-xl border border-sky-500/20 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-sky-300/60"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Display name</span>
              <input
                type="text"
                autoComplete="name"
                value={draft.crewProfile.displayName}
                onChange={(event) =>
                  updateDraft({
                    crewProfile: { ...draft.crewProfile, displayName: event.target.value },
                  })
                }
                className="w-full rounded-xl border border-sky-500/20 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-sky-300/60"
              />
            </label>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-xl border border-sky-300/30 bg-sky-500/15 px-4 py-2.5 text-sm font-medium text-sky-100 hover:bg-sky-500/25"
          >
            Save settings
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Restore defaults
          </button>
          {saveMessage && <p className="text-sm text-emerald-200" role="status">{saveMessage}</p>}
          {saveError && <p className="text-sm text-rose-300" role="alert">{saveError}</p>}
        </div>
      </form>
    </section>
  )
}

function FirstUseProfileDialog() {
  const { settings, completeProfileSetup } = useSettingsStore()
  const [crewProfile, setCrewProfile] = useState(settings.crewProfile)
  const [saveError, setSaveError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setSaveError('')
    try {
      completeProfileSetup(crewProfile)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-use-title"
        aria-describedby="first-use-description"
        className="w-full max-w-md rounded-3xl border border-sky-400/25 bg-slate-900 p-5 shadow-2xl sm:p-6"
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300/80">First-time setup</p>
        <h2 id="first-use-title" className="mt-2 text-xl font-semibold text-white">
          Set up your crew profile
        </h2>
        <p id="first-use-description" className="mt-2 text-sm leading-6 text-slate-300">
          Enter your name to continue. A crew ID is optional. You can update these details anytime in Settings.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block space-y-2 text-sm text-slate-200">
            <span>Display name</span>
            <input
              type="text"
              autoComplete="name"
              autoFocus
              required
              value={crewProfile.displayName}
              onChange={(event) =>
                setCrewProfile((current) => ({ ...current, displayName: event.target.value }))
              }
              className="w-full rounded-xl border border-sky-500/20 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-sky-300/60"
            />
          </label>
          <label className="block space-y-2 text-sm text-slate-200">
            <span>Crew ID <span className="text-slate-500">(optional)</span></span>
            <input
              type="text"
              autoComplete="off"
              value={crewProfile.crewId}
              onChange={(event) =>
                setCrewProfile((current) => ({ ...current, crewId: event.target.value }))
              }
              className="w-full rounded-xl border border-sky-500/20 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-sky-300/60"
            />
          </label>
          {saveError && <p className="text-sm text-rose-300" role="alert">{saveError}</p>}
          <p className="text-xs leading-5 text-slate-400">
            Profile details and health entries stay in this browser’s local storage; they are not sent to a server.
          </p>
          <button
            type="submit"
            className="w-full rounded-xl border border-sky-300/30 bg-sky-500/15 px-4 py-2.5 text-sm font-medium text-sky-100 hover:bg-sky-500/25"
          >
            Save profile and continue
          </button>
        </form>
      </section>
    </div>
  )
}

function ComingSoonSection({ title }) {
  return (
    <section aria-labelledby="section-title">
      <PageHeading
        id="section-title"
        eyebrow="AstroHealth"
        title={title}
        description="This section is not connected to an interactive workflow yet."
      />
      <div className={panelClasses}>
        <p className="text-sm leading-6 text-slate-300">
          Use the sidebar to return to Overview, Self-Check, Health Map, or Wellbeing.
        </p>
      </div>
    </section>
  )
}

function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { settings } = useSettingsStore()
  const environmentName =
    environments.find(({ id }) => id === settings.environment)?.name ?? settings.environment

  function navigate(section) {
    setActiveSection(section)
    setIsMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function renderActiveSection() {
    switch (activeSection) {
      case 'self-check':
        return <SelfCheckSection />
      case 'health-map':
        return <HealthMapSection onOpenSelfCheck={() => navigate('self-check')} />
      case 'wellbeing':
        return <WellbeingSection />
      case 'environment':
        return <EnvironmentSection />
      case 'emergency':
        return <EmergencySection />
      case 'reminders':
        return <ReminderCenter />
      case 'settings':
        return <SettingsSection key={settings.profileSetupComplete ? 'profile-complete' : 'profile-needed'} />
      case 'overview':
      default:
        return <OverviewSection navigate={navigate} />
    }
  }

  return (
    <AppShell
      header={
        <header className="border-b border-sky-400/15 bg-[radial-gradient(circle_at_top,_rgba(20,66,110,0.65),_rgba(6,18,34,0.97)_48%,_rgba(2,6,18,1)_100%)]">
          <div className="mx-auto flex w-full max-w-[1540px] items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => navigate('overview')}
              className="flex items-center gap-3 text-left"
              aria-label="AstroHealth overview"
            >
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-sky-400/30 bg-sky-500/10 p-1.5">
                <img src={astrohealthIcon} alt="" className="h-full w-full object-contain" />
              </span>
              <span className="leading-tight">
                <span className="block text-2xl font-semibold tracking-tight text-white">AstroHealth</span>
                <span className="block text-xs uppercase tracking-[0.2em] text-sky-100/60">Crew Health Company</span>
              </span>
            </button>

            <div className="hidden items-center gap-3 md:flex">
              <div className="flex items-center gap-2 rounded-xl border border-sky-500/15 bg-sky-500/5 px-3 py-2 text-sm text-sky-100/80">
                <BrainCircuit size={15} />
                <span>Crew ID: {settings.crewProfile.crewId || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-sky-500/15 bg-sky-500/5 px-3 py-2 text-sm text-sky-100/80">
                <CloudSun size={15} />
                <span>Mission Day 128</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-sky-500/15 bg-sky-500/5 px-3 py-2 text-sm text-sky-100/80">
                <Leaf size={15} />
                <span>{environmentName}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-sky-500/15 bg-sky-500/5 px-3 py-2 text-sm text-sky-100/80">
                <Ruler size={15} />
                <span>{settings.units === 'metric' ? 'Metric units' : 'Imperial units'}</span>
              </div>
            </div>
            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
              className="grid size-10 place-items-center rounded-xl border border-sky-400/25 bg-sky-500/10 text-sky-100 md:hidden"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          {isMobileMenuOpen && (
            <nav id="mobile-navigation" aria-label="Primary navigation" className="border-t border-sky-400/15 px-4 py-3 md:hidden">
              <div className="mx-auto grid w-full max-w-[1540px] grid-cols-2 gap-2 sm:px-2">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-current={activeSection === id ? 'page' : undefined}
                    onClick={() => navigate(id)}
                    className={[
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm',
                      activeSection === id ? 'bg-sky-500/15 text-white' : 'text-sky-100/75 hover:bg-sky-500/5',
                    ].join(' ')}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </nav>
          )}
        </header>
      }
    >
      <div className="relative flex min-w-0 gap-5">
        <aside className="sticky top-0 hidden h-[calc(100vh-2.5rem)] w-16 shrink-0 self-start rounded-[30px] border border-sky-500/15 bg-slate-950/95 p-2 md:block xl:w-[240px] xl:p-3">
          <nav aria-label="Primary navigation" className="space-y-2">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  title={label}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => navigate(id)}
                  className={[
                    'flex w-full items-center justify-center gap-3 rounded-2xl px-2 py-3 text-left text-base transition xl:justify-start xl:px-3',
                    isActive
                      ? 'border border-sky-400/30 bg-sky-500/15 text-white shadow-[0_0_18px_rgba(56,189,248,0.12)]'
                      : 'text-sky-100/75 hover:bg-sky-500/5',
                  ].join(' ')}
                >
                  <span className={['grid size-8 place-items-center rounded-xl', isActive ? 'bg-sky-500/10 text-sky-200' : 'text-sky-100/70'].join(' ')}>
                    <Icon size={17} />
                  </span>
                  <span className="hidden xl:inline">{label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="relative min-w-0 flex-1 overflow-hidden rounded-[32px] border border-sky-500/15 bg-[radial-gradient(circle_at_center,_rgba(8,22,35,0.95),_rgba(5,14,26,0.98)_36%,_rgba(1,6,15,1))] p-4 shadow-[0_0_60px_rgba(14,79,141,0.18)] sm:p-5">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(circle_at_center,_rgba(33,128,255,0.26),transparent_54%)]" />
          <div key={activeSection} className="relative min-w-0">
            {renderActiveSection()}
          </div>
        </div>
      </div>
      <EmergencyButton onClick={() => navigate('emergency')} />
      {!settings.profileSetupComplete && <FirstUseProfileDialog />}
    </AppShell>
  )
}

export default App
