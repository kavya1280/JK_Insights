import React, { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

const TrendLineChart = ({ filters }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const q = new URLSearchParams();
                if (filters?.employeeId) q.append('employee_id', filters.employeeId);
                if (filters?.employee) q.append('employee', filters.employee);
                if (filters?.reportId) q.append('report_id', filters.reportId);
                if (filters?.expenseType) q.append('expense_type', filters.expenseType);
                const res = await fetch(`http://localhost:8000/api/trend-data?${q}`);
                const json = await res.json();
                setData(json || []);
            } catch (e) {
                console.error('TrendLineChart error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters]);

    const formatMonth = (val) => {
        if (!val) return '';
        // val is "2024-01" format
        const [y, m] = val.split('-');
        const date = new Date(+y, +m - 1);
        return date.toLocaleString('en', { month: 'short', year: '2-digit' });
    };

    const formatAmount = (val) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
        return val;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'white', border: '1px solid #e0e0e0',
                    borderRadius: 8, padding: '10px 14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#333' }}>{formatMonth(label)}</p>
                    <p style={{ margin: '4px 0 0', color: '#2E7D32', fontWeight: 500 }}>
                        ₹{Number(payload[0].value).toLocaleString('en-IN')}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) return (
        <div className="chart-card">
            <h3 className="chart-title">Approved Amount Trend Over Time</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                <div className="spinner" />
            </div>
        </div>
    );

    return (
        <div className="chart-card">
            <h3 className="chart-title">Approved Amount Trend Over Time</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                        <defs>
                            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#43A047" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#43A047" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="month"
                            tickFormatter={formatMonth}
                            tick={{ fontSize: 10, fill: '#888' }}
                            angle={-35}
                            textAnchor="end"
                            interval={Math.max(0, Math.floor(data.length / 10) - 1)}
                        />
                        <YAxis
                            tickFormatter={formatAmount}
                            tick={{ fontSize: 11, fill: '#888' }}
                            width={55}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#2E7D32"
                            strokeWidth={2.5}
                            fill="url(#greenGrad)"
                            dot={false}
                            activeDot={{ r: 5, fill: '#2E7D32', stroke: 'white', strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={1200}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrendLineChart;
