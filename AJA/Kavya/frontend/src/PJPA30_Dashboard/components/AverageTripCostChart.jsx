import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AverageTripCostChart = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const map = new Map();
        data.forEach(item => {
            const emp = item['Employee Name'] || 'Unknown';
            const amt = Number(item['Amount Approved'] || 0);
            const repId = item['Report Id'];

            if (!map.has(emp)) map.set(emp, { amount: 0, reps: new Set() });
            map.get(emp).amount += amt;
            if (repId) map.get(emp).reps.add(repId);
        });

        return Array.from(map.entries())
            .map(([emp, info]) => ({ emp, avg: info.reps.size ? info.amount / info.reps.size : 0 }))
            .sort((a, b) => b.avg - a.avg).slice(0, 10);
    }, [data]);

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Average Trip Cost per Employee</h3>
            </div>
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                            <XAxis dataKey="emp" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#333' }} angle={-90} textAnchor="end" dy={10} />
                            <YAxis
                                axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }}
                                tickFormatter={(value) => `\u20B9${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(111, 174, 44, 0.05)' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [`\u20B9${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Average Trip Cost']}
                            />
                            <Bar dataKey="avg" fill="#FF7043" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>No Data</div>
                )}
            </div>
        </div>
    );
};

export default AverageTripCostChart;
