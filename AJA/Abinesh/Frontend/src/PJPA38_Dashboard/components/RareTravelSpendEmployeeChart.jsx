import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#EF5350', '#E57373', '#EF9A9A', '#B71C1C', '#D32F2F', '#F44336'];
const RS = '\u20B9';

const RareTravelSpendEmployeeChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">Emp: {payload[0].payload.employee}</p>
                    <p className="tooltip-value">{RS}{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row">
                <div className="chart-title-accent" style={{ background: '#EF5350' }} />
                <h3 className="chart-title">Rare Travel Spend by Employee</h3>
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 5 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" horizontal={false} />
                        <XAxis type="number" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="employee" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239,83,80,0.05)' }} />
                        <Bar dataKey="amount" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1200}>
                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RareTravelSpendEmployeeChart;
