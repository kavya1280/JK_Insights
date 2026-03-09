import React from 'react';

const Icons = {
    employee: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
    report: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /></svg>),
    currency: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12" /><path d="M6 8h12" /><path d="M6 12h5a4 4 0 0 0 0-8" /><path d="M10 12l6 8" /></svg>),
    stats: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>),
    target: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>)
};

const KPICards = ({ kpis }) => {
    if (!kpis) return null;

    const formatNumber = (num, type) => {
        if (type === 'currency') {
            if (num >= 1e6) return `₹${(num / 1e6).toFixed(1)}M`;
            if (num >= 1e4) return `₹${(num / 1e3).toFixed(1)}K`;
            return `₹${num.toLocaleString()}`;
        }
        if (type === 'decimal') return num.toFixed(6);
        return num.toLocaleString();
    };

    const cards = [
        { label: 'Unique Employee IDs', value: kpis.unique_employee_ids, type: 'number', icon: Icons.employee, color: '#6FAE2C' },
        { label: 'Unique Report IDs', value: kpis.unique_report_ids, type: 'number', icon: Icons.report, color: '#0B4F94' },
        { label: 'Total Report Total', value: kpis.total_report_total, type: 'currency', icon: Icons.currency, color: '#6FAE2C' },
        { label: 'Total Amt Approved', value: kpis.total_amount_approved, type: 'currency', icon: Icons.currency, color: '#0B4F94' },
        { label: 'Sample Size', value: kpis.sample_size, type: 'number', icon: Icons.stats, color: '#6FAE2C' },
        { label: 'Max MAD', value: kpis.max_mad, type: 'decimal', icon: Icons.target, color: '#0B4F94' },
        { label: 'Max P-Value', value: kpis.max_p_value, type: 'decimal', icon: Icons.target, color: '#0B4F94' }
    ];

    return (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
            {cards.map((card, i) => (
                <div key={card.label} className="kpi-card kpi-card-animate" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="kpi-icon-svg" style={{ color: card.color }}>{card.icon}</div>
                    <div className="kpi-label" style={{ fontWeight: 700 }}>{card.label}</div>
                    <div className="kpi-value" style={{ color: card.color, fontSize: card.type === 'decimal' ? '22px' : '28px' }}>{formatNumber(card.value, card.type)}</div>
                </div>
            ))}
        </div>
    );
};

export default KPICards;
