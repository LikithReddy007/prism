import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { formatClock } from '../utils/formatters';
import { useSimulation } from '../services/store';

const TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Live infrastructure health overview' },
  '/incidents': { title: 'Incidents', subtitle: 'Predicted and in-progress failure events' },
  '/recovery-actions': { title: 'Recovery Actions', subtitle: 'Auto-healing execution history' },
  '/decision-engine': { title: 'Decision Engine', subtitle: 'Rules, thresholds and playbook selection' },
  '/model-metrics': { title: 'Model Metrics', subtitle: 'ML prediction performance' },
  '/resources': { title: 'Resources', subtitle: 'Monitored AWS EC2 instances' },
  '/audit-trail': { title: 'Audit Trail', subtitle: 'Immutable compliance event log' },
};

function matchTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/incidents/')) return { title: 'Incident Detail', subtitle: 'Full pipeline timeline' };
  return { title: 'PRISM', subtitle: '' };
}

export default function TopBar({ onMenuClick }) {
  const location = useLocation();
  const { instances } = useSimulation();
  const [clock, setClock] = useState(formatClock());

  useEffect(() => {
    const t = setInterval(() => setClock(formatClock()), 1000);
    return () => clearInterval(t);
  }, []);

  const { title, subtitle } = matchTitle(location.pathname);
  const degraded = instances.filter((i) => i.status === 'degraded').length;
  const atRisk = instances.filter((i) => i.status === 'at-risk').length;

  let statusLabel = 'All Systems Nominal';
  let statusClass = '';
  if (degraded > 0) {
    statusLabel = `${degraded} Instance${degraded > 1 ? 's' : ''} Degraded`;
    statusClass = 'danger';
  } else if (atRisk > 0) {
    statusLabel = `${atRisk} Instance${atRisk > 1 ? 's' : ''} At Risk`;
    statusClass = 'warning';
  }

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button type="button" className="icon-btn menu-btn" onClick={onMenuClick} aria-label="Toggle navigation">
          <Menu size={16} />
        </button>
        <div className="topbar-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="topbar-right">
        <span className="topbar-clock">{clock}</span>
        <span
          className="system-status-pill"
          style={statusClass ? {
            background: statusClass === 'danger' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
            color: statusClass === 'danger' ? 'var(--color-danger)' : 'var(--color-warning)',
            borderColor: statusClass === 'danger' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)',
          } : undefined}
        >
          <span className="pulse-dot" />
          {statusLabel}
        </span>
      </div>
    </header>
  );
}
