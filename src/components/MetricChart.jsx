import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { formatTime } from '../utils/formatters';

function ChartTooltip({ active, payload, label, lines }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--bg-surface-alt)',
      border: '1px solid var(--border-color-strong)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
    }}
    >
      <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{formatTime(label)}</div>
      {payload.map((p) => {
        const line = lines.find((l) => l.key === p.dataKey);
        return (
          <div key={p.dataKey} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span>{line?.label || p.dataKey}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{p.value.toFixed(1)}{line?.unit || ''}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function MetricChart({ data, lines, height = 240, showLegend = true }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {lines.map((line) => (
            <linearGradient key={line.key} id={`grad-${line.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={line.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="var(--border-color)" vertical={false} />
        <XAxis
          dataKey="t"
          tickFormatter={formatTime}
          stroke="var(--text-muted)"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: 'var(--border-color)' }}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis
          stroke="var(--text-muted)"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<ChartTooltip lines={lines} />} />
        {showLegend && <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} iconType="circle" iconSize={8} />}
        {lines.map((line) => (
          <Area
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color}
            fill={`url(#grad-${line.key})`}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
