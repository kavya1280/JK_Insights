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
        uniqueDepartments: kpis?.unique_departments || 0,
        uniqueCostCenters: kpis?.unique_cost_centers || 0
    };

    const formatNumber = (val) => {
        return val.toLocaleString('en-IN');
    };

    const cards = [
        { label: 'Total Ghost Employees', value: stats.totalGhostEmployees, icon: Icons.employee, color: '#EF5350' },
        { label: 'Unique Departments', value: stats.uniqueDepartments, icon: Icons.department, color: '#0B4F94' },
        { label: 'Unique Cost Centers', value: stats.uniqueCostCenters, icon: Icons.costCenter, color: '#6FAE2C' }
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
