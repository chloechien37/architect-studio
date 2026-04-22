export default function Stepper({ steps, current, onJump }) {
  const fillPct = ((current - 1) / (steps.length - 1)) * 100

  return (
    <nav className="stepper" aria-label="Progress">
      <div className="stepper-rail">
        <div className="stepper-rail-fill" style={{ height: `${fillPct}%` }} />
      </div>

      {steps.map((s) => {
        const state = s.id === current ? 'active' : s.id < current ? 'done' : 'pending'
        return (
          <div
            key={s.id}
            className={`step-cell ${state}`}
            onClick={() => state === 'done' && onJump?.(s.id)}
          >
            <div className="step-bubble">
              {state === 'done' ? '✓' : String(s.id).padStart(2, '0')}
            </div>
            <div className="step-text">
              <span className="step-label">{s.label}</span>
              <span className="step-caption">
                {state === 'active' ? 'current step' : state === 'done' ? 'complete' : s.caption}
              </span>
            </div>
          </div>
        )
      })}
    </nav>
  )
}
