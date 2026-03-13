import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import './PJPA36Dashboard.css';

import logo from "./assets/images/jkc.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";

// ─── Inline SVG Icons (same as Dashboard.jsx) ────────────────────
const IconCalendar = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconWarning = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconChart = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const IconCamera = ({ isCapturing }) => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.3s ease', transform: isCapturing ? 'scale(0.85)' : 'scale(1)' }}
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ─── Styles (same as Dashboard.jsx) ──────────────────────────────
const styles = {
  wrapper: {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    background: '#f0f4f8',
    minHeight: '100vh',
    padding: '24px',
    boxSizing: 'border-box',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'white',
    padding: '20px 28px',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: '20px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '14px',
    marginBottom: '20px',
  },
  kpiCard: {
    background: 'white',
    borderRadius: '14px',
    padding: '18px 20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    border: '1px solid #f1f5f9',
  },
  filterBox: {
    background: 'white',
    padding: '20px 24px',
    borderRadius: '16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginBottom: '24px',
    border: '1px solid #f1f5f9',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
    marginTop: '14px',
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '18px',
    marginBottom: '18px',
  },
  chartCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '22px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
  },
  chartTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
  },
  chartAccent: {
    width: '4px',
    height: '20px',
    background: '#6FAE2C',
    borderRadius: '2px',
    flexShrink: 0,
  },
  chartTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '700',
    color: '#05192d',
  },
  select: {
    width: '100%',
    height: '40px',
    padding: '0 12px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '13px',
    background: '#f8fafc',
    outline: 'none',
    cursor: 'pointer',
    color: '#334155',
    appearance: 'auto',
  },
  label: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '700',
    display: 'block',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tableWrapper: {
    background: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
    marginTop: '20px',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: '1px solid #f1f5f9',
    background: '#f8fafc',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#05192d',
    color: 'white',
    border: 'none',
    padding: '9px 18px',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(5,25,45,0.2)',
  },
  resetBtn: {
    background: '#fef2f2',
    color: '#ef4444',
    border: '1px solid #fca5a5',
    padding: '7px 14px',
    borderRadius: '7px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  activeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#6FAE2C',
    display: 'inline-block',
    marginRight: '6px',
  },
};

// ─── Dashboard Component ─────────────────────────────────────────
const PJPA36Dashboard = ({ data, insightName }) => {
  const dashboardRef = useRef(null);
  const [screenshotState, setScreenshotState] = useState('idle');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const summary = data?.Summary || [];
  const dailyStatus = data?.Daily_Status || [];

  // ── Screenshot handler (same as Dashboard.jsx) ──────────────
  const handleScreenshot = useCallback(async () => {
    if (screenshotState !== 'idle') return;
    try {
      setScreenshotState('capturing');

      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      document.body.classList.add('is-taking-screenshot');
      await new Promise(r => setTimeout(r, 150));

      const canvas = await window.html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f0f4f8',
        scrollY: -window.scrollY,
        windowWidth: dashboardRef.current.scrollWidth,
        windowHeight: dashboardRef.current.scrollHeight,
      });

      document.body.classList.remove('is-taking-screenshot');

      setScreenshotState('flash');
      await new Promise(r => setTimeout(r, 480));

      const link = document.createElement('a');
      link.download = `PJPA36_${(insightName || 'Dashboard').replace(/[^a-zA-Z0-9]/g, '_')}_Screenshot.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setScreenshotState('done');
      setTimeout(() => setScreenshotState('idle'), 2000);
    } catch (err) {
      console.error('Screenshot failed:', err);
      document.body.classList.remove('is-taking-screenshot');
      setScreenshotState('idle');
    }
  }, [screenshotState, insightName]);

  // ── Data logic ───────────────────────────────────────────────
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
      if (!isNaN(date)) uniqueMonths.add(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
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

  const isFiltered = selectedMonth !== 'All' || !!searchTerm;

  const handleExportCSV = () => {
    if (!dailyStatus || dailyStatus.length === 0) return;
    const headers = ["Available_Count", "Date", "Missing_Count", "Status"];
    const csvRows = [headers.join(',')];
    for (const row of dailyStatus) {
      const values = headers.map(header => `"${('' + (row[header] || '')).replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'PJPA36_Daily_Status_Export.csv');
    a.click();
  };

  // ── Custom Tooltips (same dark style as Dashboard.jsx) ───────
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#05192d', color: 'white', padding: '10px 15px', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94a3b8' }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: p.color || '#6FAE2C' }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const kpiCards = [
    { label: 'Total Dates', value: stats.total.toLocaleString(), icon: <IconCalendar />, color: '#0B4F94' },
    { label: 'Missing Dates', value: stats.missing.toLocaleString(), icon: <IconWarning />, color: '#ef4444' },
    { label: 'Available Dates', value: stats.available.toLocaleString(), icon: <IconChart />, color: '#6FAE2C' },
  ];

  // ── Render ───────────────────────────────────────────────────
  return (
    <div ref={dashboardRef} style={styles.wrapper}>

      {/* ── SHUTTER FLASH OVERLAY ── */}
      {screenshotState === 'flash' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'white', opacity: 0.85, pointerEvents: 'none' }} />
      )}

      {/* ── HEADER (same structure as Dashboard.jsx) ── */}
      <div style={styles.header}>
        <div>
          <img src={ajalabsblack} alt="Aja Labs" style={{ height: '35px', objectFit: 'contain' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#6FAE2C', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              PJPA36 · Date Gap Analysis
            </div>
            <h2 style={{ margin: '5px 0 0 0', color: '#05192d', fontSize: '21px', fontWeight: '800' }}>{insightName}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isFiltered && (
            <div style={{ background: '#f2fae5', border: '1px solid #c3e88d', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', color: '#4a7a1e', fontWeight: '700' }}>
              <span style={styles.activeDot} />
              Filters Active
            </div>
          )}

          {/* ── SCREENSHOT BUTTON (same as Dashboard.jsx) ── */}
          <button
            onClick={handleScreenshot}
            disabled={screenshotState !== 'idle'}
            title="Capture full dashboard screenshot"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: screenshotState === 'done' ? '1.5px solid #6FAE2C'
                : screenshotState === 'capturing' ? '1.5px solid #05192d'
                  : '1.5px solid #e0e0e0',
              background: screenshotState === 'done' ? '#f2fae5'
                : screenshotState === 'capturing' ? '#05192d'
                  : 'white',
              color: screenshotState === 'done' ? '#6FAE2C'
                : screenshotState === 'capturing' ? 'white'
                  : '#555',
              cursor: screenshotState !== 'idle' ? 'default' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.25s ease',
              boxShadow: screenshotState === 'capturing'
                ? '0 0 0 3px rgba(5,25,45,0.15)'
                : '0 2px 8px rgba(0,0,0,0.06)',
              minWidth: '130px',
            }}
          >
            <IconCamera isCapturing={screenshotState === 'capturing'} />
            <span>
              {screenshotState === 'capturing' ? 'Capturing…'
                : screenshotState === 'flash' ? 'Saving…'
                  : screenshotState === 'done' ? '✓ Saved!'
                    : 'Screenshot'}
            </span>
          </button>

          <img src={logo} alt="JK Cement" style={{ height: '44px', objectFit: 'contain' }} />
        </div>
      </div>

      {/* ── KPI GRID (same as Dashboard.jsx) ── */}
      <div style={styles.kpiGrid}>
        {kpiCards.map((card) => (
          <div key={card.label} style={styles.kpiCard}>
            <div style={{
              color: card.color,
              background: `${card.color}18`,
              width: '54px',
              height: '54px',
              borderRadius: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{card.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#05192d', lineHeight: 1 }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTERS (same as Dashboard.jsx) ── */}
      <div style={styles.filterBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconFilter />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#05192d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Dashboard Filters
            </span>
          </div>
          {isFiltered && (
            <button
              onClick={() => { setSelectedMonth('All'); setSearchTerm(''); setCurrentPage(1); }}
              style={styles.resetBtn}
            >
              ✕ Reset All Filters
            </button>
          )}
        </div>

        <div style={styles.filterGrid}>
          <div>
            <label style={styles.label}>Filter by Month</label>
            <select
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
              style={{
                ...styles.select,
                borderColor: selectedMonth !== 'All' ? '#3b82f6' : '#e2e8f0',
                background: selectedMonth !== 'All' ? '#eff6ff' : '#f8fafc',
              }}
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW 1 ── */}
      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitleRow}>
            <div style={styles.chartAccent} />
            <h3 style={styles.chartTitle}>Report Dates Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredDailyStatus} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="Date" stroke="#94a3b8" tick={{ fontSize: 10 }} minTickGap={30} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Available_Count" name="Available" stroke="#6FAE2C" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitleRow}>
            <div style={styles.chartAccent} />
            <h3 style={styles.chartTitle}>Missing vs Available</h3>
          </div>
          <div style={{ display: 'flex', height: '300px', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius="45%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    <Cell fill="#6FAE2C" stroke="white" strokeWidth={2} />
                    <Cell fill="#0B4F94" stroke="white" strokeWidth={2} />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ width: '150px', paddingRight: '10px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coverage</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#05192d', marginBottom: '14px' }}>
                {stats.total > 0 ? `${((stats.available / stats.total) * 100).toFixed(1)}%` : '—'}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                {pieData.map((item, i) => (
                  <li key={item.name} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '11px', color: '#334155' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: i === 0 ? '#6FAE2C' : '#0B4F94', marginRight: '8px', flexShrink: 0 }} />
                    <span>{item.name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: '700', color: '#05192d' }}>{item.value.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHART: Missing Date Gaps ── */}
      <div style={{ ...styles.chartCard, marginBottom: '18px' }}>
        <div style={styles.chartTitleRow}>
          <div style={styles.chartAccent} />
          <h3 style={styles.chartTitle}>Missing Date Gaps</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredDailyStatus} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="Date" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" minTickGap={20} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="Missing_Count" name="Missing" fill="#0B4F94" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── DATA TABLE (same as Dashboard.jsx) ── */}
      <div style={styles.tableWrapper}>

        {/* Table header row */}
        <div style={styles.tableHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.chartAccent} />
            <h3 style={styles.chartTitle}>Missing Dates Details</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {filteredTableData.length} Records
            </span>
            <button onClick={handleExportCSV} style={styles.exportBtn}>
              <IconDownload /> Export CSV
            </button>
          </div>
        </div>

        {/* Table search bar */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', background: '#fafcff', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            flex: 1, maxWidth: '420px',
            background: 'white',
            border: searchTerm ? '1.5px solid #6FAE2C' : '1.5px solid #e2e8f0',
            borderRadius: '9px', padding: '0 14px', height: '38px',
            boxShadow: searchTerm ? '0 0 0 3px rgba(111,174,44,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            <IconSearch />
            <input
              type="text"
              placeholder="Search within table…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#334155', width: '100%', padding: '0 4px' }}
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', padding: 0, lineHeight: 1, flexShrink: 0 }}
              >×</button>
            )}
          </div>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
          >
            {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n} rows</option>)}
          </select>
        </div>

        {/* Table body */}
        <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#05192d', zIndex: 1 }}>
              <tr>
                {['Available_Count', 'Date', 'Missing_Count', 'Status'].map(key => (
                  <th key={key} style={{ padding: '13px 16px', color: 'white', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', borderBottom: '2px solid #6FAE2C' }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? paginatedData.map((row, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}
                  onMouseOver={e => e.currentTarget.style.background = '#f2fae5'}
                  onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f8fafc'}
                >
                  <td style={{ padding: '11px 16px', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' }}>{row.Available_Count}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' }}>{row.Date}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' }}>{row.Missing_Count}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      background: row.Status === 'Missing' ? '#fef2f2' : '#f0fdf4',
                      color: row.Status === 'Missing' ? '#ef4444' : '#16a34a',
                      border: `1px solid ${row.Status === 'Missing' ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      {row.Status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '13px', color: '#64748b' }}>
          <span>{filteredTableData.length} total records</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>← Prev</button>
            <span style={{ fontWeight: '600', color: '#05192d' }}>Page {currentPage} of {Math.ceil(filteredTableData.length / pageSize) || 1}</span>
            <button className="pg-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredTableData.length / pageSize)}>Next →</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PJPA36Dashboard;
