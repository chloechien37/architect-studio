import { useMemo, useState } from 'react'
import { AGENTS, LIFECYCLES, RUNTIME_LABELS } from '../data/agents.js'

const DATA_LABELS = {
  code: 'Source code', docs: 'Docs', issues: 'Issues & PRs', chat: 'Chat',
  runtime: 'Runtime signals', feeds: 'External feeds', meetings: 'Meetings', team: 'Team graph',
}

const ACTIVITY_ICON = {
  run: '▶', tool: '◇', deploy: '↗', wake: '✦', flag: '!',
}

function formatInvocations(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function AdminPanel({ filter }) {
  const agents = useMemo(() => {
    if (filter === 'all' || !filter) return AGENTS
    return AGENTS.filter(a => a.lifecycle === filter)
  }, [filter])

  const [selectedId, setSelectedId] = useState(agents[0]?.id ?? AGENTS[0].id)
  const selected = AGENTS.find(a => a.id === selectedId) ?? AGENTS[0]

  // Keep selection valid when filter changes
  const visibleIds = agents.map(a => a.id)
  const resolvedSelected = visibleIds.includes(selectedId) ? selected : (agents[0] ?? selected)

  return (
    <section className="admin">
      <div className="admin-head">
        <span className="eyebrow">Fleet — your running agents</span>
        <h1 className="hero-title">Every agent, <em>alive or waiting.</em></h1>
        <p className="hero-sub">
          A live view of the agents you've spun up — their runtime, lifecycle, and the signals they've sent back.
        </p>
      </div>

      <div className="admin-grid">
        <aside className="admin-list">
          <div className="admin-list-head">
            <span>{agents.length} {agents.length === 1 ? 'agent' : 'agents'}</span>
            <span className="admin-list-sort">sorted · last activity</span>
          </div>
          <div className="admin-list-scroll">
            {agents.map(a => {
              const on = a.id === resolvedSelected.id
              const lc = LIFECYCLES[a.lifecycle]
              return (
                <button
                  key={a.id}
                  className={`agent-row ${on ? 'selected' : ''}`}
                  onClick={() => setSelectedId(a.id)}
                >
                  <span className="agent-row-dot" style={{ background: lc.dot }} aria-hidden />
                  <div className="agent-row-body">
                    <div className="agent-row-top">
                      <span className="agent-row-name">{a.name}</span>
                      <span className="agent-row-id">{a.id}</span>
                    </div>
                    <div className="agent-row-meta">
                      <span className="agent-row-runtime">{RUNTIME_LABELS[a.runtime]}</span>
                      <span className="agent-row-sep">·</span>
                      <span className={`agent-row-lc lc-${a.lifecycle}`}>{lc.label.toLowerCase()}</span>
                    </div>
                    <div className="agent-row-last">last · {a.lastRun}</div>
                  </div>
                </button>
              )
            })}
            {agents.length === 0 && (
              <div className="admin-empty">
                <span>No agents in this lifecycle.</span>
              </div>
            )}
          </div>
        </aside>

        <AgentDetail agent={resolvedSelected} />
      </div>
    </section>
  )
}

function AgentDetail({ agent }) {
  const lc = LIFECYCLES[agent.lifecycle]

  return (
    <div className="admin-detail" key={agent.id}>
      <div className="detail-header">
        <div className="detail-header-top">
          <div>
            <div className="detail-name-row">
              <span className="detail-name">{agent.name}</span>
              <span className="detail-id">{agent.id}</span>
              <span className={`detail-lc-pill lc-pill-${agent.lifecycle}`}>
                <span className="detail-lc-dot" style={{ background: lc.dot }} />
                {lc.label}
              </span>
            </div>
            <p className="detail-intent">"{agent.intent}"</p>
          </div>
          <div className="detail-actions">
            {agent.lifecycle === 'active' && <button className="mini-btn">Pause</button>}
            {agent.lifecycle === 'paused' && <button className="mini-btn accent">Resume</button>}
            {agent.lifecycle === 'quarantine' && <button className="mini-btn accent">Reinstate</button>}
            {agent.lifecycle === 'failed' && <button className="mini-btn accent">Retry</button>}
            <button className="mini-btn">Blueprint</button>
            <button className="mini-btn ghost">⋯</button>
          </div>
        </div>
      </div>

      <div className="detail-metrics">
        <Metric label="Invocations · 7d" value={formatInvocations(agent.invocations)} />
        <Metric
          label="Success rate"
          value={agent.successRate == null ? '—' : `${(agent.successRate * 100).toFixed(1)}%`}
          tone={agent.successRate != null && agent.successRate < 0.9 ? 'warn' : 'ok'}
        />
        <Metric label="p50 latency" value={agent.p50Latency} />
        <Metric label="Cost · 7d" value={agent.cost7d} />
      </div>

      <div className="detail-columns">
        <div className="detail-col">
          <h3 className="detail-section-title">Configuration</h3>
          <dl className="detail-kv">
            <div><dt>Runtime</dt><dd>{RUNTIME_LABELS[agent.runtime]}</dd></div>
            <div><dt>Model</dt><dd>{agent.model}</dd></div>
            <div><dt>Region</dt><dd>{agent.region}</dd></div>
            <div><dt>Version</dt><dd className="mono">{agent.version}</dd></div>
            <div><dt>Owner</dt><dd>{agent.owner}</dd></div>
            <div><dt>Created</dt><dd>{agent.created}</dd></div>
          </dl>

          <h3 className="detail-section-title" style={{ marginTop: 18 }}>Data sources</h3>
          <div className="detail-chips">
            {agent.dataTypes.map(d => (
              <span key={d} className="detail-chip">{DATA_LABELS[d] ?? d}</span>
            ))}
            {agent.tags.map(t => (
              <span key={t} className="detail-chip faint">#{t}</span>
            ))}
          </div>
        </div>

        <div className="detail-col">
          <h3 className="detail-section-title">Recent activity</h3>
          <ol className="detail-activity">
            {agent.activity.map((a, i) => (
              <li key={i} className={`activity-item activity-${a.kind}`}>
                <span className="activity-time">{a.ts}</span>
                <span className="activity-icon">{ACTIVITY_ICON[a.kind] ?? '•'}</span>
                <span className="activity-msg">{a.msg}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }) {
  return (
    <div className={`metric ${tone ? `metric-${tone}` : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  )
}
