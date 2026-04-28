import { useMemo } from 'react'
import { RUNTIMES } from './Step3Architecture.jsx'

// Curated, RAG-on-GCP–flavored security/privacy/hardening findings.
// Sources cite cloud.google.com/architecture and Enterprise Foundations Blueprint —
// the same corpus the rag_gcp_audit advisor retrieves over.

const SOURCES = {
  ent_foundations: { title: 'Enterprise Foundations Blueprint', tag: 'cloud.google.com · Architecture Center', url: 'https://cloud.google.com/architecture/security-foundations' },
  framework_security: { title: 'Architecture Framework — Security', tag: 'cloud.google.com · Framework', url: 'https://cloud.google.com/architecture/framework/security' },
  vpc_sc_vertex: { title: 'VPC Service Controls for Vertex AI', tag: 'cloud.google.com · Vertex AI', url: 'https://cloud.google.com/vertex-ai/docs/general/vpc-sc' },
  saif: { title: 'Secure AI Framework (SAIF)', tag: 'safety.google · SAIF', url: 'https://safety.google/cybersecurity-advancements/saif/' },
  genai_blueprint: { title: 'Generative AI MLOps Blueprint', tag: 'cloud.google.com · Architecture', url: 'https://cloud.google.com/architecture/genai-mlops-blueprint' },
  iam_best: { title: 'IAM best practices', tag: 'cloud.google.com · IAM', url: 'https://cloud.google.com/iam/docs/using-iam-securely' },
  secret_mgr: { title: 'Secret Manager best practices', tag: 'cloud.google.com · Secret Manager', url: 'https://cloud.google.com/secret-manager/docs/best-practices' },
  cloud_armor: { title: 'Cloud Armor security policies', tag: 'cloud.google.com · Cloud Armor', url: 'https://cloud.google.com/armor/docs/security-policy-overview' },
  iap: { title: 'Identity-Aware Proxy', tag: 'cloud.google.com · IAP', url: 'https://cloud.google.com/iap/docs/concepts-overview' },
  cmek: { title: 'Customer-managed encryption keys (CMEK)', tag: 'cloud.google.com · KMS', url: 'https://cloud.google.com/kms/docs/cmek' },
  audit_logs: { title: 'Cloud Audit Logs — Data Access', tag: 'cloud.google.com · Logging', url: 'https://cloud.google.com/logging/docs/audit/configure-data-access' },
  dlp: { title: 'Sensitive Data Protection (DLP)', tag: 'cloud.google.com · DLP', url: 'https://cloud.google.com/sensitive-data-protection/docs' },
  model_armor: { title: 'Model Armor', tag: 'cloud.google.com · Model Armor', url: 'https://cloud.google.com/security-command-center/docs/model-armor-overview' },
  workload_identity: { title: 'Workload Identity Federation', tag: 'cloud.google.com · GKE / IAM', url: 'https://cloud.google.com/kubernetes-engine/docs/concepts/workload-identity' },
  binary_auth: { title: 'Binary Authorization', tag: 'cloud.google.com · Binary Auth', url: 'https://cloud.google.com/binary-authorization/docs' },
  org_policy: { title: 'Organization Policy constraints', tag: 'cloud.google.com · Org Policy', url: 'https://cloud.google.com/resource-manager/docs/organization-policy/overview' },
}

function buildFindings({ runtime, dataTypes }) {
  const has = (k) => dataTypes.includes(k)
  const isGke = runtime === 'gke'
  const isCloudRun = runtime === 'cloud-run'

  const f = []

  // ── Critical — fundamentals you cannot ship without ─────────────
  f.push({
    id: 'vpcsc',
    domain: 'security',
    severity: 'critical',
    title: 'Wrap Vertex AI + your vector store in a VPC Service Controls perimeter',
    recommendation: 'Define a VPC-SC perimeter that includes Vertex AI, Cloud Storage, BigQuery, and Memorystore. Restrict ingress and egress so the agent\'s embeddings, RAG corpus, and tool calls cannot exfiltrate to a personal project or arbitrary URL.',
    rationale: 'A RAG agent reads private docs and writes embeddings — the worst-case leak is data egress through an over-permissive service account. VPC-SC is the only control that catches this regardless of IAM mistakes.',
    sources: [SOURCES.vpc_sc_vertex, SOURCES.ent_foundations],
  })

  f.push({
    id: 'iam-lp',
    domain: 'security',
    severity: 'critical',
    title: 'Replace the default service account with one per agent role',
    recommendation: 'Create dedicated service accounts for: (1) the agent runtime, (2) the ingestion pipeline, (3) the eval harness. Grant only the roles each one needs — `roles/aiplatform.user`, `roles/secretmanager.secretAccessor`, etc. Never use the default Compute SA.',
    rationale: 'Default SAs come pre-bound to `roles/editor` at the project level. Anything that compromises the agent runtime inherits write access to your entire project — including the RAG corpus.',
    sources: [SOURCES.iam_best, SOURCES.ent_foundations],
  })

  f.push({
    id: 'secrets',
    domain: 'security',
    severity: 'critical',
    title: 'Move all credentials into Secret Manager — no env vars',
    recommendation: 'Store API keys, OAuth client secrets, and DB passwords in Secret Manager. Mount them at runtime with the agent SA\'s `secretAccessor` binding. Rotate on a schedule with Cloud Scheduler + a Cloud Function.',
    rationale: 'Env vars on Cloud Run revisions and GKE manifests are visible to anyone with view access on the deployment. Secret Manager is access-controlled per-secret and emits an audit log on every read.',
    sources: [SOURCES.secret_mgr, SOURCES.framework_security],
  })

  if (isCloudRun || isGke) {
    f.push({
      id: 'ingress',
      domain: 'networking',
      severity: 'critical',
      title: 'Put the agent endpoint behind Cloud Armor + IAP',
      recommendation: `Front the ${isGke ? 'GKE Gateway' : 'Cloud Run service'} with a Global External HTTPS Load Balancer. Attach a Cloud Armor policy with a baseline OWASP rule set and rate-limiting. Require Identity-Aware Proxy for any human-facing endpoint.`,
      rationale: 'A public agent endpoint with `--allow-unauthenticated` is the canonical first finding — it lets prompt-injection probes hit your model directly and bypasses every IAM control downstream.',
      sources: [SOURCES.cloud_armor, SOURCES.iap],
    })
  }

  // ── Warning — important best-practice gaps ──────────────────────
  f.push({
    id: 'cmek',
    domain: 'data',
    severity: 'warning',
    title: 'Encrypt the RAG corpus and vector index with CMEK',
    recommendation: 'Create a Cloud KMS key ring with a 90-day rotation. Configure CMEK on the GCS bucket holding source documents, on Vertex AI Vector Search, and on any BigQuery dataset used for retrieval analytics.',
    rationale: 'Default Google-managed encryption is fine for stateless code, but a RAG corpus contains your private knowledge. CMEK gives you the cryptographic kill-switch and the residency story compliance reviewers will ask for.',
    sources: [SOURCES.cmek, SOURCES.genai_blueprint],
  })

  f.push({
    id: 'pii',
    domain: 'privacy',
    severity: 'warning',
    title: 'Run prompts and outputs through DLP + Model Armor',
    recommendation: 'Insert Sensitive Data Protection (DLP) inspection on the ingestion pipeline before embeddings are written, and gate inference with Model Armor for prompt-injection / PII leak detection on outputs.',
    rationale: 'Without redaction, PII from your source docs becomes embedded in the vector store and can resurface in any retrieved chunk. Model Armor is the runtime backstop for jailbreak and PII-in-output cases.',
    sources: [SOURCES.dlp, SOURCES.model_armor, SOURCES.saif],
  })

  f.push({
    id: 'audit',
    domain: 'observability',
    severity: 'warning',
    title: 'Turn on Data Access audit logs for Vertex AI and Secret Manager',
    recommendation: 'Enable `DATA_READ` and `DATA_WRITE` audit logs for `aiplatform.googleapis.com` and `secretmanager.googleapis.com`. Sink them to a dedicated, write-once log bucket retained for 400 days.',
    rationale: 'Default Cloud Logging gives you Admin Activity logs only. To answer "what did the agent retrieve and when?" — a question regulators will ask — you need Data Access logs explicitly enabled.',
    sources: [SOURCES.audit_logs, SOURCES.framework_security],
  })

  if (isGke) {
    f.push({
      id: 'wid',
      domain: 'security',
      severity: 'warning',
      title: 'Bind Kubernetes service accounts via Workload Identity',
      recommendation: 'Disable node-level service-account auth on the cluster. Map each Kubernetes SA to a Google SA via Workload Identity Federation. The pod inherits the Google SA — never a node-wide one.',
      rationale: 'On GKE, node-level credentials are the most common privilege-escalation path: any pod on the node inherits the same Google SA. WIF gives pod-level isolation that matches your IAM model.',
      sources: [SOURCES.workload_identity, SOURCES.ent_foundations],
    })
    f.push({
      id: 'binauth',
      domain: 'security',
      severity: 'warning',
      title: 'Require Binary Authorization on the agent\'s container images',
      recommendation: 'Set up an attestor that signs images built by Cloud Build. Configure Binary Authorization on the cluster to deny any pod whose image was not signed by your attestor.',
      rationale: 'Without Binary Auth, anyone with `roles/container.developer` can push an image with embedded secrets or a backdoor. The attestor chain ties deploys to your CI provenance.',
      sources: [SOURCES.binary_auth],
    })
  }

  if (has('chat') || has('issues') || has('docs')) {
    f.push({
      id: 'ingest-acl',
      domain: 'privacy',
      severity: 'warning',
      title: 'Carry source ACLs into the vector store as chunk metadata',
      recommendation: 'For each retrieved document, store its source ACL (channel members, repo access list, doc viewers) as metadata on the embedding. Filter retrieval by the asking user\'s identity before passing chunks to the LLM.',
      rationale: 'A RAG agent that ignores source ACLs is the fastest way to leak private Slack threads or restricted issues to a user who couldn\'t see them in the original tool. The advisor flags this as a "permission inversion."',
      sources: [SOURCES.saif, SOURCES.genai_blueprint],
    })
  }

  // ── Info — optional improvements ────────────────────────────────
  f.push({
    id: 'orgpolicy',
    domain: 'security',
    severity: 'info',
    title: 'Apply Org Policy constraints at the folder level',
    recommendation: 'Set `compute.requireShieldedVm`, `iam.disableServiceAccountKeyCreation`, and `compute.vmExternalIpAccess` to deny. Apply at the folder so every project this agent ships into inherits them.',
    rationale: 'Org Policy is a belt-and-suspenders layer — even if a future engineer\'s Terraform tries to provision an external IP or a Compute SA key, the API rejects it.',
    sources: [SOURCES.org_policy, SOURCES.ent_foundations],
  })

  f.push({
    id: 'eval',
    domain: 'observability',
    severity: 'info',
    title: 'Wire eval traces into Vertex AI Experiments',
    recommendation: 'Export eval-harness runs (golden set + adversarial set) to Vertex AI Experiments. Gate promotion of a new model version on a regression-free pass.',
    rationale: 'Without an eval gate, a Gemini model upgrade can silently regress factuality or safety. Experiments is the lightest-weight way to keep the bar visible to the team.',
    sources: [SOURCES.genai_blueprint, SOURCES.saif],
  })

  return f
}

const DOMAIN_ORDER = ['security', 'privacy', 'networking', 'data', 'observability']
const DOMAIN_LABEL = {
  security: 'Security & IAM',
  privacy: 'Privacy & Data Protection',
  networking: 'Networking & Edge',
  data: 'Data at Rest',
  observability: 'Audit & Observability',
}

const SEVERITY_LABEL = { critical: 'Critical', warning: 'Warning', info: 'Info' }

export default function Step4Review({ intent, dataTypes, runtime, architecture, setCompliant, onBack, onNext }) {
  const rt = RUNTIMES.find(r => r.id === runtime) ?? RUNTIMES[0]

  const findings = useMemo(
    () => buildFindings({ runtime, dataTypes }),
    [runtime, dataTypes],
  )

  const counts = findings.reduce(
    (acc, f) => ((acc[f.severity] = (acc[f.severity] ?? 0) + 1), acc),
    {},
  )

  const grouped = DOMAIN_ORDER
    .map(d => [d, findings.filter(f => f.domain === d)])
    .filter(([, list]) => list.length > 0)

  const choose = (compliant) => {
    setCompliant(compliant)
    onNext()
  }

  return (
    <section className="page review-page">
      <div className="page-head">
        <span className="eyebrow">Chapter 04 — The Hardening Review</span>
        <h1 className="hero-title">Before you ship — <em>a security & privacy review.</em></h1>
        <p className="hero-sub">
          A retrieval-augmented review of your blueprint against the GCP Enterprise Foundations Blueprint, the
          Architecture Framework Security pillar, and Google's Secure AI Framework. Each finding cites where it came from.
        </p>
      </div>

      <div className="review-meta">
        <div className="review-meta-item">
          <span className="meta-dim">RUNTIME</span>
          <span className="meta-val">{rt.name}</span>
        </div>
        <div className="review-meta-item">
          <span className="meta-dim">DATA SOURCES</span>
          <span className="meta-val">{dataTypes.length || '—'}</span>
        </div>
        <div className="review-meta-item">
          <span className="meta-dim">FINDINGS</span>
          <span className="meta-val">{findings.length}</span>
        </div>
        <div className="severity-strip">
          {['critical', 'warning', 'info'].map(s => (
            <span key={s} className={`severity-count sev-${s}`}>
              <span className="severity-dot" />
              <strong>{counts[s] ?? 0}</strong>
              <span className="sev-label">{SEVERITY_LABEL[s]}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="review-scroll">
        {grouped.map(([domain, list]) => (
          <div className="review-domain" key={domain}>
            <h3 className="review-domain-title">
              <span className="review-domain-glyph">✦</span>
              {DOMAIN_LABEL[domain] ?? domain}
              <span className="review-domain-count">{list.length}</span>
            </h3>
            <div className="review-findings">
              {list.map(f => (
                <article key={f.id} className={`finding-card sev-${f.severity}`}>
                  <header className="finding-card-head">
                    <span className={`severity-pill sev-${f.severity}`}>{SEVERITY_LABEL[f.severity]}</span>
                    <h4 className="finding-card-title">{f.title}</h4>
                  </header>
                  <div className="finding-card-body">
                    <div className="finding-block">
                      <span className="finding-label">Recommendation</span>
                      <p>{f.recommendation}</p>
                    </div>
                    <div className="finding-block">
                      <span className="finding-label">Why it matters</span>
                      <p className="finding-rationale">{f.rationale}</p>
                    </div>
                  </div>
                  <footer className="finding-sources">
                    <span className="finding-label">Sources</span>
                    <div className="finding-source-chips">
                      {f.sources.map(s => (
                        <a
                          key={s.url}
                          className="finding-source"
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="finding-source-title">{s.title}</span>
                          <span className="finding-source-tag">{s.tag}</span>
                          <span className="finding-source-arrow">↗</span>
                        </a>
                      ))}
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="review-cta">
        <button className="cta-card cta-primary" onClick={() => choose(true)}>
          <div className="cta-card-glyph">✦</div>
          <div className="cta-card-body">
            <div className="cta-card-eyebrow">Recommended</div>
            <div className="cta-card-title">Yes, help me make it compliant.</div>
            <div className="cta-card-desc">
              Apply every recommendation above. Step 5 will deploy the hardened blueprint —
              VPC-SC perimeter, Cloud Armor, CMEK, audit logs, the lot.
            </div>
          </div>
          <span className="cta-card-arrow">→</span>
        </button>

        <button className="cta-card cta-ghost" onClick={() => choose(false)}>
          <div className="cta-card-glyph">∿</div>
          <div className="cta-card-body">
            <div className="cta-card-eyebrow">For now</div>
            <div className="cta-card-title">I live in nature.</div>
            <div className="cta-card-desc">
              Skip the hardening. Ship the experimental blueprint and come back to this review
              once the agent earns its keep.
            </div>
          </div>
          <span className="cta-card-arrow">→</span>
        </button>
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={onBack}>← Keep refining</button>
        <span className="step-index">04 / 05 · review</span>
      </div>
    </section>
  )
}
