import React, { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const APP_COLORS = [
  '#6FAE2C', '#0B4F94', '#8FC44A', '#1565C0', '#A8D45A',
  '#2196F3', '#4A7A1E', '#1976D2', '#C2E08F', '#64B5F6',
  '#7DC030', '#0D47A1', '#A6A6A6', '#42A5F5', '#DCF0B2'
];

const RS = '\u20B9';

const Icons = {
  employeeId: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
  employee: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  reportId: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  expenseType: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
  currency: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
};

const Dashboard = ({ data, onBackToTable, insightName, exceptionName }) => {

  const parsedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(row => {
      const amountRaw = row['Approved Amount'] || row['Amount Approved'] || row['Total Approved Amount'] || row['Kilometer Amount'] || row['Amount'] || 0;
      const amount = parseFloat(amountRaw) || 0;
      const employee = row['Employee'] || row['Employee Name'] || row['Employee ID'] || 'Unknown Employee';
      
      // Look for Holiday Name and Weekday specifically for PJPA32
      const category = row['Holiday Name'] || row['Weekday'] || row['Expense Type'] || row['Expense Type Clean'] || row['Travel Combination'] || row['Person Band'] || row['To Location'] || 'General';
      const date = row['Transaction Date'] || row['Report Date'] || row['Submit Date'] || row['Separation Date'] || 'Unknown Date';
      const reportId = row['Report ID'] || row['Report Id'] || 'Unknown Report';
      
      let dayOfWeek = 'Unknown';
      if (date !== 'Unknown Date') {
        const d = new Date(date);
        if (!isNaN(d)) dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      }

      return { ...row, _amount: amount, _employee: employee, _category: category, _date: date, _reportId: reportId, _dayOfWeek: dayOfWeek };
    });
  }, [data]);

  const stats = useMemo(() => {
    if (parsedData.length === 0) return {};
    
    const totalExceptions = parsedData.length;
    const distinctEmployees = new Set(parsedData.map(d => d._employee)).size;
    const distinctCategories = new Set(parsedData.map(d => d._category)).size;
    const totalAmount = parsedData.reduce((sum, d) => sum + d._amount, 0);
    
    const avgPerException = totalExceptions > 0 ? totalAmount / totalExceptions : 0;
    const avgPerPerson = distinctEmployees > 0 ? totalAmount / distinctEmployees : 0;

    return { totalExceptions, distinctEmployees, distinctCategories, totalAmount, avgPerException, avgPerPerson };
  }, [parsedData]);

  const aggregateBy = (keyGetter, valGetter = (d) => d._amount) => {
    const acc = {};
    parsedData.forEach(row => {
      const k = keyGetter(row);
      acc[k] = (acc[k] || 0) + valGetter(row);
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value }));
  };

  const byEmployee = useMemo(() => aggregateBy(d => d._employee).sort((a, b) => b.value - a.value).slice(0, 10), [parsedData]); 
  const byCategory = useMemo(() => aggregateBy(d => d._category).sort((a, b) => b.value - a.value), [parsedData]);
  const freqByCategory = useMemo(() => aggregateBy(d => d._category, () => 1).sort((a, b) => b.value - a.value).slice(0, 8), [parsedData]);
  const byReportId = useMemo(() => aggregateBy(d => d._reportId).sort((a, b) => b.value - a.value).slice(0, 10), [parsedData]);
  
  const byDayOfWeek = useMemo(() => {
    const daysOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7, 'Unknown': 8 };
    return aggregateBy(d => d._dayOfWeek).sort((a, b) => (daysOrder[a.name] || 99) - (daysOrder[b.name] || 99));
  }, [parsedData]);

  const byDate = useMemo(() => {
    return aggregateBy(d => d._date)
      .filter(d => d.name !== 'Unknown Date' && d.name !== 'NaT' && d.name !== 'NaN')
      .sort((a, b) => new Date(a.name) - new Date(b.name));
  }, [parsedData]);

  const formatVal = (val) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const fmtCurrency = (v) => {
    if (v >= 1000000) return `${RS}${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${RS}${(v / 1000).toFixed(1)}K`;
    return `${RS}${v.toFixed(0)}`;
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).filter(k => !k.startsWith('_'));
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val || '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    const downloadName = exceptionName ? `${insightName} - ${exceptionName}` : insightName;
    a.setAttribute('download', `${downloadName.replace(/[^a-zA-Z0-9]/g, '_')}_Export.csv`);
    a.click();
  };

  const CustomAmtTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ background: '#05192d', color: 'white', padding: '10px 15px', borderRadius: '8px', border: 'none' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#94a3b8' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#00df81' }}>{RS}{payload[0].value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
      );
    }
    return null;
  };

  const CustomCountTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ background: '#05192d', color: 'white', padding: '10px 15px', borderRadius: '8px', border: 'none' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#94a3b8' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>{payload[0].value.toLocaleString()} Exceptions</p>
        </div>
      );
    }
    return null;
  };

  if (!parsedData || parsedData.length === 0) {
    return (
      <div className="animate-in" style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <h2 style={{ color: '#05192d', marginBottom: '10px' }}>
            {exceptionName ? `${insightName} - ${exceptionName}` : insightName}
        </h2>
        <div style={{ padding: '60px', color: '#64748b' }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🛡️</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#05192d' }}>No Exceptions Found</h3>
          <p>This control module ran successfully but found zero policy violations in the provided dataset.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content animate-in" style={{ padding: 0 }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px 30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00df81', textTransform: 'uppercase', letterSpacing: '1px' }}>Executive Summary</span>
          <h2 style={{ margin: '5px 0 0 0', color: '#05192d', fontSize: '22px' }}>
            {exceptionName ? `${insightName} - ${exceptionName}` : insightName}
          </h2>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        {[
          { label: 'Total Exceptions', value: stats.totalExceptions.toLocaleString(), icon: Icons.reportId, color: '#ef4444' },
          { label: 'Unique Employees', value: stats.distinctEmployees.toLocaleString(), icon: Icons.employee, color: '#f59e0b' },
          { label: 'Risk Categories', value: stats.distinctCategories.toLocaleString(), icon: Icons.expenseType, color: '#3b82f6' },
          { label: 'Total Risk Value', value: `₹${formatVal(stats.totalAmount)}`, icon: Icons.currency, color: '#00df81' },
          { label: 'Avg per Exception', value: `₹${formatVal(stats.avgPerException)}`, icon: Icons.chart, color: '#8b5cf6' },
          { label: 'Avg per Employee', value: `₹${formatVal(stats.avgPerPerson)}`, icon: Icons.employeeId, color: '#0B4F94' },
        ].map((card, i) => (
          <div key={card.label} className="kpi-card kpi-card-animate" style={{ animationDelay: `${i * 80}ms`, padding: '20px' }}>
            <div className="kpi-header" style={{ marginBottom: '10px' }}>
              <div className="kpi-icon" style={{ color: card.color, background: `${card.color}15`, padding: '8px', borderRadius: '8px' }}>
                {card.icon}
              </div>
            </div>
            <div className="kpi-body">
              <div className="kpi-value" style={{ fontSize: '24px', fontWeight: '900', color: '#05192d' }}>{card.value}</div>
              <div className="kpi-label" style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginTop: '4px' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid chart-row">
        <div className="chart-card chart-animate">
          <div className="chart-title-row">
            <div className="chart-title-accent" />
            <h3 className="chart-title">Top 10 Employees by Risk Value</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byEmployee} layout="vertical" margin={{ top: 10, right: 20, left: 60, bottom: 5 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" stroke="#05192d" tick={{ fontSize: 11, fontWeight: '600' }} width={80} />
                <Tooltip content={<CustomAmtTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {byEmployee.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={APP_COLORS[index % APP_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card chart-animate" style={{ animationDelay: '100ms' }}>
          <div className="chart-title-row">
            <div className="chart-title-accent" />
            <h3 className="chart-title">Risk Value Distribution</h3>
          </div>
          <div className="donut-body" style={{ display: 'flex', height: '300px', alignItems: 'center' }}>
            <div className="donut-chart-wrapper" style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie data={byCategory.slice(0, 8)} cx="50%" cy="50%" innerRadius="45%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {byCategory.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={APP_COLORS[i % APP_COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomAmtTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="donut-right-legend" style={{ width: '140px', paddingRight: '15px' }}>
              <div className="donut-total-label" style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Total Risk</div>
              <div className="donut-total-value" style={{ fontSize: '20px', fontWeight: 'bold', color: '#05192d', marginBottom: '15px' }}>{fmtCurrency(stats.totalAmount)}</div>
              <ul className="donut-legend-list" style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                {byCategory.slice(0, 8).map((item, i) => (
                  <li key={item.name} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '11px', color: '#334155' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: APP_COLORS[i % APP_COLORS.length], marginRight: '8px', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid chart-row">
        <div className="chart-card chart-animate" style={{ animationDelay: '200ms' }}>
          <div className="chart-title-row">
            <div className="chart-title-accent" />
            <h3 className="chart-title">Exception Volume by Category</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqByCategory} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomCountTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card chart-animate" style={{ animationDelay: '300ms' }}>
          <div className="chart-title-row">
            <div className="chart-title-accent" />
            <h3 className="chart-title">Top 10 Highest Risk Reports</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byReportId} layout="vertical" margin={{ top: 10, right: 20, left: 60, bottom: 5 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" stroke="#05192d" tick={{ fontSize: 10, fontWeight: '500' }} width={90} />
                <Tooltip content={<CustomAmtTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-grid chart-row">
        <div className="chart-card chart-animate" style={{ animationDelay: '400ms' }}>
          <div className="chart-title-row">
            <div className="chart-title-accent" />
            <h3 className="chart-title">Risk Value by Day of Week</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDayOfWeek} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomAmtTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card chart-animate" style={{ animationDelay: '500ms' }}>
          <div className="chart-title-row">
            <div className="chart-title-accent" />
            <h3 className="chart-title">Chronological Risk Trend</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            {byDate.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={byDate} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00df81" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00df81" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} minTickGap={30} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomAmtTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#00df81" strokeWidth={3} fill="url(#greenGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Insufficient chronological data for trend line.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATA TABLE SECTION */}
      <div className="chart-card chart-animate" style={{ animationDelay: '600ms', padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div className="chart-title-row" style={{ margin: 0 }}>
            <div className="chart-title-accent" />
            <h3 className="chart-title" style={{ margin: 0 }}>
              {exceptionName ? `${insightName} - ${exceptionName}` : insightName}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {data.length} Records
            </span>
            <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#05192d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(5,25,45,0.2)', fontSize: '13px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export CSV
            </button>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#05192d', zIndex: 1 }}>
              <tr>
                {Object.keys(data[0]).filter(k => !k.startsWith('_')).map(key => (
                  <th key={key} style={{ padding: '14px 16px', color: 'white', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', borderBottom: '2px solid #00df81' }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f0fff4'} onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f8fafc'}>
                  {Object.keys(row).filter(k => !k.startsWith('_')).map((key, j) => (
                    <td key={j} style={{ padding: '12px 16px', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' }}>
                      {String(row[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;