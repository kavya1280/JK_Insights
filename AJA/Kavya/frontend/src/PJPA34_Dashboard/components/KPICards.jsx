import React from 'react';

const Icons = {
    employeeId: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>),
    employee: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
    status: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>),
    currency: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12M6 8h12M6 12h5a4 4 0 0 1 0 8H6M13 12l5 8M10 4v16" /></svg>)
};

const KPICards = ({ kpis }) => {
    if (!kpis) return null;

    const stats = {
        distinctEmployeeId: kpis?.distinct_employee_id || 0,
        distinctReportId: kpis?.distinct_report_id || 0,
        totalSpend: kpis?.total_spend || 0,
        avgClaimValue: kpis?.avg_claim_value || 0,
        avgFrequency: kpis?.avg_frequency || 0,
        monthlyClaimCount: kpis?.monthly_claim_count || 0,
        monthlyTotalAmount: kpis?.monthly_total_amount || 0
    };

    const formatNumber = (num, type) => {
        const val = Number(num) || 0;
        if (type === 'currency') {
            if (val >= 10000000) return `\u20B9${(val / 10000000).toFixed(2)}Cr`;
            if (val >= 100000) return `\u20B9${(val / 100000).toFixed(2)}L`;
            if (val >= 1000) return `\u20B9${(val / 1000).toFixed(1)}K`;
            return `\u20B9${val.toLocaleString('en-IN')}`;
        }
        if (val >= 10000) return `${(val / 1000).toFixed(1)}K`;
        return val.toLocaleString('en-IN');
    };

    const cards = [
        { label: 'Employee ID', value: stats.distinctEmployeeId, type: 'number', icon: Icons.employeeId, color: '#6FAE2C' },
        { label: 'Report ID', value: stats.distinctReportId, type: 'number', icon: Icons.status, color: '#0B4F94' },
        { label: 'Total Spend', value: stats.totalSpend, type: 'currency', icon: Icons.currency, color: '#6FAE2C' },
        { label: 'Avg Claim Value', value: stats.avgClaimValue, type: 'currency', icon: Icons.currency, color: '#0B4F94' },
        { label: 'Avg Frequency', value: stats.avgFrequency, type: 'number', icon: Icons.status, color: '#6FAE2C' },
        { label: 'Monthly Claim Count', value: stats.monthlyClaimCount, type: 'number', icon: Icons.status, color: '#0B4F94' },
        { label: 'Monthly Total Amount', value: stats.monthlyTotalAmount, type: 'currency', icon: Icons.currency, color: '#6FAE2C' }
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
