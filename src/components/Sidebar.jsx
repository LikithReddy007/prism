import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, Wrench, GitBranch, BarChart3, Server, ScrollText, Activity,
} from 'lucide-react';
import { useSimulation } from '../services/store';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle, countKey: 'activeIncidents' },
  { to: '/recovery-actions', label: 'Recovery Actions', icon: Wrench },
  { to: '/decision-engine', label: 'Decision Engine', icon: GitBranch },
  { to: '/model-metrics', label: 'Model Metrics', icon: BarChart3 },
  { to: '/resources', label: 'Resources', icon: Server },
  { to: '/audit-trail', label: 'Audit Trail', icon: ScrollText },
];

export default function Sidebar({ open, onClose }) {
  const { incidents } = useSimulation();
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'failed').length;
  const counts = { activeIncidents };

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <Activity size={20} />
        </div>
        <div className="sidebar-brand-text">
          <h1>PRISM</h1>
          <span>Predictive Auto-Healing</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Operations</div>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, countKey }) => {
          const count = countKey ? counts[countKey] : null;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
              {!!count && <span className="nav-item-badge">{count}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        PRISM v1.0 — Team 55<br />
        AWS EC2 · CloudWatch · Lambda
      </div>
    </aside>
  );
}
