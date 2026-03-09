import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const COLORS = ['#6FAE2C', '#0B4F94', '#93C54B', '#2E7D32', '#003366'];
const RS = '\u20B9';

const FrequencyVsCostChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].payload.employee}</p>
                    <p className="tooltip-value" style={{ color: '#6FAE2C' }}>Frequency: {payload[0].value.toLocaleString()}</p>
                    <p className="tooltip-value" style={{ color: '#0B4F94' }}>Cost: {RS}{payload[1].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Frequency vs Cost</h3>
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 5 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" horizontal={false} />
                        <XAxis type="number" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="employee" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11,79,148,0.05)' }} />
                        <Legend verticalAlign="top" align="right" />
                        <Bar dataKey="count" name="Frequency" fill="#6FAE2C" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1200} />
                        <Bar dataKey="amount" name="Cost" fill="#0B4F94" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1200} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default FrequencyVsCostChart;
