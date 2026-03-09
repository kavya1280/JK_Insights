import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#1565C0', '#1976D2', '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9'];

const GhostEmployeeMapChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].payload.location}</p>
                    <p className="tooltip-value">{payload[0].value.toLocaleString()} Employees</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row">
                <div className="chart-title-accent" style={{ background: '#1565C0' }} />
                <h3 className="chart-title">Ghost Employees by Location</h3>
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 5 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" horizontal={false} />
                        <XAxis type="number" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="location" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(21,101,192,0.05)' }} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1200}>
                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GhostEmployeeMapChart;
