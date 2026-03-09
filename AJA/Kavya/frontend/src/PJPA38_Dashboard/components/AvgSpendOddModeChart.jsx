import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AvgSpendOddModeChart = ({ data }) => {
    return (
        <div className="chart-card">
            <h3 className="chart-title">Average Spend per Odd mode</h3>
            <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="expense_type"
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            type="number"
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                            dx={-10}
                            tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val}`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Average Spend']}
                        />
                        <Bar
                            dataKey="avg_amount"
                            fill="#EF5350"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AvgSpendOddModeChart;
