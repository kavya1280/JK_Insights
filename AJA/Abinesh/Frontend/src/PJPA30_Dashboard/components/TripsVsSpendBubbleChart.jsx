import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TripsVsSpendBubbleChart = ({ data }) => {
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
            .map(([emp, info]) => {
                const trips = info.reps.size;
                return {
                    emp,
                    trips,
                    spend: info.amount,
                    avgCost: trips ? info.amount / trips : 0
                };
            })
            .filter(d => d.trips > 0);
    }, [data]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #E0E0E0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{data.emp}</p>
                    <p style={{ margin: '4px 0 0 0', color: '#6FAE2C', fontSize: '13px' }}>Trips: <strong>{data.trips}</strong></p>
                    <p style={{ margin: '4px 0 0 0', color: '#0B4F94', fontSize: '13px' }}>Total Spend: <strong>{`\u20B9${Number(data.spend).toLocaleString('en-IN')}`}</strong></p>
                    <p style={{ margin: '4px 0 0 0', color: '#FF7043', fontSize: '13px' }}>Avg Cost: <strong>{`\u20B9${Number(data.avgCost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}</strong></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Trips per Employee vs Total Spend</h3>
            </div>
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                            <XAxis
                                type="number" dataKey="trips" name="Trip Count" axisLine={false} tickLine={false}
                                tick={{ fontSize: 12, fill: '#757575' }} dy={10}
                            />
                            <YAxis
                                type="number" dataKey="spend" name="Total Spend" axisLine={false} tickLine={false}
                                tick={{ fontSize: 12, fill: '#757575' }}
                                tickFormatter={(value) => `\u20B9${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`}
                            />
                            <ZAxis type="number" dataKey="avgCost" range={[50, 400]} name="Avg Cost" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                            <Scatter name="Employees" data={chartData} fill="#AB47BC" fillOpacity={0.6} />
                        </ScatterChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>No Data</div>
                )}
            </div>
            <div style={{ textAlign: 'center', color: '#9E9E9E', fontSize: '12px', marginTop: '10px' }}>Detect frequent low-cost trip abuse</div>
        </div>
    );
};

export default TripsVsSpendBubbleChart;
