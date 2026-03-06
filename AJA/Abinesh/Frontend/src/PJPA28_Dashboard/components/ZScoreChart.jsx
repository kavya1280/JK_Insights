import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const ZScoreChart = ({ data }) => {
    const chartData = data.map(d => ({
        ...d,
        label: d.digit_pair,
        fill: d.z_score > 0 ? '#dc2626' : '#6FAE2C'
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">Digit Pair: {d.digit_pair}</p>
                    <p style={{ margin: '2px 0', color: d.z_score > 0 ? '#dc2626' : '#6FAE2C', fontWeight: 700, fontSize: 14 }}>
                        Z-Score: {d.z_score}
                    </p>
                    <p style={{ margin: '2px 0', color: '#666', fontSize: 12 }}>Actual: {d.actual}% | Expected: {d.expected}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">First 2 Digit Pattern Z-Score</h3></div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }} barCategoryGap="15%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F2FAE5" horizontal={false} />
                        <XAxis type="number" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="label" stroke="#9E9E9E" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                        <ReferenceLine x={0} stroke="#999" strokeDasharray="3 3" />
                        <Bar dataKey="z_score" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1400}>
                            {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ZScoreChart;
