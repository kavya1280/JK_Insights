import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TripsByEmployeeChart = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const map = new Map();
        data.forEach(item => {
            const emp = item['Employee Name'] || 'Unknown';
            const repId = item['Report Id'];
            if (!map.has(emp)) map.set(emp, new Set());
            if (repId) map.get(emp).add(repId);
        });

        return Array.from(map.entries())
            .map(([emp, reps]) => ({ emp, trips: reps.size }))
            .sort((a, b) => b.trips - a.trips).slice(0, 10);
    }, [data]);

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Trips by Employees</h3>
            </div>
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                            <XAxis dataKey="emp" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#757575' }} dy={10} angle={-30} textAnchor="end" />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }} />
                            <Tooltip
                                cursor={{ fill: 'rgba(111, 174, 44, 0.05)' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [value, 'Trip Count']}
                            />
                            <Bar dataKey="trips" fill="#6FAE2C" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>No Data</div>
                )}
            </div>
        </div>
    );
};

export default TripsByEmployeeChart;
