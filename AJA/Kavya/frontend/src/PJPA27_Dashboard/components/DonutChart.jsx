import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#dc2626', '#f59e0b', '#6FAE2C', '#0B4F94', '#8FC44A', '#1565C0', '#A8D45A', '#64B5F6'];
const RS = '\u20B9';
const fmt = (v) => { if (v >= 1e6) return `${RS}${(v / 1e6).toFixed(1)}M`; if (v >= 1e3) return `${RS}${(v / 1e3).toFixed(1)}K`; return `${RS}${v.toFixed(0)}`; };

const DonutChart = ({ data }) => {
    const total = data.reduce((s, i) => s + i.value, 0);
    const chartData = data.map(d => ({ ...d, pct: total > 0 ? ((d.value / total) * 100).toFixed(1) : '0' }));

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="custom-tooltip" style={{ zIndex: 1000 }}>
                <p className="tooltip-label">{payload[0].name}</p>
                <p className="tooltip-value">{fmt(payload[0].value)}</p>
                <p className="tooltip-pct">{chartData.find(d => d.name === payload[0].name)?.pct}%</p>
            </div>
        );
    };

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Amount Distribution across Risk Category</h3></div>
            <div className="donut-layout">
                <div className="donut-pie-area">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius="42%" outerRadius="72%" paddingAngle={2} dataKey="value" label={false} labelLine={false} isAnimationActive animationDuration={1100}>
                                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={2} />)}
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
                                <span className="donut-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
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
