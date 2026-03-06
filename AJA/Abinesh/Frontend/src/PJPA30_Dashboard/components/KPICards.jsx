import React from 'react';

const Icons = {
    employee: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    currency: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h12M6 8h12M6 12h5a4 4 0 0 1 0 8H6M13 12l5 8M10 4v16" />
        </svg>
    ),
    report: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    calendarDays: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    ),
    weekend: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
    )
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
        if (type === 'percent') return `${val.toFixed(1)}%`;
        if (type === 'decimal') return val.toFixed(1);
        if (val >= 10000) return `${(val / 1000).toFixed(1)}K`;
        return val.toLocaleString('en-IN');
    };

    const cards = [
        { label: 'Employee', value: kpis.employeeCount, type: 'number', icon: Icons.employee, color: '#0B4F94' },
        { label: 'Total Spend', value: kpis.totalSpend, type: 'currency', icon: Icons.currency, color: '#6FAE2C' },
        { label: 'Trip Count', value: kpis.tripCount, type: 'number', icon: Icons.report, color: '#0B4F94' },
        { label: 'Avg Trip Cost', value: kpis.avgTripCost, type: 'currency', icon: Icons.currency, color: '#6FAE2C' },
        { label: 'Weekday Trips %', value: kpis.weekdayPct, type: 'percent', icon: Icons.calendarDays, color: '#0B4F94' },
        { label: 'Weekend Trips %', value: kpis.weekendPct, type: 'percent', icon: Icons.calendarDays, color: '#FF7043' },
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
