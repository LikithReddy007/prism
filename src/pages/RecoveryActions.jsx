import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useSimulation } from '../services/store';
import DataTable from '../components/DataTable';
import { ActionStatusBadge } from '../components/StatusBadge';
import { formatDateTime, formatDuration } from '../utils/formatters';

const STATUS_FILTERS = ['all', 'in-progress', 'success', 'failed'];

export default function RecoveryActions() {
  const { recoveryActions } = useSimulation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => recoveryActions.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.id.toLowerCase().includes(q) && !a.instanceName.toLowerCase().includes(q) && !a.type.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [recoveryActions, statusFilter, search]);

  const successCount = recoveryActions.filter((a) => a.status === 'success').length;
  const failedCount = recoveryActions.filter((a) => a.status === 'failed').length;
  const successRate = recoveryActions.length ? Math.round((successCount / (successCount + failedCount || 1)) * 100) : 0;

  const columns = [
    { key: 'id', label: 'Action ID', sortable: true, className: 'mono' },
    { key: 'type', label: 'Playbook', sortable: true },
    { key: 'instanceName', label: 'Target Instance', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <ActionStatusBadge status={r.status} /> },
    { key: 'startedAt', label: 'Started', sortable: true, className: 'text-muted mono', render: (r) => formatDateTime(r.startedAt) },
    { key: 'durationMs', label: 'Duration', sortable: true, render: (r) => (r.durationMs !== null ? formatDuration(r.durationMs) : <span className="text-muted">running…</span>) },
    {
      key: 'incidentId',
      label: 'Incident',
      render: (r) => (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ padding: '2px 8px' }}
          onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${r.incidentId}`); }}
        >
          {r.incidentId}
        </button>
      ),
    },
  ];

  return (
    <div className="section-stack">
      <div className="page-header">
        <div>
          <h1>Recovery Actions</h1>
          <p>Every automated healing action PRISM has executed via AWS Lambda, with outcomes and duration.</p>
        </div>
      </div>

      <div className="grid grid-cols-3">
        <div className="card stat-card">
          <span className="stat-card-label">Total Actions</span>
          <span className="stat-card-value">{recoveryActions.length}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-card-label">Success Rate</span>
          <span className="stat-card-value" style={{ color: 'var(--color-success)' }}>{successRate}%</span>
        </div>
        <div className="card stat-card">
          <span className="stat-card-label">Failed / Escalated</span>
          <span className="stat-card-value" style={{ color: failedCount ? 'var(--color-danger)' : 'inherit' }}>{failedCount}</span>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-input-wrap" style={{ minWidth: 240 }}>
            <Search size={15} />
            <input className="input" placeholder="Search by ID, instance or playbook..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
          </select>
          <span className="text-muted" style={{ fontSize: '0.78rem', marginLeft: 'auto' }}>{filtered.length} of {recoveryActions.length}</span>
        </div>
        <DataTable columns={columns} data={filtered} emptyMessage="No recovery actions yet" />
      </div>
    </div>
  );
}
