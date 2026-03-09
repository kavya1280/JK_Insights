import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AmountSpentByDateChart = ({ data }) => {
    return (
        <div className="chart-card">
            <h3 className="chart-title">Amount Spent by Date</h3>
            <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                            dx={-10}
                            tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val}`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#6FAE2C"
                            strokeWidth={3}
                            fill="#6FAE2C"
                            fillOpacity={0.15}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AmountSpentByDateChart;
