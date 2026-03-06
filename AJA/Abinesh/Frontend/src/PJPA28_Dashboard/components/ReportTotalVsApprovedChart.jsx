import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-label">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color, margin: '4px 0', fontSize: '13px', fontWeight: '600' }}>
                        {entry.name}: ${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ReportTotalVsApprovedChart = ({ data }) => {
    return (
        <div className="chart-card chart-animate" style={{ animationDelay: '0.2s' }}>
            <div className="chart-title-row">
                <div className="chart-title-accent"></div>
                <h3 className="chart-title">Top 5 Employees by Report Total</h3>
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
                                dataKey="employee"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#757575', fontSize: 12 }}
                                width={80}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F5F5' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                            <Bar dataKey="reportTotal" name="Report Total" fill="#0B4F94" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="amountApproved" name="Amount Approved" fill="#6FAE2C" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9E9E9E' }}>
                    No report data available for selected filters
                </div>
            )}
        </div>
    );
};

export default ReportTotalVsApprovedChart;
