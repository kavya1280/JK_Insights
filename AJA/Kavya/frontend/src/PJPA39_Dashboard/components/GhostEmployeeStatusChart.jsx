import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#EF5350', '#0B4F94', '#FFCA28', '#6FAE2C', '#8D6E63', '#42A5F5'];

const GhostEmployeeStatusChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].name}</p>
                    <p className="tooltip-value">{payload[0].value.toLocaleString()} Employees</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Ghost Employees by Status</h3>
            </div>
            <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            isAnimationActive
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#444' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GhostEmployeeStatusChart;
