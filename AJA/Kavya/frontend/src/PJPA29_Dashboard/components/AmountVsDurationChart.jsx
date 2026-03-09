import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AmountVsDurationChart = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const durationMap = new Map();

        data.forEach(item => {
            let duration = item['Claim Duration'] ?? item['Claim Duration Days'] ?? item['Duration'];
            if (duration === undefined && item['Transaction Date'] && item['Submit Date']) {
                const diffTime = Math.abs(new Date(item['Submit Date']) - new Date(item['Transaction Date']));
                if (!isNaN(diffTime)) duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            duration = duration !== undefined && duration !== null ? String(duration) : 'Unknown';

            const amount = Number(item['Amount Approved'] || 0);

            durationMap.set(duration, (durationMap.get(duration) || 0) + amount);
        });

        const sorted = Array.from(durationMap.entries())
            .map(([duration, amount]) => ({ duration, amount }))
            .sort((a, b) => b.amount - a.amount);

        return sorted.slice(0, 10); // Top 10 longest/highest spending durations
    }, [data]);

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Amount vs Claim Duration Days</h3>
            </div>
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                            <XAxis dataKey="duration" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#333', fontWeight: 500 }} angle={-90} textAnchor="end" dy={10} />
                            <YAxis
                                axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }}
                                tickFormatter={(value) => `\u20B9${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(111, 174, 44, 0.05)' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [`\u20B9${Number(value).toLocaleString('en-IN')}`, 'Amount Approved']}
                                labelFormatter={(label) => `Duration: ${label} Days`}
                            />
                            <Bar dataKey="amount" fill="#6FAE2C" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>
                        No Data Available
                    </div>
                )}
            </div>
            <div style={{ textAlign: 'center', color: '#9E9E9E', fontSize: '12px', marginTop: '10px' }}>See which duration range has highest spend</div>
        </div>
    );
};

export default AmountVsDurationChart;
