import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6FAE2C', '#0B4F94', '#7DC030', '#1565C0', '#8FC44A', '#2196F3', '#4A7A1E', '#1976D2', '#A8D45A', '#64B5F6', '#dc2626', '#f59e0b', '#22c55e', '#8b5cf6', '#0ea5e9'];

const AnomalyBarChart = ({ data }) => {
    const chartData = data.map(d => ({
        employee: (d.employee || '').length > 12 ? (d.employee || '').substring(0, 12) + '…' : d.employee,
        fullName: d.employee,
        count: d.count
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].payload.fullName}</p>
                    <p className="tooltip-value">{payload[0].value} anomalies</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Anomalies Count by Employee</h3></div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 70, bottom: 5 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F2FAE5" horizontal={false} />
                        <XAxis type="number" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="employee" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(111,174,44,0.05)' }} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1400}>
                            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnomalyBarChart;
