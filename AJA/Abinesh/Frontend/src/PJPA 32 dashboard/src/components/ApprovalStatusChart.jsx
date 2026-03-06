import React, { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const ApprovalStatusChart = ({ filters }) => {
    const [data, setData] = useState([]);
    const [paymentKeys, setPaymentKeys] = useState([]);
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
                const res = await fetch(`http://localhost:8000/api/approval-status?${q}`);
                const json = await res.json();
                // Determine the payment-status keys (all keys except "status")
                if (json.length > 0) {
                    const keys = Object.keys(json[0]).filter(k => k !== 'status');
                    setPaymentKeys(keys);
                }
                setData(json || []);
            } catch (e) {
                console.error('ApprovalStatusChart error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters]);

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
                    <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#333' }}>{label}</p>
                    {payload.map((p, i) => (
                        <p key={i} style={{ margin: '2px 0', color: p.fill, fontSize: 12 }}>
                            {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) return (
        <div className="chart-card">
            <h3 className="chart-title">Approval vs Payment Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                <div className="spinner" />
            </div>
        </div>
    );

    return (
        <div className="chart-card">
            <h3 className="chart-title">Approval vs Payment Status</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#888' }} />
                        <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11, fill: '#888' }} width={60} />
                        <Tooltip content={<CustomTooltip />} />
                        {paymentKeys.length > 0 ? (
                            paymentKeys.map((key, i) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    stackId="a"
                                    fill={COLORS[i % COLORS.length]}
                                    radius={i === paymentKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                    isAnimationActive={true}
                                    animationDuration={1000}
                                />
                            ))
                        ) : (
                            <Bar
                                dataKey="amount"
                                fill="#0088FE"
                                radius={[4, 4, 0, 0]}
                                isAnimationActive={true}
                                animationDuration={1000}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {/* Custom legend — wraps labels instead of overflowing */}
            {paymentKeys.length > 0 && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
                    padding: '6px 12px 2px', justifyContent: 'center'
                }}>
                    {paymentKeys.map((key, i) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555' }}>
                            <span style={{
                                width: 10, height: 10, borderRadius: 2, flexShrink: 0,
                                background: COLORS[i % COLORS.length], display: 'inline-block'
                            }} />
                            <span style={{ whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }} title={key}>
                                {key}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApprovalStatusChart;
