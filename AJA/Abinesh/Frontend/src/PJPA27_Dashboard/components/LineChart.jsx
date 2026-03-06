import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const LineChart = ({ data }) => {
    const formatMonth = (val) => {
        if (!val) return '';
        const [y, m] = val.split('-');
        const date = new Date(+y, +m - 1);
        return date.toLocaleString('en', { month: 'short', year: '2-digit' });
    };

    const formatAmount = (val) => {
        if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
        if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
        return val;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#333' }}>{formatMonth(label)}</p>
                    <p style={{ margin: '4px 0 0', color: '#2E7D32', fontWeight: 500 }}>₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Amount Approved by Date of Resignation</h3></div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                        <defs>
                            <linearGradient id="greenGrad27" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6FAE2C" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6FAE2C" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 10, fill: '#888' }} angle={-35} textAnchor="end" interval={Math.max(0, Math.floor(data.length / 10) - 1)} />
                        <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11, fill: '#888' }} width={55} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="amount" stroke="#6FAE2C" strokeWidth={2.5} fill="url(#greenGrad27)" dot={false} activeDot={{ r: 5, fill: '#6FAE2C', stroke: 'white', strokeWidth: 2 }} isAnimationActive animationDuration={1200} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default LineChart;
