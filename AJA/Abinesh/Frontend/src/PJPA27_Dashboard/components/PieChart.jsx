import React from 'react';
import { PieChart as RPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6FAE2C', '#0B4F94', '#8FC44A', '#1565C0', '#A8D45A', '#2196F3', '#4A7A1E', '#1976D2', '#C2E08F', '#64B5F6'];
const RS = '\u20B9';
const fmt = (v) => { if (v >= 1e6) return `${RS}${(v / 1e6).toFixed(1)}M`; if (v >= 1e3) return `${RS}${(v / 1e3).toFixed(1)}K`; return `${RS}${v.toFixed(0)}`; };

const PieChartComponent = ({ data }) => {
    const total = data.reduce((s, i) => s + i.value, 0);

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="custom-tooltip">
                <p className="tooltip-label">{payload[0].name}</p>
                <p className="tooltip-value">{fmt(payload[0].value)}</p>
                <p className="tooltip-pct">{total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0}%</p>
            </div>
        );
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Amount Distribution across Policy</h3></div>
            <div className="donut-layout">
                <div className="donut-pie-area">
                    <ResponsiveContainer width="100%" height="100%">
                        <RPieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                            <Pie data={data} cx="50%" cy="50%" outerRadius="75%" paddingAngle={2} dataKey="value" label={false} labelLine={false} isAnimationActive animationDuration={1100}>
                                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={2} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </RPieChart>
                    </ResponsiveContainer>
                </div>
                <div className="donut-right-legend">
                    <div className="donut-total-label">Total</div>
                    <div className="donut-total-value">{fmt(total)}</div>
                    <ul className="donut-legend-list">
                        {data.map((item, i) => (
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

export default PieChartComponent;
