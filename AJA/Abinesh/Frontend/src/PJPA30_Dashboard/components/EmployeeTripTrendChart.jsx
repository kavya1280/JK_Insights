import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EmployeeTripTrendChart = ({ data }) => {
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
            .map(([emp, info]) => ({ emp, trips: info.reps.size, spend: info.amount }))
            .sort((a, b) => b.trips - a.trips).slice(0, 15);
    }, [data]);

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Employee Trip Count and Total Spend Trend</h3>
            </div>
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                            <XAxis dataKey="emp" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#757575' }} dy={10} angle={-30} textAnchor="end" />
                            <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }} />
                            <YAxis
                                yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }}
                                tickFormatter={(val) => `\u20B9${val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value, name) => [name === 'spend' ? `\u20B9${Number(value).toLocaleString('en-IN')}` : value, name === 'trips' ? 'Trip Count' : 'Total Spend']}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                            <Bar yAxisId="left" dataKey="trips" name="Trip Count" fill="#0B4F94" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line yAxisId="right" type="monotone" dataKey="spend" name="Total Spend" stroke="#6FAE2C" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>No Data</div>
                )}
            </div>
        </div>
    );
};

export default EmployeeTripTrendChart;
