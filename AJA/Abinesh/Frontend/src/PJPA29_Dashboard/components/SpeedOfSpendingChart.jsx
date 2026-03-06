import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0B4F94', '#6FAE2C', '#FF7043', '#26C6DA', '#AB47BC', '#FFCA28'];

const SpeedOfSpendingChart = ({ data }) => {
    const { chartData, policies } = useMemo(() => {
        if (!data || data.length === 0) return { chartData: [], policies: [] };

        // Group by Claim Duration
        const durationMap = new Map();
        const policySet = new Set();

        data.forEach(item => {
            const duration = item['Claim Duration'] !== undefined ? String(item['Claim Duration']) : 'Unknown';
            const policy = item['Policy'] || 'Unknown';
            const amount = Number(item['Amount Approved'] || 0);

            policySet.add(policy);

            if (!durationMap.has(duration)) {
                durationMap.set(duration, { duration });
            }
            const entry = durationMap.get(duration);
            entry[policy] = (entry[policy] || 0) + amount;
        });

        const sortedData = Array.from(durationMap.values()).sort((a, b) => {
            const numA = parseInt(a.duration, 10);
            const numB = parseInt(b.duration, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return String(a.duration).localeCompare(String(b.duration));
        });

        return { chartData: sortedData, policies: Array.from(policySet) };
    }, [data]);

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Speed of Spending</h3>
            </div>
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                            <XAxis dataKey="duration" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }} dy={10} />
                            <YAxis
                                axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }}
                                tickFormatter={(value) => `\u20B9${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => `\u20B9${Number(value).toLocaleString('en-IN')}`}
                                labelStyle={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}
                                labelFormatter={(label) => `Claim Duration: ${label}`}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                            {policies.map((pol, idx) => (
                                <Bar key={pol} dataKey={pol} name={pol} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>
                        No Data Available
                    </div>
                )}
            </div>
            <div style={{ textAlign: 'center', color: '#9E9E9E', fontSize: '12px', marginTop: '10px' }}>Detect fast claim submissions after joining</div>
        </div>
    );
};

export default SpeedOfSpendingChart;
