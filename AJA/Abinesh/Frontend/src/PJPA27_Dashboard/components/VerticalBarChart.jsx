import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6FAE2C', '#0B4F94', '#7DC030', '#1565C0', '#8FC44A', '#2196F3', '#4A7A1E', '#1976D2', '#A8D45A', '#64B5F6'];
const RS = '\u20B9';

const VerticalBarChart = ({ data }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{label} days</p>
                    <p className="tooltip-value">{RS}{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Amount Approved by Days of Separation</h3></div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 30 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F2FAE5" vertical={false} />
                        <XAxis dataKey="category" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" />
                        <YAxis stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(111,174,44,0.05)' }} />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1400}>
                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default VerticalBarChart;
