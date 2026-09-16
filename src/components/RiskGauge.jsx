import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const TIER_COLOR = {
  low: 'var(--color-success)',
  medium: 'var(--color-warning)',
  high: 'var(--color-danger)',
};

export default function RiskGauge({ score, tier, size = 120 }) {
  const pct = Math.round(score * 100);
  const color = TIER_COLOR[tier] || 'var(--color-primary)';
  const data = [{ name: 'risk', value: pct, fill: color }];

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        cx={size / 2}
        cy={size / 2}
        innerRadius={size * 0.36}
        outerRadius={size * 0.48}
        barSize={size * 0.12}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background={{ fill: 'var(--bg-inset)' }} dataKey="value" cornerRadius={size} isAnimationActive={false} />
      </RadialBarChart>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: size * 0.2, color }}>{pct}%</span>
        <span style={{ fontSize: size * 0.08, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>risk</span>
      </div>
    </div>
  );
}
