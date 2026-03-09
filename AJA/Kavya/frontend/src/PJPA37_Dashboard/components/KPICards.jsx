import React from 'react';

const Icons = {
    employee: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
    status: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>),
    currency: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12M6 8h12M6 12h5a4 4 0 0 1 0 8H6M13 12l5 8M10 4v16" /></svg>),
    anomaly: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>)
};

const KPICards = ({ kpis }) => {
    if (!kpis) return null;

    const stats = {
        distinctEmployeeId: kpis?.distinct_employee_id || 0,
        countOfReportId: kpis?.count_of_report_id || 0,
        distinctClusterId: kpis?.distinct_cluster_id || 0,
        amountApproved: kpis?.amount_approved || 0,
        totalClaims: kpis?.total_claims || 0,
        anomalyRate: kpis?.anomaly_rate || 0,
        anomalySpend: kpis?.anomaly_spend || 0
    };

    const formatNumber = (num, type) => {
        const val = Number(num) || 0;
        if (type === 'currency') {
            if (val >= 10000000) return `\u20B9${(val / 10000000).toFixed(2)}Cr`;
            if (val >= 100000) return `\u20B9${(val / 100000).toFixed(2)}L`;
            if (val >= 1000) return `\u20B9${(val / 1000).toFixed(1)}K`;
            return `\u20B9${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        }
        if (type === 'percent') return `${val}%`;
        if (val >= 10000) return `${(val / 1000).toFixed(1)}K`;
        return val.toLocaleString('en-IN');
    };

    const cards = [
        { label: 'Employee ID', value: stats.distinctEmployeeId, type: 'number', icon: Icons.employee, color: '#6FAE2C' },
        { label: 'Report ID', value: stats.countOfReportId, type: 'number', icon: Icons.status, color: '#0B4F94' },
        { label: 'Cluster ID', value: stats.distinctClusterId, type: 'number', icon: Icons.status, color: '#6FAE2C' },
        { label: 'Amount Approved', value: stats.amountApproved, type: 'currency', icon: Icons.currency, color: '#0B4F94' },
        { label: 'Total Claims', value: stats.totalClaims, type: 'number', icon: Icons.status, color: '#6FAE2C' },
        { label: '% Anomaly Rate', value: stats.anomalyRate, type: 'percent', icon: Icons.anomaly, color: '#EF5350' },
        { label: 'Anomaly Spend', value: stats.anomalySpend, type: 'currency', icon: Icons.currency, color: '#EF5350' }
    ];

    return (
        <div className="kpi-grid">
            {cards.map((card, i) => (
                <div key={card.label} className="kpi-card kpi-card-animate" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="kpi-icon-svg" style={{ color: card.color }}>{card.icon}</div>
                    <div className="kpi-label" style={{ fontWeight: 700 }}>{card.label}</div>
                    <div className="kpi-value" style={{ color: card.color }}>{formatNumber(card.value, card.type)}</div>
                </div>
            ))}
        </div>
    );
};

export default KPICards;
