const SUGGESTIONS = [
  'a daily open-source digest agent that surfaces releases, CVEs, and trending repos for my stack',
  'a code-reading agent that answers deep questions about any repository by walking its call graph',
  'a PR-review agent that reads every diff and posts inline critique on style, logic, and risk',
  'a program-sync agent that stitches Slack threads, docs, and issue trackers into a weekly status brief',
]

export default function Step1Intent({ value, setValue, onNext }) {
  return (
    <section className="page">
      <div className="page-head">
        <span className="eyebrow">Chapter 01 — The Calling</span>
        <h1 className="hero-title">
          What <em>agent</em> do you want to be today?
        </h1>
        <p className="hero-sub">
          Describe the quiet collaborator you'd like running beside you.
          We'll compose its runtime, memory, and senses on Google Cloud.
        </p>
      </div>

      <label className="intent-field" htmlFor="intent-input">
        <span className="intent-field-label">✎ Your agent · describe below</span>
        <textarea
          id="intent-input"
          className="intent-input"
          placeholder="An agent that reads my codebase every morning and drafts a changelog…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          rows={2}
        />
        <div className="intent-hint">
          <span>⇥ {value.length} chars</span>
          <span>{value.trim() ? 'READY' : 'AWAITING INPUT'}</span>
        </div>
      </label>

      <div>
        <div className="suggestion-title">— or borrow a starting point —</div>
        <div className="intent-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => setValue(s)} title={s}>
              ↳ {s.length > 70 ? s.slice(0, 67) + '…' : s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div className="actions">
        <span className="step-index">01 / 05 — INTENT</span>
        <button className="btn primary" disabled={!value.trim()} onClick={onNext}>
          Continue to data<span className="btn-arrow">→</span>
        </button>
      </div>
    </section>
  )
}
