import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const APP_COLORS = [
  '#6FAE2C', '#0B4F94', '#8FC44A', '#1565C0', '#A8D45A',
  '#2196F3', '#4A7A1E', '#1976D2', '#C2E08F', '#64B5F6',
  '#7DC030', '#0D47A1', '#A6A6A6', '#42A5F5', '#DCF0B2'
];

const RS = '\u20B9';

const fmt = (v) => {
  if (v >= 1_000_000) return `${RS}${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${RS}${(v / 1_000).toFixed(1)}K`;
  return `${RS}${v.toFixed(0)}`;
};

const DonutChart = ({ data, isAggregated }) => {
  const aggregate = () => {
    if (!data || data.length === 0) return [];
    if (isAggregated) return data.map(item => ({ ...item }));
    const map = new Map();
    data.forEach(item => {
      map.set(item.expenseType, (map.get(item.expenseType) || 0) + Number(item.approvedAmount || 0));
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  };

  let chartData = aggregate();
  const total = chartData.reduce((s, i) => s + i.value, 0);
  chartData.sort((a, b) => b.value - a.value);
  chartData.forEach(item => {
    item.pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
  });

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="custom-tooltip" style={{ zIndex: 1000 }}>
        <p className="tooltip-label">{d.name}</p>
        <p className="tooltip-value">{fmt(d.value)}</p>
      </div>
    );
  };

  return (
    <div className="chart-card chart-animate equal-height-card">
      <div className="chart-title-row">
        <div className="chart-title-accent" />
        <h3 className="chart-title">Amount Distribution Across Expense Type</h3>
      </div>

      <div className="donut-layout">
        <div className="donut-pie-area">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="42%"
                outerRadius="72%"
                paddingAngle={2}
                dataKey="value"
                label={false}
                labelLine={false}
                isAnimationActive
                animationBegin={200}
                animationDuration={1100}
                animationEasing="ease-out"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={APP_COLORS[i % APP_COLORS.length]} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="donut-right-legend">
          <div className="donut-total-label">Total</div>
          <div className="donut-total-value">{fmt(total)}</div>
          <ul className="donut-legend-list">
            {chartData.map((item, i) => (
              <li key={item.name} className="donut-legend-item">
                <span className="donut-legend-dot" style={{ background: APP_COLORS[i % APP_COLORS.length] }} />
                <span className="donut-legend-name" title={item.name}>{item.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
