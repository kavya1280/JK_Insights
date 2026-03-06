import React from 'react';

const Icons = {
    employees: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    critical: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    high: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    currency: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h12" /><path d="M6 8h12" /><path d="M6 12h5a4 4 0 0 0 0-8" /><path d="M10 12l6 8" />
        </svg>
    ),
    chart: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
        </svg>
    )
};

const KPICards = ({ kpis }) => {
    if (!kpis) return null;

    const formatNumber = (num, type) => {
        if (type === 'currency') {
            if (num >= 1000000) return `₹${(num / 1000000).toFixed(1)}M`;
            if (num >= 10000) return `₹${(num / 1000).toFixed(1)}K`;
            return `₹${num.toLocaleString()}`;
        }
        return num.toLocaleString();
    };

    const cards = [
        { label: 'Total Employees', value: kpis.total_employees, type: 'number', icon: Icons.employees, color: '#6FAE2C' },
        { label: 'Critical Risk', value: kpis.critical_risk_count, type: 'number', icon: Icons.critical, color: '#0B4F94' },
        { label: 'High Risk', value: kpis.high_risk_count, type: 'number', icon: Icons.high, color: '#6FAE2C' },
        { label: 'Avg Spend/Person', value: kpis.avg_spend_per_person, type: 'currency', icon: Icons.chart, color: '#0B4F94' },
        { label: 'High Risk Spend', value: kpis.high_risk_spend, type: 'currency', icon: Icons.currency, color: '#6FAE2C' },
        { label: 'Critical Risk Spend', value: kpis.critical_risk_spend, type: 'currency', icon: Icons.currency, color: '#0B4F94' },
        { label: 'Total Approved', value: kpis.total_amount_approved, type: 'currency', icon: Icons.currency, color: '#6FAE2C' }
    ];

    return (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
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
