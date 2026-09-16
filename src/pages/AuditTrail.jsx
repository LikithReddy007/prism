import { useMemo, useState } from 'react';
import { Search, Download, ScrollText } from 'lucide-react';
import { useSimulation } from '../services/store';
import DataTable from '../components/DataTable';
import { formatDateTime, downloadCsv, toTitleCase } from '../utils/formatters';

const TYPE_FILTERS = ['all', 'prediction', 'decision', 'action', 'validation', 'manual', 'heartbeat'];

const SEVERITY_VARIANT = {
  info: 'info', warning: 'warning', danger: 'danger', success: 'success',
};

export default function AuditTrail() {
  const { auditLog } = useSimulation();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => auditLog.filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (search && !a.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [auditLog, typeFilter, search]);

  const columns = [
    { key: 'id', label: 'Event ID', className: 'mono', sortable: true },
    {
      key: 'type', label: 'Type', sortable: true, render: (r) => (
        <span className={`badge badge-${SEVERITY_VARIANT[r.severity] || 'neutral'}`}>{toTitleCase(r.type)}</span>
      ),
    },
    { key: 'message', label: 'Event', className: 'text-secondary', render: (r) => <span style={{ whiteSpace: 'normal' }}>{r.message}</span> },
    { key: 'refId', label: 'Reference', className: 'mono text-muted', render: (r) => r.refId || '—' },
    { key: 't', label: 'Timestamp', sortable: true, className: 'text-muted mono', render: (r) => formatDateTime(r.t) },
  ];

  function handleExport() {
    downloadCsv('prism-audit-trail.csv', filtered.map((a) => ({
      id: a.id, type: a.type, severity: a.severity, message: a.message, refId: a.refId || '', timestamp: new Date(a.t).toISOString(),
    })));
  }

  return (
    <div className="section-stack">
      <div className="page-header">
        <div>
          <h1>Audit Trail</h1>
          <p>Append-only log of every prediction, decision, action and validation event — retained for compliance review.</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleExport} disabled={filtered.length === 0}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-input-wrap" style={{ minWidth: 260, flex: 1 }}>
            <Search size={15} />
            <input className="input" placeholder="Search event messages..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%' }} />
          </div>
          <select className="select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {TYPE_FILTERS.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Event Types' : toTitleCase(t)}</option>)}
          </select>
          <span className="text-muted" style={{ fontSize: '0.78rem' }}>{filtered.length} of {auditLog.length}</span>
        </div>

        {auditLog.length === 0 ? (
          <div className="empty-state">
            <ScrollText size={28} />
            <span>No audit events recorded yet</span>
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} emptyMessage="No events match your filters" />
        )}
      </div>
    </div>
  );
}
