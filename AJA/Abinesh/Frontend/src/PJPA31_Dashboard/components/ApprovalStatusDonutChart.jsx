import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const ApprovalStatusDonutChart = ({ data }) => {
    const { chartData, COLORS } = useMemo(() => {
        if (!data || data.length === 0) return { chartData: [], COLORS: {} };

        const map = new Map();
        data.forEach(item => {
            const status = item['Approval Status'] || item['Approved Status'] || 'Unknown';
            map.set(status, (map.get(status) || 0) + 1);
        });

        const parsedData = Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const colors = {
            'Approved': '#6FAE2C',
            'Rejected': '#FF7043',
            'Pending': '#FFCA28',
            'Unknown': '#9E9E9E'
        };

        return { chartData: parsedData, COLORS: colors };
    }, [data]);

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Approval Status for Splitting</h3>
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
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#26C6DA'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => value.toLocaleString('en-IN')}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="donut-right-legend">
                            <div className="donut-total-label">Total Cases</div>
                            <div className="donut-total-value" style={{ fontSize: '20px' }}>{total.toLocaleString('en-IN')}</div>
                            <ul className="donut-legend-list">
                                {chartData.map((entry) => {
                                    const pct = ((entry.value / total) * 100).toFixed(1);
                                    return (
                                        <li key={entry.name} className="donut-legend-item">
                                            <span className="donut-legend-color" style={{ backgroundColor: COLORS[entry.name] || '#26C6DA' }}></span>
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
                        No Data Available
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApprovalStatusDonutChart;
