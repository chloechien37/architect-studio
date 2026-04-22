import { RUNTIMES } from './Step3Architecture.jsx'

const DATA_LABELS = {
  code: 'Source Code',
  docs: 'Documentation',
  issues: 'Issues & PRs',
  chat: 'Chat & Threads',
  runtime: 'Runtime Signals',
  feeds: 'External Feeds',
  meetings: 'Meetings & Specs',
  team: 'Team Graph',
}

export default function Step4Finalize({ intent, dataTypes, runtime, architecture, onBack, onNext }) {
  const totalNodes = architecture?.layers.reduce((a, L) => a + L.nodes.length, 0) ?? 0
  const revisions = architecture?.meta?.revisions ?? 0
  const rt = RUNTIMES.find(r => r.id === runtime) ?? RUNTIMES[0]

  return (
    <section className="page">
      <div className="page-head">
        <span className="eyebrow">Chapter 04 — The Commitment</span>
        <h1 className="hero-title">Finalize your <em>agent</em>.</h1>
        <p className="hero-sub">
          One last look before deployment. Everything below will be compiled into a runnable GCP scaffold.
        </p>
      </div>

      <div className="summary-grid">
        <div className="summary-cell full">
          <span className="summary-cell-label">AGENT INTENT</span>
          <span className="summary-cell-value" style={{ fontStyle: 'italic' }}>
            "{intent}"
          </span>
        </div>

        <div className="summary-cell">
          <span className="summary-cell-label">RUNTIME</span>
          <span className="summary-cell-value">{rt.name}</span>
          <div className="summary-cell-tags">
            <span className="summary-tag gradient">{rt.tag}</span>
          </div>
        </div>

        <div className="summary-cell">
          <span className="summary-cell-label">DATA SOURCES</span>
          <span className="summary-cell-value">{dataTypes.length} tool{dataTypes.length === 1 ? '' : 's'}</span>
          <div className="summary-cell-tags">
            {dataTypes.map((d) => (
              <span key={d} className="summary-tag">{DATA_LABELS[d] ?? d}</span>
            ))}
          </div>
        </div>

        <div className="summary-cell">
          <span className="summary-cell-label">DEPENDENCIES</span>
          <span className="summary-cell-value">{architecture?.layers.length ?? 0} layers · {totalNodes} nodes</span>
          <div className="summary-cell-tags">
            {architecture?.layers.map((L) => (
              <span key={L.label} className="summary-tag">{L.label.toLowerCase()}</span>
            ))}
          </div>
        </div>

        <div className="summary-cell">
          <span className="summary-cell-label">REVISIONS</span>
          <span className="summary-cell-value">{revisions} pass{revisions === 1 ? '' : 'es'}</span>
          <div className="summary-cell-tags">
            <span className="summary-tag">draft · v{revisions + 1}</span>
            <span className="summary-tag">{new Date().toISOString().slice(0, 10)}</span>
          </div>
        </div>
      </div>

      <div className="arch-canvas compact" style={{ flex: 1, minHeight: 0 }}>
        {architecture?.layers.map((L) => (
          <div className="arch-layer" key={L.label}>
            <div className="arch-layer-label">{L.label}</div>
            <div className="arch-nodes">
              {L.nodes.map((n, i) => (
                <div className="arch-node" key={n + i}>{n}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={onBack}>← Keep refining</button>
        <button className="btn primary" onClick={onNext}>
          Deploy the agent<span className="btn-arrow">→</span>
        </button>
      </div>
    </section>
  )
}
