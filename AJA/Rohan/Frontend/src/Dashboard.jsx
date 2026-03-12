import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

import logo from "./assets/images/jkc.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";


const APP_COLORS = [
  '#6FAE2C', '#0B4F94', '#8FC44A', '#1565C0', '#A8D45A',
  '#2196F3', '#4A7A1E', '#1976D2', '#C2E08F', '#64B5F6',
  '#7DC030', '#0D47A1', '#A6A6A6', '#42A5F5', '#DCF0B2'
];

const RS = '\u20B9';

// ─── Inline SVG Icons ────────────────────────────────────────────
const IconUser = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconFile = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconChart = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const IconMoney = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IconLayers = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);
const IconId = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M15 8h2M15 12h2M9 16h8" />
  </svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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

// ─── Styles ──────────────────────────────────────────────────────
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
  input: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    width: '100%',
    padding: '0 10px',
    fontSize: '13px',
    color: '#334155',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0 12px',
    height: '40px',
    transition: 'border-color 0.2s',
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
  emptyState: {
    padding: '60px',
    textAlign: 'center',
    color: '#94a3b8',
    background: 'white',
    borderRadius: '16px',
    border: '1px dashed #cbd5e1',
    marginTop: '10px',
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
const Dashboard = ({ data, onBackToTable, insightName, exceptionName, dataType }) => {

  if (dataType === 'Context') {
    return null;
  }
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState('All');
  const [selectedReportId, setSelectedReportId] = useState('All');
  // 'idle' | 'capturing' | 'flash' | 'done'
  const [screenshotState, setScreenshotState] = useState('idle');
  const [tableSearch, setTableSearch] = useState('');
  const dashboardRef = useRef(null);

  // ── Data Parsing ────────────────────────────────────────────────
  const parsedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(row => {
      const amountRaw =
        row['Approved Amount'] || row['Amount Approved'] ||
        row['Total Approved Amount'] || row['Kilometer Amount'] ||
        row['Amount'] || 0;
      const amount = parseFloat(amountRaw) || 0;
      const employee = row['Employee'] || row['Employee Name'] || row['Employee ID'] || 'Unknown Employee';

      let rawCategory =
        row['Expense Type Clean'] || row['Expense Type'] ||
        row['Policy'] || row['Expense Category'] || row['Travel Combination'];
      if (!rawCategory ||
        String(rawCategory).trim().toUpperCase() === 'NA' ||
        String(rawCategory).trim().toUpperCase() === 'NAN') {
        rawCategory = 'General Policy';
      }
      const category = String(rawCategory);
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

  // ── Dropdown Options ────────────────────────────────────────────
  const uniqueCategories = useMemo(() => ['All', ...new Set(parsedData.map(d => String(d._category)))].sort(), [parsedData]);
  const uniqueEmployees = useMemo(() => ['All', ...new Set(parsedData.map(d => String(d._employee)))].sort(), [parsedData]);
  const uniqueReportIds = useMemo(() => ['All', ...new Set(parsedData.map(d => String(d._reportId)))].sort(), [parsedData]);

  const isFiltered = searchTerm || selectedEmployee !== 'All' || selectedCategory !== 'All' || selectedReportId !== 'All';

  // ── Filtered Data ───────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return parsedData.filter(row => {
      const matchesSearch = !searchTerm || Object.values(row).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || String(row._category) === selectedCategory;
      const matchesEmployee = selectedEmployee === 'All' || String(row._employee) === selectedEmployee;
      const matchesReport = selectedReportId === 'All' || String(row._reportId) === selectedReportId;
      return matchesSearch && matchesCategory && matchesEmployee && matchesReport;
    });
  }, [parsedData, searchTerm, selectedCategory, selectedEmployee, selectedReportId]);

  // ── Stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (filteredData.length === 0) return { totalExceptions: 0, distinctEmployees: 0, distinctCategories: 0, totalAmount: 0, avgPerException: 0, avgPerPerson: 0 };
    const totalExceptions = filteredData.length;
    const distinctEmployees = new Set(filteredData.map(d => d._employee)).size;
    const distinctCategories = new Set(filteredData.map(d => d._category)).size;
    const totalAmount = filteredData.reduce((sum, d) => sum + d._amount, 0);
    return {
      totalExceptions,
      distinctEmployees,
      distinctCategories,
      totalAmount,
      avgPerException: totalExceptions > 0 ? totalAmount / totalExceptions : 0,
      avgPerPerson: distinctEmployees > 0 ? totalAmount / distinctEmployees : 0,
    };
  }, [filteredData]);

  // ── Chart Aggregations ──────────────────────────────────────────
  const aggregateBy = (keyGetter, valGetter = (d) => d._amount) => {
    const acc = {};
    filteredData.forEach(row => {
      const k = keyGetter(row);
      acc[k] = (acc[k] || 0) + valGetter(row);
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value }));
  };

  const byEmployee = useMemo(() => aggregateBy(d => d._employee).sort((a, b) => b.value - a.value).slice(0, 10), [filteredData]);
  const byCategory = useMemo(() => aggregateBy(d => d._category).sort((a, b) => b.value - a.value), [filteredData]);
  const freqByCategory = useMemo(() => aggregateBy(d => d._category, () => 1).sort((a, b) => b.value - a.value).slice(0, 8), [filteredData]);
  const byReportId = useMemo(() => aggregateBy(d => d._reportId).sort((a, b) => b.value - a.value).slice(0, 10), [filteredData]);
  const byDayOfWeek = useMemo(() => {
    const daysOrder = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7, Unknown: 8 };
    return aggregateBy(d => d._dayOfWeek).sort((a, b) => (daysOrder[a.name] || 99) - (daysOrder[b.name] || 99));
  }, [filteredData]);
  const byDate = useMemo(() => {
    return aggregateBy(d => d._date)
      .filter(d => d.name !== 'Unknown Date' && d.name !== 'NaT' && d.name !== 'NaN')
      .sort((a, b) => new Date(a.name) - new Date(b.name));
  }, [filteredData]);

  // ── Formatters ──────────────────────────────────────────────────
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

  // ── Export CSV ──────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) return;
    const headers = Object.keys(filteredData[0]).filter(k => !k.startsWith('_'));
    const csvRows = [headers.join(',')];
    for (const row of filteredData) {
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
    const downloadName = exceptionName ? `${insightName} - ${exceptionName}` : insightName || 'Export';
    a.setAttribute('href', url);
    a.setAttribute('download', `${downloadName.replace(/[^a-zA-Z0-9]/g, '_')}_Export.csv`);
    a.click();
  };

  // ── Screenshot ──────────────────────────────────────────────────
  const handleScreenshot = useCallback(async () => {
    if (screenshotState !== 'idle') return;
    try {
      setScreenshotState('capturing');

      // Dynamically load html2canvas from CDN if not already loaded
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Freeze animations for a clean capture
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

      // Trigger shutter flash
      setScreenshotState('flash');
      await new Promise(r => setTimeout(r, 480));

      // Trigger download
      const link = document.createElement('a');
      const downloadName = exceptionName ? `${insightName} - ${exceptionName}` : insightName || 'Dashboard';
      link.download = `${downloadName.replace(/[^a-zA-Z0-9]/g, '_')}_Screenshot.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setScreenshotState('done');
      setTimeout(() => setScreenshotState('idle'), 2000);
    } catch (err) {
      console.error('Screenshot failed:', err);
      document.body.classList.remove('is-taking-screenshot');
      setScreenshotState('idle');
    }
  }, [screenshotState, insightName, exceptionName]);

  // ── Custom Tooltips ─────────────────────────────────────────────
  const CustomAmtTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#05192d', color: 'white', padding: '10px 15px', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94a3b8' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#6FAE2C' }}>
            {RS}{payload[0].value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomCountTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#05192d', color: 'white', padding: '10px 15px', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94a3b8' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#3b82f6' }}>
            {payload[0].value.toLocaleString()} Exceptions
          </p>
        </div>
      );
    }
    return null;
  };

  const title = exceptionName ? `${insightName} - ${exceptionName}` : insightName || 'Dashboard';

  if (title.toLowerCase().includes('context')) {
    return null;
  }

  // ── Empty State ─────────────────────────────────────────────────
  if (!parsedData || parsedData.length === 0) {
    return (
      <div style={styles.wrapper}>
        <div style={{ background: 'white', padding: '60px', borderRadius: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🛡️</div>
          <h2 style={{ color: '#05192d', marginBottom: '10px' }}>{title}</h2>
          <h3 style={{ color: '#05192d', margin: '0 0 10px 0' }}>No Exceptions Found</h3>
          <p style={{ color: '#64748b' }}>This control module ran successfully but found zero policy violations.</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    { label: 'Filtered Exceptions', value: stats.totalExceptions.toLocaleString(), icon: <IconFile />, color: '#ef4444' },
    { label: 'Unique Employees', value: stats.distinctEmployees.toLocaleString(), icon: <IconUser />, color: '#f59e0b' },
    { label: 'Risk Categories', value: stats.distinctCategories.toLocaleString(), icon: <IconLayers />, color: '#3b82f6' },
    { label: 'Filtered Risk Value', value: `${RS}${formatVal(stats.totalAmount)}`, icon: <IconMoney />, color: '#6FAE2C' },
    { label: 'Avg per Exception', value: `${RS}${formatVal(stats.avgPerException)}`, icon: <IconChart />, color: '#8b5cf6' },
    { label: 'Avg per Employee', value: `${RS}${formatVal(stats.avgPerPerson)}`, icon: <IconId />, color: '#0B4F94' },
  ];

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div ref={dashboardRef} style={styles.wrapper}>

      {/* ── SHUTTER FLASH OVERLAY ── */}
      {screenshotState === 'flash' && (
        <div className="screenshot-flash-overlay" />
      )}

      {/* ── HEADER ── */}
      <div style={styles.header}>
        <div>
          <img src={ajalabsblack} alt="Aja Labs" style={{ height: '35px', objectFit: 'contain' }} />
        </div>

        <div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#6FAE2C', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Executive Summary
          </span>
          <h2 style={{ margin: '5px 0 0 0', color: '#05192d', fontSize: '21px', fontWeight: '800' }}>{title}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isFiltered && (
            <div style={{ background: '#f2fae5', border: '1px solid #c3e88d', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', color: '#4a7a1e', fontWeight: '700' }}>
              <span style={styles.activeDot} />
              Filters Active — {filteredData.length} of {parsedData.length} records
            </div>
          )}

          {/* ── CAMERA / SCREENSHOT BUTTON ── */}
          <button
            onClick={handleScreenshot}
            disabled={screenshotState !== 'idle'}
            title="Capture full dashboard screenshot"
            className={[
              'screenshot-btn',
              screenshotState === 'capturing' ? 'screenshot-btn--capturing' : '',
              screenshotState === 'done' ? 'screenshot-btn--done' : '',
            ].join(' ').trim()}
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
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {screenshotState === 'capturing' && (
              <span className="screenshot-btn-ripple" />
            )}
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

      {/* ── KPI GRID ── */}
      <div style={styles.kpiGrid}>
        {kpiCards.map((card) => (
          <div key={card.label} style={styles.kpiCard}>
            <div style={{
              color: card.color, background: `${card.color}18`,
              width: '54px', height: '54px', borderRadius: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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

      {/* ── FILTERS ── */}
      <div style={styles.filterBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconFilter />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#05192d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Data Filters
            </span>
          </div>
          {isFiltered && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedEmployee('All'); setSelectedCategory('All'); setSelectedReportId('All'); }}
              style={styles.resetBtn}
            >
              ✕ Reset All Filters
            </button>
          )}
        </div>

        <div style={styles.filterGrid}>
          {/* Search */}
          <div>
            <label style={styles.label}>Search Any Keyword</label>
            <div style={styles.inputWrapper}>
              <IconSearch />
              <input
                type="text"
                placeholder="Search across all fields..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={styles.input}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', padding: 0, lineHeight: 1 }}>×</button>
              )}
            </div>
          </div>

          {/* Employee */}
          <div>
            <label style={styles.label}>Employee (ID or Name)</label>
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              style={{ ...styles.select, borderColor: selectedEmployee !== 'All' ? '#3b82f6' : '#e2e8f0', background: selectedEmployee !== 'All' ? '#eff6ff' : '#f8fafc' }}
            >
              {uniqueEmployees.map(emp => (
                <option key={emp} value={emp}>{emp === 'All' ? 'All Employees' : emp}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label style={styles.label}>Risk Category / Policy</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ ...styles.select, borderColor: selectedCategory !== 'All' ? '#f59e0b' : '#e2e8f0', background: selectedCategory !== 'All' ? '#fffbeb' : '#f8fafc' }}
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>

          {/* Report ID */}
          <div>
            <label style={styles.label}>Report / Document ID</label>
            <select
              value={selectedReportId}
              onChange={e => setSelectedReportId(e.target.value)}
              style={{ ...styles.select, borderColor: selectedReportId !== 'All' ? '#8b5cf6' : '#e2e8f0', background: selectedReportId !== 'All' ? '#f5f3ff' : '#f8fafc' }}
            >
              {uniqueReportIds.map(rep => (
                <option key={rep} value={rep}>{rep === 'All' ? 'All Reports' : rep}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter pills */}
        {isFiltered && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            {searchTerm && (
              <span style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>
              </span>
            )}
            {selectedEmployee !== 'All' && (
              <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Employee: {selectedEmployee}
                <button onClick={() => setSelectedEmployee('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span style={{ background: '#fffbeb', border: '1px solid #fed7aa', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>
              </span>
            )}
            {selectedReportId !== 'All' && (
              <span style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#5b21b6', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Report: {selectedReportId}
                <button onClick={() => setSelectedReportId('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5b21b6', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── CHARTS ── */}
      {filteredData.length > 0 ? (
        <>
          {/* Row 1: Employees + Donut */}
          <div style={styles.chartsRow}>
            <div style={styles.chartCard}>
              <div style={styles.chartTitleRow}>
                <div style={styles.chartAccent} />
                <h3 style={styles.chartTitle}>Top 10 Employees by Risk Value</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byEmployee} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" stroke="#05192d" tick={{ fontSize: 11, fontWeight: '600' }} width={80} />
                  <Tooltip content={<CustomAmtTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {byEmployee.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={APP_COLORS[index % APP_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.chartCard}>
              <div style={styles.chartTitleRow}>
                <div style={styles.chartAccent} />
                <h3 style={styles.chartTitle}>Risk Value Distribution</h3>
              </div>
              <div style={{ display: 'flex', height: '300px', alignItems: 'center' }}>
                <div style={{ flex: 1, height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCategory.slice(0, 8)} cx="50%" cy="50%" innerRadius="45%" outerRadius="80%" paddingAngle={2} dataKey="value">
                        {byCategory.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={APP_COLORS[i % APP_COLORS.length]} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomAmtTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: '150px', paddingRight: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Risk</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#05192d', marginBottom: '14px' }}>{fmtCurrency(stats.totalAmount)}</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
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

          {/* Row 2: Category Volume + Report IDs */}
          <div style={styles.chartsRow}>
            <div style={styles.chartCard}>
              <div style={styles.chartTitleRow}>
                <div style={styles.chartAccent} />
                <h3 style={styles.chartTitle}>Exception Volume by Category</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={freqByCategory} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomCountTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.chartCard}>
              <div style={styles.chartTitleRow}>
                <div style={styles.chartAccent} />
                <h3 style={styles.chartTitle}>Top 10 Highest Risk Reports</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byReportId} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" stroke="#05192d" tick={{ fontSize: 10, fontWeight: '500' }} width={90} />
                  <Tooltip content={<CustomAmtTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Day of Week + Trend */}
          <div style={styles.chartsRow}>
            <div style={styles.chartCard}>
              <div style={styles.chartTitleRow}>
                <div style={styles.chartAccent} />
                <h3 style={styles.chartTitle}>Risk Value by Day of Week</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={byDayOfWeek} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomAmtTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.chartCard}>
              <div style={styles.chartTitleRow}>
                <div style={styles.chartAccent} />
                <h3 style={styles.chartTitle}>Chronological Risk Trend</h3>
              </div>
              {byDate.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={byDate} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6FAE2C" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6FAE2C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} minTickGap={30} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomAmtTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#6FAE2C" strokeWidth={3} fill="url(#greenGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Insufficient chronological data for trend line.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>🔍</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#05192d' }}>No Matches Found</h3>
          <p>No records match your current filter combination. Try clearing some filters.</p>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      {(() => {
        // Table-level search: filter filteredData further by tableSearch
        const tableQuery = tableSearch.trim().toLowerCase();
        const tableRows = tableQuery
          ? filteredData.filter(row =>
            Object.entries(row)
              .filter(([k]) => !k.startsWith('_'))
              .some(([, v]) => String(v).toLowerCase().includes(tableQuery))
          )
          : filteredData;

        // Helper: highlight matching text in a cell value
        const highlight = (text) => {
          if (!tableQuery) return text;
          const str = String(text);
          const idx = str.toLowerCase().indexOf(tableQuery);
          if (idx === -1) return str;
          return (
            <>
              {str.slice(0, idx)}
              <mark style={{ background: '#fef08a', color: '#713f12', borderRadius: '3px', padding: '0 2px', fontWeight: '700' }}>
                {str.slice(idx, idx + tableQuery.length)}
              </mark>
              {str.slice(idx + tableQuery.length)}
            </>
          );
        };

        return (
          <div style={styles.tableWrapper}>
            {/* Table header row */}
            <div style={styles.tableHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.chartAccent} />
                <h3 style={styles.chartTitle}>Filtered Records</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {tableRows.length}{tableQuery ? ` of ${filteredData.length}` : ''} Records
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
                background: 'white', border: tableQuery ? '1.5px solid #6FAE2C' : '1.5px solid #e2e8f0',
                borderRadius: '9px', padding: '0 14px', height: '38px',
                boxShadow: tableQuery ? '0 0 0 3px rgba(111,174,44,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}>
                <IconSearch />
                <input
                  type="text"
                  placeholder="Search within table…"
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#334155', width: '100%', padding: '0 4px' }}
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', padding: 0, lineHeight: 1, flexShrink: 0 }}
                  >×</button>
                )}
              </div>
              {tableQuery && (
                <span style={{ fontSize: '12px', color: tableRows.length > 0 ? '#4a7a1e' : '#ef4444', fontWeight: '600', background: tableRows.length > 0 ? '#f2fae5' : '#fef2f2', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${tableRows.length > 0 ? '#c3e88d' : '#fca5a5'}` }}>
                  {tableRows.length > 0 ? `${tableRows.length} match${tableRows.length !== 1 ? 'es' : ''}` : 'No matches'}
                </span>
              )}
            </div>

            {/* Table body */}
            {filteredData.length > 0 && (
              tableRows.length > 0 ? (
                <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#05192d', zIndex: 1 }}>
                      <tr>
                        {Object.keys(filteredData[0]).filter(k => !k.startsWith('_')).map(key => (
                          <th key={key} style={{ padding: '13px 16px', color: 'white', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', borderBottom: '2px solid #6FAE2C' }}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, i) => (
                        <tr
                          key={i}
                          style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}
                          onMouseOver={e => e.currentTarget.style.background = '#f2fae5'}
                          onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f8fafc'}
                        >
                          {Object.keys(row).filter(k => !k.startsWith('_')).map((key, j) => (
                            <td key={j} style={{ padding: '11px 16px', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' }}>
                              {highlight(row[key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔍</div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#475569' }}>No rows match "<span style={{ color: '#ef4444' }}>{tableSearch}</span>"</p>
                  <button onClick={() => setTableSearch('')} style={{ marginTop: '12px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    Clear table search
                  </button>
                </div>
              )
            )}
          </div>
        );
      })()}

    </div>
  );
};

export default Dashboard;