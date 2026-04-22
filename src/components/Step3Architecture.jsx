import { useEffect, useState } from 'react'
import GeminiLogo from './GeminiLogo.jsx'

const LOADING_PHRASES = [
  'reading intent',
  'picking a runtime',
  'wiring tools',
  'seeding memory',
  'drafting the blueprint',
]

export const RUNTIMES = [
  {
    id: 'vertex-agent-engine',
    name: 'Vertex AI Agent Engine',
    tag: 'managed',
    tagline: 'Serverless agent runtime. Bring a framework, skip the plumbing.',
    traits: ['Fully managed', 'ADK · LangGraph · LlamaIndex', 'Built-in memory & tracing', 'Scales to zero'],
    bestFor: 'Fastest path to a production agent. Minimal ops, deep Vertex integration.',
  },
  {
    id: 'cloud-run',
    name: 'Cloud Run',
    tag: 'containers',
    tagline: 'Your agent in a container. Scale to zero. Full framework freedom.',
    traits: ['Any container', 'Scale 0 → N', 'Min-instance warm pool', 'WebSockets / SSE'],
    bestFor: 'Custom harnesses (LangGraph loops, orchestrators) where you want serverless containers.',
  },
  {
    id: 'gke',
    name: 'GKE Autopilot',
    tag: 'kubernetes',
    tagline: 'Full control. GPUs on demand. Multi-agent topologies.',
    traits: ['GPU node pools (L4 · A100)', 'Stateful workloads', 'Multi-agent orchestration', 'Workload Identity'],
    bestFor: 'Large multi-agent systems, fine-tuned local models, or long-running stateful agents.',
  },
]

function buildArchitecture(runtime, dataTypes) {
  const layers = [
    {
      label: 'MODELS',
      nodes: [
        'Gemini 2.5 Pro · reasoning',
        'Gemini 2.5 Flash · cheap paths',
        dataTypes.length > 0 && 'text-embedding-005',
      ].filter(Boolean),
    },
    {
      label: 'TOOLS',
      nodes: [
        dataTypes.includes('code')     && 'GitHub tool · repos, diffs',
        dataTypes.includes('docs')     && 'Docs tool · MD + wikis',
        dataTypes.includes('issues')   && 'Issues tool · GH/Jira',
        dataTypes.includes('chat')     && 'Slack tool · threads + DMs',
        dataTypes.includes('runtime')  && 'Cloud Logging tool',
        dataTypes.includes('feeds')    && 'Feed tool · RSS + CVE',
        dataTypes.includes('meetings') && 'Meet tool · transcripts',
        dataTypes.includes('team')     && 'People tool · ownership',
      ].filter(Boolean),
    },
    {
      label: 'MEMORY',
      nodes: [
        'Vertex AI Vector Search · semantic',
        'Cloud SQL (Postgres) · agent state',
        'Memorystore (Redis) · session cache',
        dataTypes.includes('chat') && 'Firestore · conversation log',
      ].filter(Boolean),
    },
    {
      label: 'INGEST',
      nodes: [
        'Cloud Scheduler · cron triggers',
        'Pub/Sub · event bus',
        dataTypes.includes('code')  && 'Cloud Build · post-commit index',
        dataTypes.includes('feeds') && 'Cloud Run Functions · feed poller',
        dataTypes.length > 2 && 'Dataflow · batch ETL',
      ].filter(Boolean),
    },
    {
      label: 'SECURITY',
      nodes: [
        'Secret Manager · API keys',
        'IAM · Workload Identity',
        'VPC-SC perimeter',
        runtime === 'gke' && 'Binary Authorization',
        'Model Armor · prompt firewall',
      ].filter(Boolean),
    },
    {
      label: 'OBSERVE',
      nodes: [
        'Cloud Logging · prompts + tool calls',
        'Cloud Trace · reasoning spans',
        'Vertex AI Experiments · eval',
        'Cloud Monitoring · SLOs',
      ].filter(Boolean),
    },
  ]
  return { layers, meta: { revisions: 0, generated: new Date().toISOString() } }
}

export default function Step3Architecture({
  intent, dataTypes, runtime, setRuntime,
  architecture, setArchitecture, onBack, onNext,
}) {
  const [loading, setLoading] = useState(!architecture)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [comments, setComments] = useState([])
  const [draft, setDraft] = useState('')
  const [refining, setRefining] = useState(false)

  useEffect(() => {
    if (!loading) return
    let i = 0
    const ti = setInterval(() => { i += 1; setPhraseIdx(i % LOADING_PHRASES.length) }, 700)
    const done = setTimeout(() => {
      setArchitecture(buildArchitecture(runtime, dataTypes))
      setLoading(false)
    }, 3000)
    return () => { clearInterval(ti); clearTimeout(done) }
  }, [loading, runtime, dataTypes, setArchitecture])

  const switchRuntime = (id) => {
    if (id === runtime || refining) return
    setRuntime(id)
    setRefining(true)
    setTimeout(() => {
      setArchitecture((prev) => {
        const next = buildArchitecture(id, dataTypes)
        return { ...next, meta: { ...next.meta, revisions: (prev?.meta?.revisions || 0) + 1 } }
      })
      setRefining(false)
    }, 900)
  }

  const submitComment = () => {
    if (!draft.trim() || refining) return
    const note = { text: draft.trim(), at: new Date() }
    setComments((c) => [note, ...c])
    setDraft('')
    setRefining(true)
    setTimeout(() => {
      setArchitecture((prev) => {
        if (!prev) return prev
        const t = note.text.toLowerCase()
        const L = prev.layers.map((x) => ({ ...x, nodes: [...x.nodes] }))
        const MODELS = 0, TOOLS = 1, MEMORY = 2, INGEST = 3, SECURITY = 4, OBSERVE = 5
        const add = (i, n) => { if (!L[i].nodes.includes(n)) L[i].nodes.push(n) }

        if (/(gpu|fine[- ]?tune|local model|llama|self[- ]?host)/.test(t)) {
          add(MODELS, 'Self-hosted Llama 3 · GPU')
          if (runtime !== 'gke') add(MODELS, '↳ hint: switch runtime to GKE for GPUs')
        }
        if (/(rag|retriev|vector|embedding|semantic search)/.test(t)) {
          add(MEMORY, 'Vertex AI RAG Engine · managed retrieval')
        }
        if (/(streaming|realtime|websocket|live)/.test(t)) {
          add(INGEST, 'Pub/Sub · streaming push')
          add(TOOLS, 'Realtime websocket tool')
        }
        if (/(cheap|cost|budget|flash only)/.test(t)) {
          L[MODELS].nodes = L[MODELS].nodes.filter((n) => !n.includes('2.5 Pro'))
          add(MODELS, 'Gemini 2.5 Flash · primary')
        }
        if (/(safety|guardrail|pii|redact)/.test(t)) {
          add(SECURITY, 'DLP API · PII redaction')
          add(SECURITY, 'Model Armor · strict mode')
        }
        if (/(eval|benchmark|test set|ragas)/.test(t)) {
          add(OBSERVE, 'Vertex AI Experiments · promptfoo')
        }
        if (/(multi[- ]?agent|orchestrator|planner)/.test(t)) {
          add(TOOLS, 'A2A protocol · agent-to-agent')
          add(TOOLS, 'Planner sub-agent')
        }
        if (/(memory|long[- ]?term)/.test(t)) {
          add(MEMORY, 'Firestore · long-term memory')
        }
        if (/(human[- ]?in[- ]?the[- ]?loop|approval|hitl)/.test(t)) {
          add(INGEST, 'Cloud Workflows · HITL gate')
        }
        if (/(mcp|model context)/.test(t)) {
          add(TOOLS, 'MCP server · external tools')
        }
        if (/(cache|rate[- ]?limit)/.test(t)) {
          add(MEMORY, 'Context Cache · Vertex AI')
        }

        return { ...prev, layers: L, meta: { ...prev.meta, revisions: (prev.meta.revisions || 0) + 1 } }
      })
      setRefining(false)
    }, 1400)
  }

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="loading-orb">
          <div className="loading-orb-spark"><GeminiLogo size={56} /></div>
        </div>
        <div className="loading-text">Composing your agent architecture</div>
        <div className="loading-sub">› {LOADING_PHRASES[phraseIdx]}…</div>
      </div>
    )
  }

  const activeRuntime = RUNTIMES.find(r => r.id === runtime) ?? RUNTIMES[0]

  return (
    <section className="page">
      <div className="page-head">
        <span className="eyebrow">Chapter 03 — The Blueprint</span>
        <h1 className="hero-title">Pick the <em>runtime</em>. Refine the stack.</h1>
        <p className="hero-sub">
          The agent runs on one of three GCP surfaces. Swap freely — the dependency stack rearranges.
          Leave notes on the right (<em>"add RAG"</em>, <em>"needs GPU"</em>, <em>"multi-agent"</em>) to evolve it.
        </p>
      </div>

      <div className="architecture-layout">
        <div className="arch-main">
          {/* Runtime tabs */}
          <div className="runtime-tabs">
            {RUNTIMES.map((r) => (
              <button
                key={r.id}
                className={`runtime-tab ${runtime === r.id ? 'active' : ''}`}
                onClick={() => switchRuntime(r.id)}
                disabled={refining}
              >
                <span className="runtime-tab-dot" />
                {r.name}
              </button>
            ))}
          </div>

          {/* Runtime showcase — the highlighted runtime card */}
          <div className="runtime-showcase">
            <div className="runtime-showcase-main">
              <div>
                <span className="runtime-name">{activeRuntime.name}</span>
                <span className="runtime-tag">{activeRuntime.tag}</span>
              </div>
              <div className="runtime-tagline">{activeRuntime.tagline}</div>
              <div className="runtime-fit">› {activeRuntime.bestFor}</div>
            </div>
            <div className="runtime-traits">
              {activeRuntime.traits.map((t) => (
                <span key={t} className="runtime-trait">{t}</span>
              ))}
            </div>
          </div>

          {/* Dependency stack */}
          <div className="stack-heading">— SUPPORTING STACK · GCP DEPENDENCIES —</div>
          <div className="arch-canvas" style={{ opacity: refining ? 0.4 : 1, transition: 'opacity 0.3s' }}>
            {architecture.layers.map((L) => (
              <div className="arch-layer" key={L.label}>
                <div className="arch-layer-label">{L.label}</div>
                <div className="arch-nodes">
                  {L.nodes.map((n, i) => (
                    <div className="arch-node" key={n + i} style={{ animationDelay: `${i * 40}ms` }}>{n}</div>
                  ))}
                </div>
              </div>
            ))}
            {refining && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div className="loading-sub">› re-composing…</div>
              </div>
            )}
          </div>
        </div>

        <aside className="comment-panel">
          <div className="comment-title"><GeminiLogo size={16} /> Leave a note</div>
          <div className="comment-desc">
            Plain language refinements. Each comment triggers a re-compose.
          </div>
          <textarea
            className="comment-box"
            placeholder="e.g. needs RAG with long-term memory…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={refining}
          />
          <button
            className="btn accent"
            style={{ alignSelf: 'flex-end' }}
            onClick={submitComment}
            disabled={!draft.trim() || refining}
          >
            {refining ? 'Refining…' : 'Apply refinement ↺'}
          </button>
          {comments.length > 0 && (
            <>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-faint)', fontFamily: "'Google Sans Code', monospace" }}>
                HISTORY ({comments.length})
              </div>
              <div className="comment-log">
                {comments.map((c, i) => (
                  <div className="comment-item" key={i}>
                    <time>{c.at.toLocaleTimeString()}</time>
                    {c.text}
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={onBack}>← Back</button>
        <button className="btn primary" onClick={onNext} disabled={refining}>
          Looks good — finalize<span className="btn-arrow">→</span>
        </button>
      </div>
    </section>
  )
}
