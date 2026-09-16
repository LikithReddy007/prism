import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function StatCard({
  label, value, icon: Icon, accent = 'var(--color-primary)', accentBg = 'var(--color-primary-bg)', trend,
}) {
  return (
    <div className="card stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className="card-header-icon" style={{ background: accentBg, color: accent }}>
            <Icon size={17} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {trend && (
        <span className={`stat-card-trend trend-${trend.direction}`}>
          {trend.direction === 'up' && <ArrowUp size={13} />}
          {trend.direction === 'down' && <ArrowDown size={13} />}
          {trend.direction === 'flat' && <Minus size={13} />}
          {trend.label}
        </span>
      )}
    </div>
  );
}
