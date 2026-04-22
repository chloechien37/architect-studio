const DATA_TYPES = [
  { id: 'code',     icon: '≡', title: 'Source Code',      desc: 'Git repos, branches, diffs, blame, commit graph.' },
  { id: 'docs',     icon: '§', title: 'Documentation',    desc: 'Markdown, wikis, RFCs, design docs, ADRs.' },
  { id: 'issues',   icon: '▤', title: 'Issues & PRs',     desc: 'GitHub/GitLab issues, pull requests, reviews.' },
  { id: 'chat',     icon: '✉', title: 'Chat & Threads',   desc: 'Slack, Discord, Teams conversations.' },
  { id: 'runtime',  icon: '∿', title: 'Runtime Signals',  desc: 'Logs, metrics, traces, on-call pages.' },
  { id: 'feeds',    icon: '✦', title: 'External Feeds',   desc: 'OSS releases, CVE feeds, news, changelogs.' },
  { id: 'meetings', icon: '◉', title: 'Meetings & Specs', desc: 'Transcripts, recordings, product specs.' },
  { id: 'team',     icon: 'Ü', title: 'Team Graph',       desc: 'People, roles, ownership, on-call rotations.' },
]

export default function Step2DataTypes({ intent, selected, setSelected, onBack, onNext }) {
  const toggle = (id) => {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  return (
    <section className="page">
      <div className="page-head">
        <span className="eyebrow">Chapter 02 — The Senses</span>
        <h1 className="hero-title">What will your agent <em>read</em>?</h1>
        <p className="hero-sub">
          Each source becomes a tool the agent can call — indexed, embedded, and permissioned.
          {intent && <> &nbsp;<span style={{ fontFamily: "'Noto Serif Display', serif", fontStyle: 'italic', color: 'var(--ink-faint)' }}>for — "{intent.length > 80 ? intent.slice(0, 77) + '…' : intent}"</span></>}
        </p>
      </div>

      <div className="data-grid">
        {DATA_TYPES.map((d) => {
          const on = selected.includes(d.id)
          return (
            <button
              key={d.id}
              className={`data-card ${on ? 'selected' : ''}`}
              onClick={() => toggle(d.id)}
            >
              <span className="data-card-check">{on ? '✓' : ''}</span>
              <span className="data-card-icon">{d.icon}</span>
              <div className="data-card-title">{d.title}</div>
              <div className="data-card-desc">{d.desc}</div>
            </button>
          )
        })}
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={onBack}>← Back</button>
        <div className="actions-inline">
          <span className="step-index">{selected.length} SELECTED · 02 / 05</span>
          <button className="btn primary" disabled={selected.length === 0} onClick={onNext}>
            Shape the runtime<span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  )
}
