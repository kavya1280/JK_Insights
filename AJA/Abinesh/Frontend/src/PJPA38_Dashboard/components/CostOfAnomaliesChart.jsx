import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CostOfAnomaliesChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">Emp: {data.employee}</p>
                    <p className="tooltip-value">Amount: \u20B9{data.amount.toLocaleString()}</p>
                    <p className="tooltip-value">Usage Pct: {data.usage_pct}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row">
                <div className="chart-title-accent" style={{ background: '#EF5350' }} />
                <h3 className="chart-title">Cost of Anomalies (Usage vs Amount)</h3>
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" />
                        <XAxis type="number" dataKey="usage_pct" name="Usage Pct" stroke="#9E9E9E" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="number" dataKey="amount" name="Amount" stroke="#9E9E9E" tick={{ fontSize: 11 }} tickFormatter={(v) => `\u20B9${(v / 1000).toFixed(0)}K`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Anomalies" data={data} fill="#EF5350">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#EF5350" />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CostOfAnomaliesChart;
