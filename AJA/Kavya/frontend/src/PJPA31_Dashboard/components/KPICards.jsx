import React from 'react';

const Icons = {
    split: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
    ),
    currency: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h12M6 8h12M6 12h5a4 4 0 0 1 0 8H6M13 12l5 8M10 4v16" />
        </svg>
    ),
    percent: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle>
        </svg>
    ),
    max: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
    ),
    min: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
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
        { label: 'Splitting Count', value: kpis.splitCount, type: 'number', icon: Icons.split, color: '#0B4F94' },
        { label: 'Splitting Spend', value: kpis.splitSpend, type: 'currency', icon: Icons.currency, color: '#6FAE2C' },
        { label: 'Splitting % (By Count)', value: kpis.splitPctCount, type: 'percent', icon: Icons.percent, color: '#0B4F94' },
        { label: 'Splitting % (By Spend)', value: kpis.splitPctSpend, type: 'percent', icon: Icons.percent, color: '#FF7043' },
        { label: 'Max Split Count', value: kpis.maxSplit, type: 'number', icon: Icons.max, color: '#0B4F94' },
        { label: 'Min Split Count', value: kpis.minSplit, type: 'number', icon: Icons.min, color: '#6FAE2C' },
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
