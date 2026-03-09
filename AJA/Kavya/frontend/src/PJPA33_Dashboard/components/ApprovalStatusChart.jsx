import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6FAE2C', '#0B4F94', '#FFCA28', '#EF5350', '#8D6E63', '#42A5F5'];

const ApprovalStatusChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].name}</p>
                    <p className="tooltip-value">{payload[0].value.toLocaleString()} Reports</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Report Count by Approval Status</h3>
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
                        <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="circle"
                            formatter={(value) => {
                                const item = data.find(d => d.name === value);
                                return (
                                    <span style={{ color: '#444', fontSize: '12px', fontWeight: 500 }}>
                                        {value}: <span style={{ color: '#0B4F94', fontWeight: 'bold' }}>{item?.value || 0}</span>
                                    </span>
                                );
                            }}
                            wrapperStyle={{
                                paddingLeft: '20px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                fontSize: '12px'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ApprovalStatusChart;
