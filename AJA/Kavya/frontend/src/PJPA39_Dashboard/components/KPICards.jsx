import React from 'react';

const Icons = {
    employee: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
    department: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>),
    costCenter: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>)
};

const KPICards = ({ kpis }) => {
    if (!kpis) return null;

    const stats = {
        totalGhostEmployees: kpis?.total_ghost_employees || 0,
        avgDaysOverdue: kpis?.avg_days_overdue || 0,
        noticePeriodCount: kpis?.notice_period_count || 0,
        uniqueLocations: kpis?.unique_locations || 0,
        uniqueDepartments: kpis?.unique_departments || 0
    };

    const formatNumber = (val) => {
        return val.toLocaleString('en-IN');
    };

    const cards = [
        { label: 'Employee ID', value: stats.totalGhostEmployees, icon: Icons.employee, color: '#EF5350' },
        { label: 'Avg Days Overdue', value: stats.avgDaysOverdue, icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>), color: '#FF9800' },
        { label: 'Notice Period Count', value: stats.noticePeriodCount, icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>), color: '#9C27B0' },
        { label: 'Location', value: stats.uniqueLocations, icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>), color: '#6FAE2C' },
        { label: 'Department', value: stats.uniqueDepartments, icon: Icons.department, color: '#0B4F94' }
    ];

    return (
        <div className="kpi-grid">
            {cards.map((card, i) => (
                <div key={card.label} className="kpi-card kpi-card-animate" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="kpi-icon-svg" style={{ color: card.color }}>{card.icon}</div>
                    <div className="kpi-label" style={{ fontWeight: 700 }}>{card.label}</div>
                    <div className="kpi-value" style={{ color: card.color }}>{formatNumber(card.value)}</div>
                </div>
            ))}
        </div>
    );
};

export default KPICards;
