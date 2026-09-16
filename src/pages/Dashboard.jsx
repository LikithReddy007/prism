import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse, AlertTriangle, BrainCircuit, Wrench, Timer, GitBranch, Zap, CheckCircle2, User,
} from 'lucide-react';
import { useSimulation } from '../services/store';
import StatCard from '../components/StatCard';
import PipelineStrip from '../components/PipelineStrip';
import MetricChart from '../components/MetricChart';
import { IncidentStatusBadge } from '../components/StatusBadge';
import { formatDuration, formatRelativeTime } from '../utils/formatters';

const FEED_ICONS = {
  prediction: BrainCircuit,
  decision: GitBranch,
  action: Zap,
  validation: CheckCircle2,
  manual: User,
};

function buildFleetSeries(instances, metricsHistory) {
  const first = instances[0];
  if (!first) return [];
  const len = metricsHistory[first.id]?.length || 0;
  const series = [];
  for (let idx = 0; idx < len; idx += 1) {
    let t = null;
    let cpuSum = 0;
    let memSum = 0;
    let n = 0;
    instances.forEach((inst) => {
      const point = metricsHistory[inst.id]?.[idx];
      if (!point) return;
      t = point.t;
      cpuSum += point.cpu;
      memSum += point.memory;
      n += 1;
    });
    if (n > 0) series.push({ t, cpu: cpuSum / n, memory: memSum / n });
  }
  return series;
}

export default function Dashboard() {
  const {
    instances, metricsHistory, incidents, recoveryActions, auditLog,
  } = useSimulation();
  const navigate = useNavigate();

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'failed');
  const healthyCount = instances.filter((i) => i.status === 'healthy').length;
  const healthScore = Math.round((healthyCount / instances.length) * 100);
  const healedToday = recoveryActions.filter((a) => a.status === 'success').length;
  const completedActions = recoveryActions.filter((a) => a.durationMs !== null);
  const avgRecoveryMs = completedActions.length
    ? completedActions.reduce((sum, a) => sum + a.durationMs, 0) / completedActions.length
    : null;

  const fleetSeries = useMemo(() => buildFleetSeries(instances, metricsHistory), [instances, metricsHistory]);

  const feed = auditLog.filter((a) => a.type !== 'heartbeat').slice(0, 8);

  const recentIncidents = incidents.slice(0, 5);

  return (
    <div className="section-stack">
      <div className="grid grid-cols-5">
        <StatCard label="System Health" value={`${healthScore}%`} icon={HeartPulse} accent="var(--color-success)" accentBg="var(--color-success-bg)" />
        <StatCard label="Active Incidents" value={activeIncidents.length} icon={AlertTriangle} accent="var(--color-warning)" accentBg="var(--color-warning-bg)" />
        <StatCard label="Predictions (Session)" value={incidents.length} icon={BrainCircuit} accent="var(--color-info)" accentBg="var(--color-info-bg)" />
        <StatCard label="Auto-Healed" value={healedToday} icon={Wrench} accent="var(--color-accent)" accentBg="var(--color-accent-bg)" />
        <StatCard label="Avg Recovery Time" value={avgRecoveryMs ? formatDuration(avgRecoveryMs) : '—'} icon={Timer} accent="var(--color-indigo)" accentBg="var(--color-indigo-bg)" />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Pipeline Activity</h2>
            <p className="text-muted">Live status of the monitor → predict → decide → heal → validate flow</p>
          </div>
        </div>
        <PipelineStrip />
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Fleet Metrics</h2>
              <p className="text-muted">Average CPU &amp; memory across {instances.length} monitored instances</p>
            </div>
          </div>
          <MetricChart
            data={fleetSeries}
            lines={[
              { key: 'cpu', label: 'CPU', color: '#ff9900', unit: '%' },
              { key: 'memory', label: 'Memory', color: '#3b82f6', unit: '%' },
            ]}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2>Recent Activity</h2>
              <p className="text-muted">Latest predictions, decisions &amp; recoveries</p>
            </div>
          </div>
          {feed.length === 0 ? (
            <div className="empty-state"><span>No activity yet — monitoring in progress</span></div>
          ) : (
            <div className="section-stack" style={{ gap: 'var(--space-3)' }}>
              {feed.map((item) => {
                const Icon = FEED_ICONS[item.type] || AlertTriangle;
                return (
                  <div key={item.id} className="flex items-center gap-3" style={{ fontSize: '0.83rem' }}>
                    <div
                      className="card-header-icon"
                      style={{
                        width: 30,
                        height: 30,
                        flexShrink: 0,
                        background: `var(--color-${item.severity === 'danger' ? 'danger' : item.severity === 'warning' ? 'warning' : item.severity === 'success' ? 'success' : 'info'}-bg)`,
                        color: `var(--color-${item.severity === 'danger' ? 'danger' : item.severity === 'warning' ? 'warning' : item.severity === 'success' ? 'success' : 'info'})`,
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{item.message}</span>
                    <span className="text-muted mono" style={{ fontSize: '0.72rem', flexShrink: 0 }}>{formatRelativeTime(item.t)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Recent Incidents</h2>
            <p className="text-muted">Click a row to view the full prediction-to-recovery timeline</p>
          </div>
        </div>
        {recentIncidents.length === 0 ? (
          <div className="empty-state"><span>No incidents predicted yet</span></div>
        ) : (
          <div className="section-stack" style={{ gap: 'var(--space-2)' }}>
            {recentIncidents.map((inc) => (
              <div
                key={inc.id}
                className="flex items-center gap-3"
                style={{
                  padding: 'var(--space-3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                }}
                onClick={() => navigate(`/incidents/${inc.id}`)}
              >
                <span className="mono text-muted" style={{ fontSize: '0.78rem', width: 90 }}>{inc.id}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.85rem' }}>{inc.instanceName}</span>
                <span className="text-secondary" style={{ fontSize: '0.82rem', flex: 1 }}>{inc.failureType}</span>
                <IncidentStatusBadge status={inc.status} />
                <span className="text-muted mono" style={{ fontSize: '0.75rem', width: 70, textAlign: 'right' }}>{formatRelativeTime(inc.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
