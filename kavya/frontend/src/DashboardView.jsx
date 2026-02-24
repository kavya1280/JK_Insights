import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const DashboardView = ({ data, onBack }) => {
    return (
        <div className="dashboard-root">
            <div className="dashboard-header">
                <button className="back-btn" onClick={onBack}>← Back to Uploader</button>
                <h2>PJPA39 Analysis Dashboard</h2>
            </div>

            {/* KPI Section */}
            <div className="kpi-grid">
                {data.kpis.map((kpi, i) => (
                    <div key={i} className="kpi-card">
                        <span className="kpi-label">{kpi.label}</span>
                        <span className="kpi-value">{kpi.value}</span>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {data.charts.map((chart) => (
                    <div key={chart.id} className="chart-container">
                        <h3>{chart.title}</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            {chart.type === 'line' ? (
                                <LineChart data={chart.data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke="#00df81" strokeWidth={3} />
                                </LineChart>
                            ) : (
                                <BarChart data={chart.data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#05192d" radius={[5, 5, 0, 0]} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardView;