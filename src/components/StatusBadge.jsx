import { toTitleCase } from '../utils/formatters';

const INCIDENT_STATUS_MAP = {
  predicted: { variant: 'info', label: 'Predicted' },
  deciding: { variant: 'indigo', label: 'Deciding' },
  recovering: { variant: 'warning', label: 'Recovering' },
  validating: { variant: 'warning', label: 'Validating' },
  resolved: { variant: 'success', label: 'Resolved' },
  failed: { variant: 'danger', label: 'Failed' },
};

const RISK_MAP = {
  low: { variant: 'success', label: 'Low' },
  medium: { variant: 'warning', label: 'Medium' },
  high: { variant: 'danger', label: 'High' },
};

const RESOURCE_STATUS_MAP = {
  healthy: { variant: 'success', label: 'Healthy' },
  'at-risk': { variant: 'warning', label: 'At Risk' },
  degraded: { variant: 'danger', label: 'Degraded' },
};

const ACTION_STATUS_MAP = {
  'in-progress': { variant: 'warning', label: 'In Progress' },
  success: { variant: 'success', label: 'Success' },
  failed: { variant: 'danger', label: 'Failed' },
};

function badgeFrom(map, key, fallbackVariant = 'neutral') {
  const entry = map[key] || { variant: fallbackVariant, label: toTitleCase(key || 'unknown') };
  return entry;
}

export function IncidentStatusBadge({ status }) {
  const { variant, label } = badgeFrom(INCIDENT_STATUS_MAP, status);
  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}

export function RiskBadge({ tier }) {
  const { variant, label } = badgeFrom(RISK_MAP, tier);
  return <span className={`badge badge-${variant}`}>{label}</span>;
}

export function ResourceStatusBadge({ status }) {
  const { variant, label } = badgeFrom(RESOURCE_STATUS_MAP, status);
  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}

export function ActionStatusBadge({ status }) {
  const { variant, label } = badgeFrom(ACTION_STATUS_MAP, status);
  return <span className={`badge badge-${variant}`}>{label}</span>;
}
