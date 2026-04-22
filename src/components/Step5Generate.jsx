import { useEffect, useRef, useState } from 'react'
import { RUNTIMES } from './Step3Architecture.jsx'
import GeminiLogo from './GeminiLogo.jsx'

function buildSteps(runtime, dataTypes) {
  const runtimeDeploy = {
    'vertex-agent-engine': {
      label: 'Deploying agent to Vertex AI Agent Engine',
      logs: [
        '> packaging agent (ADK) · requirements.txt',
        '> gcloud ai reasoning-engines create agent-svc',
        '> binding session store · memory enabled',
        '> wiring tools into function-calling schema',
        '✓ agent reasoning engine · live',
      ],
    },
    'cloud-run': {
      label: 'Deploying agent container to Cloud Run',
      logs: [
        '> docker build -t agent-runtime:v1 .',
        '> pushing → us-central1-docker.pkg.dev/…/agent-runtime',
        '> gcloud run deploy agent-svc · min-instances 1 · concurrency 20',
        '> attaching VPC connector · Memorystore reachable',
        '✓ cloud run revision agent-svc-00001 · serving',
      ],
    },
    'gke': {
      label: 'Deploying agent pods to GKE Autopilot',
      logs: [
        '> gcloud container clusters create-auto agent-pool · us-central1',
        '> enabling GPU node pool · L4 × 2',
        '> kubectl apply -f agent-deployment.yaml',
        '> binding Workload Identity · agent-svc@',
        '✓ 3/3 pods Running · HPA 1→8',
      ],
    },
  }

  const base = [
    {
      key: 'project',
      label: 'Bootstrapping GCP project',
      logs: [
        '> gcloud projects create gcp-agent-demo',
        '> linking billing account',
        '> enabling APIs: aiplatform, secretmanager, run, pubsub, scheduler',
        '✓ project ready · region us-central1',
      ],
    },
    {
      key: 'iam',
      label: 'Provisioning IAM & service accounts',
      logs: [
        '> creating sa: agent-svc@…',
        '> roles/aiplatform.user · roles/secretmanager.secretAccessor',
        '> Workload Identity federation configured',
        '✓ permissions scoped & bound',
      ],
    },
    {
      key: 'secrets',
      label: 'Loading Secret Manager keys',
      logs: [
        dataTypes.includes('code')   && '> secret: github-pat',
        dataTypes.includes('chat')   && '> secret: slack-bot-token',
        dataTypes.includes('issues') && '> secret: jira-api-token',
        '> rotation policies · 90d',
        '✓ secrets sealed',
      ].filter(Boolean),
    },
    {
      key: 'ingest',
      label: 'Wiring data ingestion',
      logs: [
        '> Cloud Scheduler · @every 15m',
        '> Pub/Sub topic: agent-events',
        dataTypes.includes('code')  && '> Cloud Build trigger · post-commit → indexer',
        dataTypes.includes('feeds') && '> Cloud Run Function · feed-poller',
        dataTypes.length > 2        && '> Dataflow template · batch ETL → GCS',
        '✓ ingestion pipeline live',
      ].filter(Boolean),
    },
    {
      key: 'memory',
      label: 'Building memory stores',
      logs: [
        '> Cloud SQL Postgres · db-custom-2-8192',
        '> Memorystore Redis · 1GB · HA',
        dataTypes.includes('chat') && '> Firestore (native) · conversations',
        '> Vertex AI Vector Search · index dim=768 · brute-force',
        '> embedding backfill · text-embedding-005',
        '✓ agent memory ready',
      ].filter(Boolean),
    },
    {
      key: 'models',
      label: 'Pinning models & tool schema',
      logs: [
        '> Gemini 2.5 Pro · reasoning · temp 0.2',
        '> Gemini 2.5 Flash · cheap paths · temp 0.4',
        '> function-calling schema compiled',
        '> Model Armor policy · prompt firewall',
        '✓ models wired',
      ],
    },
    {
      key: 'runtime',
      label: runtimeDeploy[runtime].label,
      logs: runtimeDeploy[runtime].logs,
    },
    {
      key: 'eval',
      label: 'Seeding eval harness',
      logs: [
        '> Vertex AI Experiments · promptfoo 12 cases',
        '> baseline trace captured',
        '> SLO: p95 reasoning < 4.5s · eval pass > 85%',
        '✓ eval harness in place',
      ],
    },
    {
      key: 'observ',
      label: 'Enabling observability & SLOs',
      logs: [
        '> Cloud Logging · prompts, tool calls, verdicts',
        '> Cloud Trace · reasoning spans',
        '> alert: tool-call error rate > 2%',
        '✓ observability online',
      ],
    },
    {
      key: 'polish',
      label: 'Exporting Terraform & finalizing',
      logs: [
        '> terraform plan · clean',
        '> writing main.tf, variables.tf, outputs.tf',
        '> committing to Cloud Source Repositories',
        '✓ agent ready to run',
      ],
    },
  ]

  return base
}

export default function Step5Generate({ intent, dataTypes, runtime, architecture }) {
  const BUILD_STEPS = buildSteps(runtime, dataTypes)
  const rt = RUNTIMES.find(r => r.id === runtime) ?? RUNTIMES[0]

  const [activeIdx, setActiveIdx] = useState(0)
  const [complete, setComplete] = useState(false)
  const [logs, setLogs] = useState([])
  const consoleRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let i = 0

    const runStep = () => {
      if (cancelled) return
      if (i >= BUILD_STEPS.length) { setComplete(true); return }
      const step = BUILD_STEPS[i]
      setActiveIdx(i)
      let j = 0
      const emit = () => {
        if (cancelled) return
        if (j >= step.logs.length) {
          i += 1
          setTimeout(runStep, 260)
          return
        }
        const line = step.logs[j]
        setLogs((prev) => [...prev, { t: new Date(), text: line, kind: line.startsWith('✓') ? 'ok' : line.startsWith('!') ? 'warn' : 'info' }])
        j += 1
        setTimeout(emit, 220 + Math.random() * 200)
      }
      emit()
    }

    runStep()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight
  }, [logs])

  return (
    <section className="page" style={{ position: 'relative' }}>
      <div className="page-head">
        <span className="eyebrow">Chapter 05 — The Becoming</span>
        <h1 className="hero-title">
          {complete ? (<>Your <em>agent</em> is alive.</>) : (<>Deploying your <em>agent</em>…</>)}
        </h1>
        <p className="hero-sub">
          {complete
            ? `Running on ${rt.name}. Every tool is wired, every secret sealed, every prompt traced.`
            : `Watch it unfold step by step on Google Cloud. Runtime: ${rt.name}.`}
        </p>
      </div>

      <div className="generate-layout">
        <div className="gen-steps">
          {BUILD_STEPS.map((s, i) => {
            const state = complete ? 'done' : i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending'
            return (
              <div key={s.key} className={`gen-step ${state}`}>
                <div className="gen-step-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="gen-step-label">{s.label}</div>
                <div className="gen-step-status">
                  {state === 'done' ? '✓ DONE' : state === 'active' ? 'RUNNING…' : 'QUEUED'}
                </div>
              </div>
            )
          })}
        </div>

        <div className="gen-console" ref={consoleRef}>
          <div style={{ color: '#9a938a', marginBottom: 12 }}>
            {'// agent-studio · gcp deploy trace'}<br />
            {'// project: gcp-agent-demo · region: us-central1'}<br />
            {'// runtime: ' + rt.name}<br />
            {'// intent: ' + ((intent || '—').slice(0, 70)) + (intent && intent.length > 70 ? '…' : '')}<br />
            {'// tools: ' + (dataTypes.join(', ') || 'none')}
          </div>
          {logs.map((l, i) => (
            <div key={i}>
              <span className="log-time">{l.t.toISOString().slice(11, 19)}</span>
              {' '}
              <span className={l.kind === 'ok' ? 'log-ok' : l.kind === 'warn' ? 'log-warn' : ''}>
                {l.text}
              </span>
            </div>
          ))}
          {!complete && <span className="gen-console-cursor" />}
        </div>
      </div>

      {complete && (
        <div className="gen-complete">
          <div className="gen-complete-spark"><GeminiLogo size={44} spin /></div>
          <h2>awake.</h2>
          <p>
            {architecture?.layers.length ?? 0} layers · {architecture?.layers.reduce((a, L) => a + L.nodes.length, 0) ?? 0} nodes · {dataTypes.length} tools — running on <strong>{rt.name}</strong>.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn primary">Open agent console ↗</button>
            <button className="btn accent" onClick={() => window.location.reload()}>Start over ↺</button>
          </div>
        </div>
      )}
    </section>
  )
}
