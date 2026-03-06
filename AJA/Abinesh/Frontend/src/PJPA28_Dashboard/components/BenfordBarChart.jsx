import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BenfordBarChart = ({ data, title, digitLabel = "Digit" }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{digitLabel} {label}</p>
                    {payload.map((p, i) => (
                        <p key={i} style={{ margin: '2px 0', color: p.color, fontWeight: 600, fontSize: 13 }}>
                            {p.name}: {p.value.toFixed(2)}%
                        </p>
                    ))}
                    {payload[0]?.payload?.z_score !== undefined && (
                        <p style={{ margin: '2px 0', color: '#666', fontSize: 12 }}>Z-Score: {payload[0].payload.z_score}</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">{title}</h3></div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F2FAE5" vertical={false} />
                        <XAxis dataKey="digit" stroke="#9E9E9E" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(111,174,44,0.05)' }} />
                        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                        <Bar dataKey="actual" name="Actual %" fill="#6FAE2C" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1200} />
                        <Bar dataKey="expected" name="Expected %" fill="#0B4F94" radius={[4, 4, 0, 0]} opacity={0.6} isAnimationActive animationDuration={1200} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BenfordBarChart;
