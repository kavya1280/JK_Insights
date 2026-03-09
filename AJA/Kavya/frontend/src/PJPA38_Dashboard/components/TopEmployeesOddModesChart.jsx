import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TopEmployeesOddModesChart = ({ data }) => {
    return (
        <div className="chart-card" style={{ flex: '1 1 100%' }}>
            <h3 className="chart-title">Top Employees using odd modes</h3>
            <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                    <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis
                            type="number"
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="employee"
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                            width={120}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [value, 'Modes Count']}
                        />
                        <Bar
                            dataKey="count"
                            fill="#0B4F94"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TopEmployeesOddModesChart;
