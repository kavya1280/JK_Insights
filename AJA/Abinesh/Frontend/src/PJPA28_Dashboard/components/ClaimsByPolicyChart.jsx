import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6FAE2C', '#0B4F94', '#8BC34A', '#1565C0', '#AED581', '#1976D2'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-label">{label}</p>
                <p className="tooltip-value">
                    Amount Approved: ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
        );
    }
    return null;
};

const ClaimsByPolicyChart = ({ data }) => {
    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row">
                <div className="chart-title-accent"></div>
                <h3 className="chart-title">Claims by Policy</h3>
            </div>
            {data && data.length > 0 ? (
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEEEEE" />
                            <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#757575', fontSize: 12 }}
                                tickFormatter={(value) => `$${value >= 1000 ? (value / 1000) + 'k' : value}`}
                            />
                            <YAxis
                                type="category"
                                dataKey="policy"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#757575', fontSize: 12 }}
                                width={100}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F2FAE5' }} />
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9E9E9E' }}>
                    No policy data available for selected filters
                </div>
            )}
        </div>
    );
};

export default ClaimsByPolicyChart;
