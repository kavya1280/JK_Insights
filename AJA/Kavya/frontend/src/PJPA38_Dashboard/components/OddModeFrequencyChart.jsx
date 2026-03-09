import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const OddModeFrequencyChart = ({ data }) => {
    return (
        <div className="chart-card">
            <h3 className="chart-title">Odd mode Frequency</h3>
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
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [value, 'Frequency']}
                        />
                        <Bar
                            dataKey="count"
                            fill="#6FAE2C"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default OddModeFrequencyChart;
