import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0B4F94', '#6FAE2C', '#FF7043', '#26C6DA', '#AB47BC', '#FFCA28', '#8D6E63', '#9CCC65', '#29B6F6', '#EF5350'];

const BillsByCategoryChart = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const map = new Map();
        // Assuming category could be in "Expense Type", "Policy", or "Category"
        data.forEach(item => {
            const cat = item['Expense Type'] || item['Policy'] || item['Category'] || 'Other';
            const amount = Number(item['Amount Approved'] || 0);
            map.set(cat, (map.get(cat) || 0) + amount);
        });

        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [data]);

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    const formatNumber = (val) => {
        if (val >= 1000000) return `\u20B9${(val / 1000000).toFixed(2)}M`;
        if (val >= 100000) return `\u20B9${(val / 100000).toFixed(2)}L`;
        if (val >= 1000) return `\u20B9${(val / 1000).toFixed(1)}K`;
        return `\u20B9${val.toLocaleString('en-IN')}`;
    };

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Bills by Category</h3>
            </div>
            <div className="chart-container donut-layout">
                {chartData.length > 0 ? (
                    <>
                        <div className="donut-pie-area">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={95}
                                        dataKey="value"
                                        stroke="#fff"
                                        strokeWidth={2}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => `\u20B9${Number(value).toLocaleString('en-IN')}`}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="donut-right-legend">
                            <div className="donut-total-label">Total Amount</div>
                            <div className="donut-total-value">{formatNumber(total)}</div>
                            <ul className="donut-legend-list" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                                {chartData.map((entry, index) => {
                                    const pct = ((entry.value / total) * 100).toFixed(1);
                                    return (
                                        <li key={entry.name} className="donut-legend-item">
                                            <span className="donut-legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                            <span className="donut-legend-text" title={entry.name}>{entry.name}</span>
                                            <span className="donut-legend-amount">{pct}%</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>
                        No Data
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillsByCategoryChart;
