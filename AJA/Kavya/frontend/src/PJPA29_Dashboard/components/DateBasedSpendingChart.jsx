import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DateBasedSpendingChart = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const dateMap = new Map();

        data.forEach(item => {
            const dateStr = item['Submit Date'] || item['Date'] || item['Transaction Date'] || 'Unknown';
            const amount = Number(item['Amount Approved'] || 0);

            // Simple parsing or grouping by Submit Date
            dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + amount);
        });

        const sorted = Array.from(dateMap.entries())
            .map(([dateStr, amount]) => ({ dateStr, amount }))
            .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));

        return sorted;
    }, [data]);

    return (
        <div className="chart-card chart-animate equal-height-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Date-Based Spending Analysis</h3>
            </div>
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorAmountArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0B4F94" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0B4F94" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                            <XAxis
                                dataKey="dateStr"
                                axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }} dy={10}
                                tickFormatter={(val) => {
                                    try {
                                        const d = new Date(val);
                                        if (!isNaN(d)) {
                                            return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                                        }
                                    } catch (e) { }
                                    return val;
                                }}
                            />
                            <YAxis
                                axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }}
                                tickFormatter={(value) => `\u20B9${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [`\u20B9${Number(value).toLocaleString('en-IN')}`, 'Amount Approved']}
                                labelStyle={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#0B4F94" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountArea)" activeDot={{ r: 6, fill: '#0B4F94', stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>
                        No Data Available
                    </div>
                )}
            </div>
            <div style={{ textAlign: 'center', color: '#9E9E9E', fontSize: '12px', marginTop: '10px' }}>Observe spending trend over time</div>
        </div>
    );
};

export default DateBasedSpendingChart;
