import { ShieldCheck, GitBranch, Gauge } from 'lucide-react';
import { useSimulation } from '../services/store';
import { CAUSE_PLAYBOOK, METRIC_META } from '../services/simulationEngine';
import { RiskBadge } from '../components/StatusBadge';
import { formatDateTime } from '../utils/formatters';

const RISK_TIERS = [
  { tier: 'low', range: '0% – 35%', desc: 'No automated action. Metrics logged for trend analysis; no playbook triggered.' },
  { tier: 'medium', range: '35% – 70%', desc: 'Soft intervention — targeted fix (reboot, config correction, rate-limit) applied automatically.' },
  { tier: 'high', range: '70% – 100%', desc: 'Aggressive recovery — auto-scale, full reboot, or deployment rollback triggered immediately.' },
];

const GUARDRAILS = [
  { title: 'One Active Action per Instance', desc: 'The Decision Engine will not queue a second recovery action on an instance that already has one in progress, preventing conflicting remediations.' },
  { title: 'Confidence Threshold', desc: 'Predictions below 70% ML confidence are logged but do not trigger automated recovery — they surface as low-priority signals for operators instead.' },
  { title: 'Validation Gate', desc: 'Every action is followed by a mandatory validation step. If post-recovery metrics don’t return to baseline, the incident is escalated for manual review rather than retried blindly.' },
  { title: 'Immutable Audit Trail', desc: 'Every rule evaluation, playbook selection, and action outcome is written to an append-only audit log for compliance review.' },
];

export default function DecisionEngine() {
  const { incidents } = useSimulation();
  const recentDecisions = incidents.filter((i) => i.stages.deciding).slice(0, 8);

  return (
    <div className="section-stack">
      <div className="page-header">
        <div>
          <h1>Decision Engine</h1>
          <p>How PRISM turns a risk score into a recovery playbook — the rules, thresholds and safety guardrails behind every automated action.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-icon" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>
            <Gauge size={17} />
          </div>
          <div>
            <h2>Risk Tiers</h2>
            <p className="text-muted">Computed from the ML Prediction stage's combined risk score</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Tier</th><th>Score Range</th><th>Behavior</th></tr>
            </thead>
            <tbody>
              {RISK_TIERS.map((t) => (
                <tr key={t.tier}>
                  <td><RiskBadge tier={t.tier} /></td>
                  <td className="mono">{t.range}</td>
                  <td className="text-secondary" style={{ whiteSpace: 'normal' }}>{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-icon" style={{ background: 'var(--color-accent-bg)', color: 'var(--color-accent)' }}>
            <GitBranch size={17} />
          </div>
          <div>
            <h2>Playbook Mapping</h2>
            <p className="text-muted">Which recovery action is selected for each predicted failure type</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Trigger Metric</th><th>Predicted Failure Type</th><th>Medium Risk Playbook</th><th>High Risk Playbook</th></tr>
            </thead>
            <tbody>
              {Object.entries(CAUSE_PLAYBOOK).map(([cause, meta]) => (
                <tr key={cause}>
                  <td className="text-secondary">{cause === 'deploy' ? 'Error rate (post-deploy)' : METRIC_META[cause].label}</td>
                  <td>{meta.failureType}</td>
                  <td>{meta.medium}</td>
                  <td>{meta.high}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
            <ShieldCheck size={17} />
          </div>
          <div>
            <h2>Safety Guardrails</h2>
            <p className="text-muted">Constraints that keep automated recovery predictable and auditable</p>
          </div>
        </div>
        <div className="grid grid-cols-2">
          {GUARDRAILS.map((g) => (
            <div key={g.title} style={{ padding: 'var(--space-4)', background: 'var(--bg-inset)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: 6, fontSize: '0.9rem' }}>{g.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{g.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Recent Decisions</h2>
          <p className="text-muted">Live playbook selections made this session</p>
        </div>
        {recentDecisions.length === 0 ? (
          <div className="empty-state"><span>No decisions made yet</span></div>
        ) : (
          <div className="section-stack" style={{ gap: 'var(--space-2)' }}>
            {recentDecisions.map((inc) => (
              <div key={inc.id} className="flex items-center gap-3" style={{ padding: 'var(--space-3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <RiskBadge tier={inc.riskTier} />
                <span style={{ flex: 1, fontSize: '0.85rem' }}>
                  <strong>{inc.instanceName}</strong> — {inc.stages.deciding.playbook}
                </span>
                <span className="text-muted mono" style={{ fontSize: '0.74rem' }}>{formatDateTime(inc.stages.deciding.t)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
