import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6FAE2C', '#0B4F94', '#F4A261', '#E76F51', '#2A9D8F', '#E9C46A'];

const PolicyAmountPieChart = ({ data }) => {
    return (
        <div className="chart-card">
            <h3 className="chart-title">Policy by Amount Approved</h3>
            {data && data.length > 0 ? (
                <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    No data available for this selection
                </div>
            )}
        </div>
    );
};

export default PolicyAmountPieChart;
