import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useSimulation } from '../services/store';
import DataTable from '../components/DataTable';
import { IncidentStatusBadge, RiskBadge } from '../components/StatusBadge';
import { formatDateTime, formatPercent } from '../utils/formatters';

const STATUS_FILTERS = ['all', 'predicted', 'deciding', 'recovering', 'validating', 'resolved', 'failed'];
const RISK_FILTERS = ['all', 'low', 'medium', 'high'];

export default function Incidents() {
  const { incidents, instances } = useSimulation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [instanceFilter, setInstanceFilter] = useState(searchParams.get('instance') || 'all');

  const filtered = useMemo(() => incidents.filter((inc) => {
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (riskFilter !== 'all' && inc.riskTier !== riskFilter) return false;
    if (instanceFilter !== 'all' && inc.instanceId !== instanceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!inc.id.toLowerCase().includes(q) && !inc.instanceName.toLowerCase().includes(q) && !inc.failureType.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  }), [incidents, statusFilter, riskFilter, instanceFilter, search]);

  const columns = [
    { key: 'id', label: 'Incident ID', sortable: true, className: 'mono', render: (r) => r.id },
    { key: 'instanceName', label: 'Instance', sortable: true },
    { key: 'failureType', label: 'Predicted Issue', sortable: true },
    {
      key: 'riskScore', label: 'Risk', sortable: true, render: (r) => (
        <span className="flex items-center gap-2">
          <RiskBadge tier={r.riskTier} />
          <span className="mono text-muted" style={{ fontSize: '0.75rem' }}>{formatPercent(r.riskScore, 0)}</span>
        </span>
      ),
    },
    { key: 'confidence', label: 'Confidence', sortable: true, render: (r) => formatPercent(r.confidence, 0) },
    { key: 'playbook', label: 'Playbook', render: (r) => r.playbook || '—' },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <IncidentStatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Detected', sortable: true, className: 'text-muted mono', render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <div className="section-stack">
      <div className="page-header">
        <div>
          <h1>Incidents</h1>
          <p>Every failure PRISM has predicted, along with its risk score, chosen playbook and current pipeline stage.</p>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-input-wrap" style={{ minWidth: 240 }}>
            <Search size={15} />
            <input className="input" placeholder="Search by ID, instance or issue..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
          </select>
          <select className="select" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            {RISK_FILTERS.map((r) => <option key={r} value={r}>{r === 'all' ? 'All Risk Levels' : `${r} risk`}</option>)}
          </select>
          <select className="select" value={instanceFilter} onChange={(e) => setInstanceFilter(e.target.value)}>
            <option value="all">All Instances</option>
            {instances.map((inst) => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
          </select>
          <span className="text-muted" style={{ fontSize: '0.78rem', marginLeft: 'auto' }}>{filtered.length} of {incidents.length}</span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/incidents/${row.id}`)}
          emptyMessage="No incidents match your filters"
        />
      </div>
    </div>
  );
}
