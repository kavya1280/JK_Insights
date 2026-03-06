import React from 'react';

const Icons = {
    employeeId: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
        </svg>
    ),
    report: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    department: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    currency: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h12M6 8h12M6 12h5a4 4 0 0 1 0 8H6M13 12l5 8M10 4v16" />
        </svg>
    ),
    days: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    ),
    alert: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    ),
};

const KPICards = ({ kpis }) => {
    if (!kpis) return null;

    const formatNumber = (num, type) => {
        const val = Number(num) || 0;
        if (type === 'currency') {
            if (val >= 1000000) return `\u20B9${(val / 1000000).toFixed(1)}M`;
            if (val >= 1000) return `\u20B9${(val / 1000).toFixed(1)}K`;
            return `\u20B9${val.toLocaleString('en-IN')}`;
        }
        if (type === 'decimal') return val.toFixed(1);
        if (val >= 10000) return `${(val / 1000).toFixed(1)}K`;
        return val.toLocaleString('en-IN');
    };

    const cards = [
        { label: 'Employee ID', value: kpis.distinctEmployeeIds, type: 'number', icon: Icons.employeeId, color: '#6FAE2C' },
        { label: 'Report', value: kpis.countReports, type: 'number', icon: Icons.report, color: '#0B4F94' },
        { label: 'Department', value: kpis.distinctDepartments, type: 'number', icon: Icons.department, color: '#6FAE2C' },
        { label: 'Total Amount Approved', value: kpis.totalAmount, type: 'currency', icon: Icons.currency, color: '#0B4F94' },
        { label: 'Avg Days to Claim', value: kpis.avgClaimDuration, type: 'decimal', icon: Icons.days, color: '#6FAE2C' },
        { label: 'High/Critical Claims', value: kpis.highCriticalClaims, type: 'number', icon: Icons.alert, color: '#E53935' },
    ];

    return (
        <div className="kpi-grid">
            {cards.map((card, i) => (
                <div
                    key={card.label}
                    className="kpi-card kpi-card-animate"
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    <div className="kpi-icon-svg" style={{ color: card.color }}>
                        {card.icon}
                    </div>
                    <div className="kpi-label" style={{ fontWeight: 700 }}>{card.label}</div>
                    <div className="kpi-value" style={{ color: card.color }}>{formatNumber(card.value, card.type)}</div>
                </div>
            ))}
        </div>
    );
};

export default KPICards;
