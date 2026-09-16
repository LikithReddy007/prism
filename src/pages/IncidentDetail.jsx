import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, BrainCircuit, GitBranch, Zap, CheckCircle2, ChevronRight, Server,
} from 'lucide-react';
import { useSimulation } from '../services/store';
import { IncidentStatusBadge, RiskBadge, ActionStatusBadge } from '../components/StatusBadge';
import MetricChart from '../components/MetricChart';
import RiskGauge from '../components/RiskGauge';
import { formatDateTime, formatDuration, formatPercent } from '../utils/formatters';
import { METRIC_META } from '../services/simulationEngine';

const STAGE_DEFS = [
  { key: 'predicted', label: 'ML Prediction', icon: BrainCircuit },
  { key: 'deciding', label: 'Decision Engine', icon: GitBranch },
  { key: 'recovering', label: 'Recovery Action (AWS Lambda)', icon: Zap },
  { key: 'resolved', label: 'Validation', icon: CheckCircle2 },
];

export default function IncidentDetail() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const {
    incidents, recoveryActions, auditLog, metricsHistory, resolveManually, acknowledgeIncident,
  } = useSimulation();

  const incident = incidents.find((i) => i.id === incidentId);

  if (!incident) {
    return (
      <div className="card empty-state">
        <span>Incident not found — it may have scrolled out of the session buffer.</span>
        <Link to="/incidents" className="btn btn-secondary btn-sm"><ArrowLeft size={14} /> Back to Incidents</Link>
      </div>
    );
  }

  const action = recoveryActions.find((a) => a.id === incident.recoveryActionId);
  const relatedAudit = auditLog.filter((a) => a.refId === incident.id).slice().reverse();
  const history = metricsHistory[incident.instanceId] || [];
  const canResolve = incident.status !== 'resolved' && incident.status !== 'failed';

  const metricLine = incident.metric
    ? [{ key: incident.metric, label: METRIC_META[incident.metric].label, color: '#ff9900', unit: METRIC_META[incident.metric].unit }]
    : [
      { key: 'cpu', label: 'CPU', color: '#ff9900', unit: '%' },
      { key: 'memory', label: 'Memory', color: '#3b82f6', unit: '%' },
    ];

  function describeStage(key) {
    const s = incident.stages[key];
    if (!s) return null;
    switch (key) {
      case 'predicted':
        return `${incident.failureType} predicted with ${formatPercent(s.confidence, 0)} confidence — risk score ${formatPercent(s.riskScore, 0)} (${s.riskTier} tier)`;
      case 'deciding':
        return `Selected playbook "${s.playbook}". ${s.reason}`;
      case 'recovering':
        return `AWS Lambda invoked action ${s.actionId} on ${incident.instanceName}`;
      case 'resolved':
        return s.outcome === 'success'
          ? `Post-recovery metrics validated as healthy${s.manual ? ' (manually resolved by operator)' : ''}`
          : 'Validation failed — issue persisted, escalated for manual review';
      default:
        return null;
    }
  }

  return (
    <div className="section-stack">
      <button type="button" className="btn btn-ghost btn-sm" style={{ width: 'fit-content' }} onClick={() => navigate('/incidents')}>
        <ArrowLeft size={14} /> Back to Incidents
      </button>

      <div className="page-header">
        <div>
          <div className="flex items-center gap-3" style={{ marginBottom: 6 }}>
            <h1 style={{ marginBottom: 0 }}>{incident.id}</h1>
            <IncidentStatusBadge status={incident.status} />
          </div>
          <p>{incident.failureType} on <strong style={{ color: 'var(--text-secondary)' }}>{incident.instanceName}</strong> — detected {formatDateTime(incident.createdAt)}</p>
        </div>
        {canResolve && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => acknowledgeIncident(incident.id)}>Acknowledge</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => resolveManually(incident.id)}>Resolve Now</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3">
        <div className="card" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' }}>
          <RiskGauge score={incident.riskScore} tier={incident.riskTier} size={130} />
          <RiskBadge tier={incident.riskTier} />
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h2>Incident Summary</h2>
          </div>
          <div className="kv-grid">
            <div>
              <div className="kv-label">Instance</div>
              <div className="kv-value flex items-center gap-2"><Server size={13} /> {incident.instanceName}</div>
            </div>
            <div>
              <div className="kv-label">Instance ID</div>
              <div className="kv-value mono" style={{ fontSize: '0.8rem' }}>{incident.instanceId}</div>
            </div>
            <div>
              <div className="kv-label">Predicted Issue</div>
              <div className="kv-value">{incident.failureType}</div>
            </div>
            <div>
              <div className="kv-label">Confidence</div>
              <div className="kv-value">{formatPercent(incident.confidence, 0)}</div>
            </div>
            <div>
              <div className="kv-label">Playbook</div>
              <div className="kv-value">{incident.playbook || 'Pending decision'}</div>
            </div>
            <div>
              <div className="kv-label">Outcome</div>
              <div className="kv-value">{incident.outcome ? <ActionStatusBadge status={incident.outcome} /> : 'In progress'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Pipeline Timeline</h2>
            <p className="text-muted">Prediction → Decision → Recovery → Validation</p>
          </div>
        </div>
        <div className="timeline">
          {STAGE_DEFS.map((stage, idx) => {
            const reached = !!incident.stages[stage.key];
            const Icon = stage.icon;
            const stageData = incident.stages[stage.key];
            return (
              <div className="timeline-item" key={stage.key}>
                <div className="timeline-marker-col">
                  <div className={`timeline-marker${reached ? ' is-done' : ''}`}>
                    <Icon size={15} />
                  </div>
                  {idx < STAGE_DEFS.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-body">
                  <div className="timeline-title">{stage.label === 'Validation' && incident.status === 'failed' ? 'Validation — Failed' : stage.label}</div>
                  <div className="timeline-time">{stageData ? formatDateTime(stageData.t) : 'Pending'}</div>
                  <div className="timeline-desc">{reached ? describeStage(stage.key) : 'Waiting for prior stage to complete...'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Instance Metrics</h2>
            <p className="text-muted">{incident.metric ? METRIC_META[incident.metric].label : 'CPU & Memory'} for {incident.instanceName} around the incident window</p>
          </div>
        </div>
        <MetricChart data={history} lines={metricLine} />
      </div>

      {action && (
        <div className="card">
          <div className="card-header">
            <h2>Recovery Action</h2>
          </div>
          <div className="kv-grid">
            <div>
              <div className="kv-label">Action</div>
              <div className="kv-value">{action.type}</div>
            </div>
            <div>
              <div className="kv-label">Status</div>
              <div className="kv-value"><ActionStatusBadge status={action.status} /></div>
            </div>
            <div>
              <div className="kv-label">Started</div>
              <div className="kv-value mono" style={{ fontSize: '0.8rem' }}>{formatDateTime(action.startedAt)}</div>
            </div>
            <div>
              <div className="kv-label">Duration</div>
              <div className="kv-value">{action.durationMs !== null ? formatDuration(action.durationMs) : 'In progress'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Related Audit Entries</h2>
        </div>
        {relatedAudit.length === 0 ? (
          <div className="empty-state"><span>No audit entries yet</span></div>
        ) : (
          <div className="section-stack" style={{ gap: 'var(--space-2)' }}>
            {relatedAudit.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3" style={{ fontSize: '0.83rem' }}>
                <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{entry.message}</span>
                <span className="text-muted mono" style={{ fontSize: '0.74rem' }}>{formatDateTime(entry.t)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
