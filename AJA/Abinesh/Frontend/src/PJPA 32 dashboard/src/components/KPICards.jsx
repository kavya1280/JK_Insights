import React from 'react';

// Clean SVG icons — no emoji, renders perfectly on all systems
const Icons = {
  employeeId: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  employee: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  reportId: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  expenseType: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  currency: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12M6 8h12M6 12h5a4 4 0 0 1 0 8H6M13 12l5 8M10 4v16" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
};

const KPICards = ({ kpis }) => {
  if (!kpis) return null;

  const stats = {
    distinctEmployeeIds: kpis?.distinct_employee_id || 0,
    distinctEmployees: kpis?.distinct_employee || 0,
    distinctReportIds: kpis?.distinct_report_id || 0,
    distinctExpenseTypes: kpis?.distinct_expense_type || 0,
    totalAmount: kpis?.total_approved_amount || 0,
    avgPerPerson: kpis?.avg_spend_per_person || 0
  };

  const formatNumber = (num, type) => {
    const val = Number(num) || 0;
    if (type === 'currency') {
      if (val >= 1000000) return `\u20B9${(val / 1000000).toFixed(1)}M`;
      if (val >= 10000) return `\u20B9${(val / 1000).toFixed(1)}K`;
      return `\u20B9${val.toLocaleString('en-IN')}`;
    }
    if (val >= 10000) return `${(val / 1000).toFixed(1)}K`;
    return val.toLocaleString('en-IN');
  };

  const cards = [
    { label: 'Employee ID', value: stats.distinctEmployeeIds, type: 'number', icon: Icons.employeeId, color: '#6FAE2C' },
    { label: 'Employee', value: stats.distinctEmployees, type: 'number', icon: Icons.employee, color: '#0B4F94' },
    { label: 'Report ID', value: stats.distinctReportIds, type: 'number', icon: Icons.reportId, color: '#6FAE2C' },
    { label: 'Expense Type', value: stats.distinctExpenseTypes, type: 'number', icon: Icons.expenseType, color: '#0B4F94' },
    { label: 'Total Approved Amount', value: stats.totalAmount, type: 'currency', icon: Icons.currency, color: '#6FAE2C' },
    { label: 'Avg Spend per Person', value: stats.avgPerPerson, type: 'currency', icon: Icons.chart, color: '#0B4F94' },
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
