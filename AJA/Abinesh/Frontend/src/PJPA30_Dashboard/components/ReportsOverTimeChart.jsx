import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportsOverTimeChart = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const map = new Map();
        data.forEach(item => {
            const d = item['Submit Date'] || item['Date'] || item['Transaction Date'] || 'Unknown';
            const repId = item['Report Id'];
            if (!map.has(d)) map.set(d, new Set());
            if (repId) map.get(d).add(repId);
        });

        return Array.from(map.entries())
            .map(([date, reps]) => ({ date, count: reps.size }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [data]);

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Reports Submitted Over Time</h3>
            </div>
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }} dy={10}
                                tickFormatter={(val) => {
                                    try {
                                        const d = new Date(val);
                                        if (!isNaN(d)) return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                                    } catch (e) { }
                                    return val;
                                }}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [value, 'Report Count']}
                            />
                            <Line type="monotone" dataKey="count" stroke="#FF7043" strokeWidth={3} dot={{ r: 4, fill: '#FF7043', stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>No Data</div>
                )}
            </div>
            <div style={{ textAlign: 'center', color: '#9E9E9E', fontSize: '12px', marginTop: '10px' }}>Detect spikes in short trips</div>
        </div>
    );
};

export default ReportsOverTimeChart;
