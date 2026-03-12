import React, { useMemo, useState, useRef } from 'react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import './PJPA36Dashboard.css';

// Import logos to match project structure
import logo from "./assets/images/jkc.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";

const Icons = {
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  missing: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  screenshot: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
};

const Header = ({ insightName }) => (
  <header className="header" style={{ position: 'relative', zIndex: 1000 }}>
    <div className="header-left">
      <img src={ajalabsblack} alt="Aja Labs" className="header-logo" />
    </div>
    <div className="header-center">
      <div className="header-title-wrapper">
        <div className="header-title-accent" />
        <div>
          <div className="header-subtitle">PJPA36 · Date Gap Analysis</div>
          <h1 className="header-title">{insightName}</h1>
        </div>
      </div>
    </div>
    <div className="header-right">
      <div className="jk-logo-badge">
        <img src={logo} alt="JK Cement" className="jk-logo-img" />
      </div>
    </div>
  </header>
);

const PJPA36Dashboard = ({ data, insightName }) => {
  const summary = data?.Summary || [];
  const dailyStatus = data?.Daily_Status || [];
  const missingList = data?.Missing_Dates_List || [];

  const [selectedMonth, setSelectedMonth] = useState('All');
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const total = summary.find(s => s.Metric === 'Total Dates')?.Value || 0;
    const missing = summary.find(s => s.Metric === 'Missing Dates')?.Value || 0;
    const available = total - missing;
    return { total, missing, available };
  }, [summary]);

  const months = useMemo(() => {
    const uniqueMonths = new Set();
    dailyStatus.forEach(d => {
      const date = new Date(d.Date);
      if (!isNaN(date)) {
        uniqueMonths.add(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
      }
    });
    return ['All', ...Array.from(uniqueMonths)];
  }, [dailyStatus]);

  const filteredDailyStatus = useMemo(() => {
    if (selectedMonth === 'All') return dailyStatus;
    return dailyStatus.filter(d => {
      const date = new Date(d.Date);
      return !isNaN(date) && date.toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth;
    });
  }, [dailyStatus, selectedMonth]);

  const filteredTableData = useMemo(() => {
    return dailyStatus.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [dailyStatus, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTableData.slice(start, start + pageSize);
  }, [filteredTableData, currentPage, pageSize]);

  const pieData = [
    { name: 'Available', value: stats.available },
    { name: 'Missing', value: stats.missing }
  ];

  const handleExportCSV = () => {
    if (!dailyStatus || dailyStatus.length === 0) return;
    const headers = ["Available_Count", "Date", "Missing_Count", "Status"];
    const csvRows = [headers.join(',')];
  
    for (const row of dailyStatus) {
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
    a.setAttribute('download', `PJPA36_Daily_Status_Export.csv`);
    a.click();
  };

  const handleScreenshot = async () => {
    try {
      const canvas = await html2canvas(document.querySelector('.pjpa36-dashboard'), { useCORS: true, scale: 2 });
      const link = document.createElement('a');
      link.download = `PJPA36_Dashboard_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { window.print(); }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="tooltip-value" style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pjpa36-dashboard">
      <div className="abstract-background">
        <svg viewBox="0 0 1440 1024" fill="none" preserveAspectRatio="none">
          <path d="M0 0H1440V1024H0V0Z" fill="#F4F6F8" />
          <path d="M-100 200C150 400 450 -100 800 150C1150 400 1300 200 1500 350V-100H-100V200Z" fill="#6FAE2C" opacity="0.07" />
          <path d="M1500 800C1100 1100 900 600 500 800C100 1000 -50 900 -200 850V1200H1500V800Z" fill="#0B4F94" opacity="0.06" />
        </svg>
      </div>

      <Header insightName={insightName} />

      <div className="dashboard-content">
        {/* KPI CARDS */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon-svg" style={{ color: '#0B4F94' }}>{Icons.calendar}</div>
            <div className="kpi-label">Total Dates</div>
            <div className="kpi-value" style={{ color: '#0B4F94' }}>{stats.total.toLocaleString()}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon-svg" style={{ color: '#ef4444' }}>{Icons.missing}</div>
            <div className="kpi-label">Missing Dates</div>
            <div className="kpi-value" style={{ color: '#ef4444' }}>{stats.missing.toLocaleString()}</div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filters-section">
          <div className="filters-header">
            <div className="filters-heading">Dashboard Filters</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="screenshot-btn" onClick={handleScreenshot}>{Icons.screenshot}</button>
              <button className="reset-button" onClick={() => setSelectedMonth('All')}>Reset</button>
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Filter by Month</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1.5px solid #E5E7EB', width: '200px' }}
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* CHARTS */}
        <div className="chart-row">
          <div className="chart-card">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Report Dates Trend</h3></div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredDailyStatus}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2FAE5" />
                  <XAxis dataKey="Date" tick={{ fontSize: 10 }} stroke="#9E9E9E" minTickGap={30} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Available_Count" name="Available" stroke="#6FAE2C" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Missing vs Available</h3></div>
            <div className="chart-container" style={{ display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius="50%" outerRadius="80%" paddingAngle={5} dataKey="value">
                    <Cell fill="#6FAE2C" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="chart-card" style={{ marginTop: '24px' }}>
          <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Missing Date Gaps</h3></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredDailyStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2FAE5" />
                <XAxis dataKey="Date" tick={{ fontSize: 10 }} stroke="#9E9E9E" minTickGap={30} />
                <YAxis tick={{ fontSize: 10 }} stroke="#9E9E9E" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Missing_Count" name="Missing" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="data-table-card">
          <div className="table-header-row">
            <h3 className="chart-title">Missing Dates Details</h3>
            <button onClick={handleExportCSV} className="reset-button" style={{ background: '#05192d' }}>Export CSV</button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #E0E0E0', borderRadius: 8, padding: '0 12px' }}>
              {Icons.search}
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', padding: '10px', fontSize: '14px' }} />
            </div>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="pg-btn">
              {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n} rows</option>)}
            </select>
          </div>
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Available_Count</th>
                  <th>Date</th>
                  <th>Missing_Count</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? paginatedData.map((row, i) => (
                  <tr key={i}>
                    <td>{row.Available_Count}</td>
                    <td>{row.Date}</td>
                    <td>{row.Missing_Count}</td>
                    <td>{row.Status}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="100%" style={{ textAlign: 'center', padding: '20px' }}>No missing dates found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls">
            <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
            <span>Page {currentPage} of {Math.ceil(filteredTableData.length / pageSize) || 1}</span>
            <button className="pg-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredTableData.length / pageSize)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PJPA36Dashboard;
