import { useNavigate } from 'react-router-dom';
import { Server, MapPin, Cpu } from 'lucide-react';
import { useSimulation } from '../services/store';
import { ResourceStatusBadge } from '../components/StatusBadge';
import { METRIC_META } from '../services/simulationEngine';

const METRIC_KEYS = ['cpu', 'memory', 'network', 'disk'];

function barColor(pct) {
  if (pct >= 82) return 'var(--color-danger)';
  if (pct >= 60) return 'var(--color-warning)';
  return 'var(--color-success)';
}

export default function Resources() {
  const { instances } = useSimulation();
  const navigate = useNavigate();

  return (
    <div className="section-stack">
      <div className="page-header">
        <div>
          <h1>Resources</h1>
          <p>AWS EC2 instances under continuous CloudWatch monitoring. Click an instance to see its incidents.</p>
        </div>
      </div>

      <div className="grid grid-cols-3">
        {instances.map((inst) => (
          <div
            key={inst.id}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/incidents?instance=${inst.id}`)}
          >
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="card-header-icon" style={{ background: 'var(--bg-inset)', color: 'var(--color-accent)' }}>
                  <Server size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.95rem' }}>{inst.name}</h2>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>{inst.id}</p>
                </div>
              </div>
              <ResourceStatusBadge status={inst.status} />
            </div>

            <div className="flex items-center gap-3" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              <span className="flex items-center gap-1"><Cpu size={12} /> {inst.type}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {inst.az}</span>
            </div>

            <div className="section-stack" style={{ gap: 'var(--space-3)' }}>
              {METRIC_KEYS.map((key) => {
                const value = inst.metrics[key];
                const meta = METRIC_META[key];
                const pct = key === 'network' ? (value / meta.max) * 100 : value;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between" style={{ fontSize: '0.76rem', marginBottom: 4 }}>
                      <span className="text-secondary">{meta.label}</span>
                      <span className="mono">{value.toFixed(key === 'network' ? 0 : 1)}{meta.unit}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: barColor(pct) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
