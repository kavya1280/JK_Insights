import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SplittingAmountDistributionChart = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        let range1 = 0; // 0-1k
        let range2 = 0; // 1k-5k
        let range3 = 0; // 5k-10k
        let range4 = 0; // >10k

        data.forEach(item => {
            const amt = Number(item['Amount Approved'] || 0);
            if (amt >= 0 && amt <= 1000) range1++;
            else if (amt > 1000 && amt <= 5000) range2++;
            else if (amt > 5000 && amt <= 10000) range3++;
            else if (amt > 10000) range4++;
        });

        return [
            { range: '0 - 1K', count: range1 },
            { range: '1K - 5K', count: range2 },
            { range: '5K - 10K', count: range3 },
            { range: '> 10K', count: range4 }
        ];
    }, [data]);

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row">
                <div className="chart-title-accent" />
                <h3 className="chart-title">Distribution by Splitting Amount</h3>
            </div>
            <div className="chart-container">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                            <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#757575' }} />
                            <Tooltip
                                cursor={{ fill: 'rgba(111, 174, 44, 0.05)' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [value, 'Number of Claims']}
                            />
                            <Bar dataKey="count" fill="#FF7043" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>No Data</div>
                )}
            </div>
        </div>
    );
};

export default SplittingAmountDistributionChart;
