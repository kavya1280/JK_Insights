import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#EF5350', '#0B4F94', '#6FAE2C', '#F4A261', '#E76F51', '#2A9D8F'];

const SpendOddModesPieChart = ({ data }) => {
    return (
        <div className="chart-card">
            <h3 className="chart-title">Spend on Odd Modes</h3>
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
                                dataKey="amount"
                                nameKey="expense_type"
                                label={({ expense_type, percent }) => `${expense_type} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
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

export default SpendOddModesPieChart;
