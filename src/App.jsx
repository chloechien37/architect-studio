import { useState } from 'react'
import './App.css'
import Stepper from './components/Stepper.jsx'
import GeminiLogo from './components/GeminiLogo.jsx'
import Step1Intent from './components/Step1Intent.jsx'
import Step2DataTypes from './components/Step2DataTypes.jsx'
import Step3Architecture from './components/Step3Architecture.jsx'
import Step4Finalize from './components/Step4Finalize.jsx'
import Step5Generate from './components/Step5Generate.jsx'

const STEPS = [
  { id: 1, label: 'Intent',       caption: 'What to build' },
  { id: 2, label: 'Data',         caption: 'What it reads' },
  { id: 3, label: 'Architecture', caption: 'Runtime & stack' },
  { id: 4, label: 'Finalize',     caption: 'Confirm blueprint' },
  { id: 5, label: 'Generate',     caption: 'Bring it to life' },
]

export default function App() {
  const [step, setStep] = useState(1)
  const [intent, setIntent] = useState('')
  const [dataTypes, setDataTypes] = useState([])
  const [runtime, setRuntime] = useState('vertex-agent-engine')
  const [architecture, setArchitecture] = useState(null)

  const next = () => setStep(s => Math.min(5, s + 1))
  const back = () => setStep(s => Math.max(1, s - 1))

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <GeminiLogo size={28} spin />
          <span className="brand-name">Agent<br />Studio</span>
        </div>

        <Stepper steps={STEPS} current={step} onJump={(n) => n < step && setStep(n)} />

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
        <div className="stage-inner" key={step}>
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
            <Step4Finalize
              intent={intent}
              dataTypes={dataTypes}
              runtime={runtime}
              architecture={architecture}
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
            />
          )}
        </div>
      </main>
    </div>
  )
}
