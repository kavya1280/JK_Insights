import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MonthlyClaimCountAreaChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].payload.month}</p>
                    <p className="tooltip-value">{payload[0].value.toLocaleString()} Claims</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Monthly Claim Count</h3>
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6FAE2C" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6FAE2C" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" vertical={false} />
                        <XAxis dataKey="month" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="count" stroke="#6FAE2C" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} animationDuration={1500} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlyClaimCountAreaChart;
