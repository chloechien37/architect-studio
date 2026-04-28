import { useMemo, useState } from 'react'
import './App.css'
import Stepper from './components/Stepper.jsx'
import GeminiLogo from './components/GeminiLogo.jsx'
import Step1Intent from './components/Step1Intent.jsx'
import Step2DataTypes from './components/Step2DataTypes.jsx'
import Step3Architecture from './components/Step3Architecture.jsx'
import Step4Review from './components/Step4Review.jsx'
import Step5Generate from './components/Step5Generate.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import { AGENTS, LIFECYCLES } from './data/agents.js'

const STEPS = [
  { id: 1, label: 'Intent',       caption: 'What to build' },
  { id: 2, label: 'Data',         caption: 'What it reads' },
  { id: 3, label: 'Architecture', caption: 'Runtime & stack' },
  { id: 4, label: 'Review',       caption: 'Hardening & sources' },
  { id: 5, label: 'Generate',     caption: 'Bring it to life' },
]

const LIFECYCLE_FILTERS = [
  { id: 'all',        label: 'All agents' },
  { id: 'active',     label: 'Active' },
  { id: 'deploying',  label: 'Deploying' },
  { id: 'paused',     label: 'Paused' },
  { id: 'quarantine', label: 'Quarantine' },
  { id: 'failed',     label: 'Failed' },
]

export default function App() {
  const [mode, setMode] = useState('compose') // 'compose' | 'fleet'
  const [step, setStep] = useState(1)
  const [intent, setIntent] = useState('')
  const [dataTypes, setDataTypes] = useState([])
  const [runtime, setRuntime] = useState('vertex-agent-engine')
  const [architecture, setArchitecture] = useState(null)
  const [compliant, setCompliant] = useState(true)
  const [fleetFilter, setFleetFilter] = useState('all')

  const next = () => setStep(s => Math.min(5, s + 1))
  const back = () => setStep(s => Math.max(1, s - 1))

  const fleetCounts = useMemo(() => {
    const counts = { all: AGENTS.length }
    for (const a of AGENTS) counts[a.lifecycle] = (counts[a.lifecycle] ?? 0) + 1
    return counts
  }, [])

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <GeminiLogo size={28} spin />
          <span className="brand-name">Agent<br />Studio</span>
        </div>

        <div className="mode-switch" role="tablist" aria-label="Studio mode">
          <button
            role="tab"
            aria-selected={mode === 'compose'}
            className={`mode-tab ${mode === 'compose' ? 'active' : ''}`}
            onClick={() => setMode('compose')}
          >
            <span className="mode-glyph">✦</span>
            <span>Compose</span>
          </button>
          <button
            role="tab"
            aria-selected={mode === 'fleet'}
            className={`mode-tab ${mode === 'fleet' ? 'active' : ''}`}
            onClick={() => setMode('fleet')}
          >
            <span className="mode-glyph">◉</span>
            <span>Fleet</span>
            <span className="mode-count">{AGENTS.length}</span>
          </button>
        </div>

        {mode === 'compose' ? (
          <Stepper steps={STEPS} current={step} onJump={(n) => n < step && setStep(n)} />
        ) : (
          <FleetFilters
            counts={fleetCounts}
            active={fleetFilter}
            onChange={setFleetFilter}
          />
        )}

        <div className="sidebar-foot">
          <div className="sidebar-meta">
            <span className="meta-dim">SESSION</span>
            <span className="meta-val">{new Date().toISOString().slice(0, 10)}</span>
          </div>
          <div className="sidebar-meta">
            <span className="meta-dim">PROJECT</span>
            <span className="meta-val">gcp-agent-demo</span>
          </div>
          <div className="sidebar-meta">
            <span className="meta-dim">REGION</span>
            <span className="meta-val">us-central1</span>
          </div>
          <div className="sidebar-signature">
            <GeminiLogo size={14} />
            <span className="sidebar-signature-text">Powered by Gemini</span>
          </div>
        </div>
      </aside>

      <main className="stage">
        <div className="stage-inner" key={mode + '-' + step}>
          {mode === 'compose' && (
            <>
              {step === 1 && <Step1Intent value={intent} setValue={setIntent} onNext={next} />}
              {step === 2 && (
                <Step2DataTypes
                  intent={intent}
                  selected={dataTypes}
                  setSelected={setDataTypes}
                  onBack={back}
                  onNext={next}
                />
              )}
              {step === 3 && (
                <Step3Architecture
                  intent={intent}
                  dataTypes={dataTypes}
                  runtime={runtime}
                  setRuntime={setRuntime}
                  architecture={architecture}
                  setArchitecture={setArchitecture}
                  onBack={back}
                  onNext={next}
                />
              )}
              {step === 4 && (
                <Step4Review
                  intent={intent}
                  dataTypes={dataTypes}
                  runtime={runtime}
                  architecture={architecture}
                  setCompliant={setCompliant}
                  onBack={back}
                  onNext={next}
                />
              )}
              {step === 5 && (
                <Step5Generate
                  intent={intent}
                  dataTypes={dataTypes}
                  runtime={runtime}
                  architecture={architecture}
                  compliant={compliant}
                />
              )}
            </>
          )}

          {mode === 'fleet' && <AdminPanel filter={fleetFilter} />}
        </div>
      </main>
    </div>
  )
}

function FleetFilters({ counts, active, onChange }) {
  return (
    <nav className="fleet-filters" aria-label="Lifecycle filters">
      <div className="fleet-filters-title">Lifecycle</div>
      {LIFECYCLE_FILTERS.map(f => {
        const count = counts[f.id] ?? 0
        const dot = f.id === 'all' ? null : LIFECYCLES[f.id]?.dot
        return (
          <button
            key={f.id}
            className={`fleet-filter ${active === f.id ? 'active' : ''}`}
            onClick={() => onChange(f.id)}
          >
            <span className="fleet-filter-dot" style={{ background: dot ?? 'transparent', border: dot ? 'none' : '1.5px dashed var(--line-strong)' }} />
            <span className="fleet-filter-label">{f.label}</span>
            <span className="fleet-filter-count">{count}</span>
          </button>
        )
      })}
    </nav>
  )
}
