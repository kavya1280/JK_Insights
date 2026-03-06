import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#0B4F94', '#6FAE2C', '#1565C0', '#7DC030', '#2196F3', '#8FC44A', '#4A7A1E', '#1976D2', '#A8D45A', '#64B5F6', '#dc2626', '#f59e0b', '#22c55e', '#8b5cf6', '#0ea5e9'];
const RS = '\u20B9';

const DesignationBarChart = ({ data }) => {
    const chartData = data.map(item => ({
        label: (item.designation || '').length > 18 ? (item.designation || '').substring(0, 18) + '…' : item.designation,
        fullName: item.designation,
        amount: item.amount
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].payload.fullName}</p>
                    <p className="tooltip-value">{RS}{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Amount Approved by Designation</h3></div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 40, left: 80, bottom: 5 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F2FAE5" horizontal={false} />
                        <XAxis type="number" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="label" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11,79,148,0.05)' }} />
                        <Bar dataKey="amount" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1400}>
                            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DesignationBarChart;
