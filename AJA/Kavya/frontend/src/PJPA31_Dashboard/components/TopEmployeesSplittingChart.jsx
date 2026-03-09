import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TopEmployeesSplittingChart = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const map = new Map();
        data.forEach(item => {
            const emp = item['Employee Name'] || 'Unknown';
            const amt = Number(item['Amount Approved'] || 0);

            if (!map.has(emp)) map.set(emp, { cases: 0, amount: 0 });
            map.get(emp).cases += 1;
            map.get(emp).amount += amt;
        });

        return Array.from(map.entries())
            .map(([emp, info]) => ({ emp, ...info }))
            .sort((a, b) => b.cases - a.cases).slice(0, 10);
    }, [data]);

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Splitting by Top Employees</h3>
            </div>
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                            <XAxis dataKey="emp" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#333' }} angle={-90} textAnchor="end" dy={10} />
                            <YAxis
                                axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(111, 174, 44, 0.05)' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value, name) => [name === 'amount' ? `\u20B9${Number(value).toLocaleString('en-IN')}` : value, name === 'amount' ? 'Total Spend' : 'Cases']}
                            />
                            <Bar dataKey="cases" fill="#0B4F94" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>No Data</div>
                )}
            </div>
        </div>
    );
};

export default TopEmployeesSplittingChart;
