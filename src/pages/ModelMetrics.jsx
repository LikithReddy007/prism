import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { Target, CheckCircle2, Crosshair, TrendingUp } from 'lucide-react';
import { useSimulation } from '../services/store';
import StatCard from '../components/StatCard';
import { formatPercent } from '../utils/formatters';

function ConfusionCell({ label, value, tone }) {
  return (
    <div style={{
      background: `var(--color-${tone}-bg)`,
      border: `1px solid var(--color-${tone})`,
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-4)',
      textAlign: 'center',
    }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: `var(--color-${tone})` }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  );
}

export default function ModelMetrics() {
  const { modelMetrics } = useSimulation();
  const { confusionMatrix, featureImportance, predictionVolume } = modelMetrics;

  return (
    <div className="section-stack">
      <div className="page-header">
        <div>
          <h1>Model Metrics</h1>
          <p>Performance of the ML Prediction stage — trained on historical CloudWatch metrics and incident outcomes.</p>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <StatCard label="Accuracy" value={formatPercent(modelMetrics.accuracy, 1)} icon={CheckCircle2} accent="var(--color-success)" accentBg="var(--color-success-bg)" />
        <StatCard label="Precision" value={formatPercent(modelMetrics.precision, 1)} icon={Target} accent="var(--color-primary)" accentBg="var(--color-primary-bg)" />
        <StatCard label="Recall" value={formatPercent(modelMetrics.recall, 1)} icon={Crosshair} accent="var(--color-accent)" accentBg="var(--color-accent-bg)" />
        <StatCard label="AUC" value={modelMetrics.auc.toFixed(3)} icon={TrendingUp} accent="var(--color-indigo)" accentBg="var(--color-indigo-bg)" />
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Confusion Matrix</h2>
              <p className="text-muted">Prediction outcomes across all resolved incidents this session</p>
            </div>
          </div>
          <div className="grid grid-cols-2">
            <ConfusionCell label="True Positive" value={confusionMatrix.tp} tone="success" />
            <ConfusionCell label="False Positive" value={confusionMatrix.fp} tone="warning" />
            <ConfusionCell label="False Negative" value={confusionMatrix.fn} tone="danger" />
            <ConfusionCell label="True Negative" value={confusionMatrix.tn} tone="info" />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2>Feature Importance</h2>
              <p className="text-muted">Relative contribution to the risk score</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={featureImportance} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid stroke="var(--border-color)" horizontal={false} />
              <XAxis type="number" domain={[0, 0.4]} tickFormatter={(v) => `${Math.round(v * 100)}%`} stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="feature" width={150} stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => `${(v * 100).toFixed(1)}%`}
                contentStyle={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color-strong)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {featureImportance.map((f, idx) => (
                  <Cell key={f.feature} fill={idx === 0 ? '#ff9900' : '#3b82f6'} fillOpacity={1 - idx * 0.12} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Prediction Volume</h2>
            <p className="text-muted">Predictions generated per day over the last 14 days</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={predictionVolume} margin={{ left: -20 }}>
            <CartesianGrid stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={{ stroke: 'var(--border-color)' }} tickLine={false} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color-strong)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
