import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6FAE2C', '#0B4F94', '#7DC030', '#1565C0', '#8FC44A', '#2196F3', '#4A7A1E'];

const EmployeeBandChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Holiday Claim Amount by Employee Band</h3>
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F2FAE5" vertical={false} />
                        <XAxis
                            dataKey="band"
                            stroke="#9E9E9E"
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EmployeeBandChart;
