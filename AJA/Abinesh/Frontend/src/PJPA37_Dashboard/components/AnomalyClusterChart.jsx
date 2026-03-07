import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#EF5350', '#E57373', '#EF9A9A', '#B71C1C', '#D32F2F', '#F44336'];

const AnomalyClusterChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">Cluster ID: {payload[0].payload.cluster_id}</p>
                    <p className="tooltip-value">{payload[0].value.toLocaleString()} Anomalies</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row">
                <div className="chart-title-accent" style={{ background: '#EF5350' }} />
                <h3 className="chart-title">Anomaly Count by Cluster ID</h3>
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" vertical={false} />
                        <XAxis dataKey="cluster_id" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239,83,80,0.05)' }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1200}>
                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnomalyClusterChart;
