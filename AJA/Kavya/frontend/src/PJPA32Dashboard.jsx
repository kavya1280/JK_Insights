import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, AreaChart, Area
} from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import html2canvas from 'html2canvas';
import './PJPA32Dashboard.css';

// Import logos to match project structure
import logo from "./assets/images/jkc.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";

// =============================================================================
// SHARED CONSTANTS & ICONS
// =============================================================================

const RS = '₹';
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const CITY_COORDS = {
    'Mumbai': { lat: 19.0760, lon: 72.8777 },
    'Delhi': { lat: 28.6139, lon: 77.2090 },
    'Chennai': { lat: 13.0827, lon: 80.2707 },
    'Bangalore': { lat: 12.9716, lon: 77.5946 },
    'Hyderabad': { lat: 17.3850, lon: 78.4867 },
    'Kolkata': { lat: 22.5726, lon: 88.3639 },
    'Salem': { lat: 11.6643, lon: 78.1460 },
    'Coimbatore': { lat: 11.0168, lon: 76.9558 },
    'Sitamarhi': { lat: 26.5891, lon: 85.4851 },
    'Parbhani': { lat: 19.2638, lon: 76.7758 },
    'Shirdi': { lat: 19.7645, lon: 74.4762 },
    'Muddapur': { lat: 16.1472, lon: 75.3115 },
    'Balasore': { lat: 21.4934, lon: 86.9337 },
};

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
            <path d="M6 4h12" /><path d="M6 8h12" /><path d="M6 12h5a4 4 0 0 0 0-8" /><path d="M10 12l6 8" />
        </svg>
    ),
    chart: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
        </svg>
    ),
    screenshot: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
        </svg>
    ),
    search: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    )
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatCurrency = (num) => {
    if (num >= 1000000) return `${RS}${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${RS}${(num / 1000).toFixed(1)}K`;
    return `${RS}${num.toLocaleString()}`;
};

const formatNumber = (num) => {
    if (num >= 10000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
};

const lerpColor = (t) => {
    if (t < 0.5) {
        const tt = t * 2;
        return `rgb(${Math.round(76 + tt * 179)},${Math.round(175 - tt * 25)},${Math.round(80 - tt * 80)})`;
    }
    const tt = (t - 0.5) * 2;
    return `rgb(${Math.round(255 - tt * 11)},${Math.round(150 - tt * 107)},${Math.round(tt * 54)})`;
};

function mercatorXY(lon, lat, scale = 150, containerW = 800, containerH = 400) {
    const centerLon = 10, centerLat = 20;
    const x = (lon - centerLon) * (scale * Math.PI / 180) + containerW / 2;
    const latR = lat * Math.PI / 180;
    const cLatR = centerLat * Math.PI / 180;
    const y = -(Math.log(Math.tan(Math.PI / 4 + latR / 2)) -
        Math.log(Math.tan(Math.PI / 4 + cLatR / 2))) * scale + containerH / 2;
    return [x, y];
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const Header = ({ insightId }) => (
    <header className="header" style={{ position: 'relative', zIndex: 1000 }}>
        <div className="header-left">
            <img src={ajalabsblack} alt="Aja Labs" className="header-logo" />
        </div>
        <div className="header-center">
            <div className="header-title-wrapper">
                <div className="header-title-accent" />
                <div>
                    <div className="header-subtitle">PJPA32 · {insightId === 'PJPA32_HOL' ? 'Holiday Analysis' : 'Weekend Analysis'}</div>
                    <h1 className="header-title">{insightId === 'PJPA32_HOL' ? 'Holiday Travel Claims' : 'Weekend Travel Claims'}</h1>
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

const KPICards = ({ kpis }) => {
    if (!kpis) return null;
    const cards = [
        { label: 'Employee ID', value: kpis.distinct_employee_id, type: 'number', icon: Icons.employeeId, color: '#6FAE2C' },
        { label: 'Employee', value: kpis.distinct_employee, type: 'number', icon: Icons.employee, color: '#0B4F94' },
        { label: 'Report ID', value: kpis.distinct_report_id, type: 'number', icon: Icons.reportId, color: '#6FAE2C' },
        { label: 'Expense Type', value: kpis.distinct_expense_type, type: 'number', icon: Icons.expenseType, color: '#0B4F94' },
        { label: 'Total Approved Amount', value: kpis.total_approved_amount, type: 'currency', icon: Icons.currency, color: '#6FAE2C' },
        { label: 'Avg Spend per Person', value: kpis.avg_spend_per_person, type: 'currency', icon: Icons.chart, color: '#0B4F94' },
    ];
    return (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {cards.map((card, i) => (
                <div key={card.label} className="kpi-card kpi-card-animate" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="kpi-icon-svg" style={{ color: card.color }}>{card.icon}</div>
                    <div className="kpi-label" style={{ fontWeight: 700 }}>{card.label}</div>
                    <div className="kpi-value" style={{ color: card.color }}>
                        {card.type === 'currency' ? formatCurrency(card.value) : formatNumber(card.value)}
                    </div>
                </div>
            ))}
        </div>
    );
};

const SearchableDropdown = ({ label, icon, placeholder, options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setSearchTerm('');
    };

    const filtered = options.filter(opt => String(opt).toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="filter-group" ref={wrapperRef}>
            <label className="filter-label">
                <span className="filter-label-icon" style={{ color: '#6FAE2C' }}>{icon}</span>
                {label}
            </label>
            <div className="filter-select-wrapper" style={{ position: 'relative' }}>
                <div onClick={handleToggle} className={`filter-select-display ${value ? 'active' : ''}`}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
                        background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px',
                        color: value ? '#333' : '#9CA3AF', cursor: 'pointer', minHeight: '44px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: value ? '600' : '400', color: value ? '#2E7D32' : '#9CA3AF' }}>
                        {value || placeholder}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {value && (
                            <button onClick={(e) => { e.stopPropagation(); onChange(''); }}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '0 4px', fontSize: '14px' }}>✕</button>
                        )}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                </div>
                {isOpen && (
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'white', border: '1.5px solid #E5E7EB',
                        borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden'
                    }}>
                        <div style={{ padding: '8px', borderBottom: '1px solid #F3F4F6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', borderRadius: '6px', padding: '4px 10px', border: '1px solid #E5E7EB' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 8 }}>
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input autoFocus type="text" placeholder="Type to search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '13px', height: '28px', color: '#374151' }} />
                            </div>
                        </div>
                        <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px' }}>
                            {filtered.length > 0 ? filtered.map((opt, i) => (
                                <div key={i} onClick={() => { onChange(opt); setIsOpen(false); }}
                                    style={{
                                        padding: '10px 12px', fontSize: '13px', color: value === opt ? '#2E7D32' : '#4B5563',
                                        background: value === opt ? '#F1F8E9' : 'transparent', borderRadius: '6px', cursor: 'pointer',
                                        fontWeight: value === opt ? '600' : '400', transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = value === opt ? '#F1F8E9' : '#F9FAFB'}
                                    onMouseLeave={(e) => e.target.style.background = value === opt ? '#F1F8E9' : 'transparent'}>
                                    {opt}
                                </div>
                            )) : <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>No matches found</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Filters = ({ options, filters, onFilterChange, onReset }) => {
    const handleScreenshot = async () => {
        try {
            document.body.classList.add('is-taking-screenshot');
            await new Promise(r => setTimeout(r, 100));
            const canvas = await html2canvas(document.body, { useCORS: true, allowTaint: true, scale: 2, backgroundColor: '#F4F6F8', logging: false });
            const link = document.createElement('a');
            link.download = `dashboard_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) { window.print(); }
        finally { document.body.classList.remove('is-taking-screenshot'); }
    };

    const filterConfigs = [
        { name: 'employeeId', label: 'Employee ID', icon: Icons.employeeId, options: Array.from(options.employeeIds) },
        { name: 'employee', label: 'Employee', icon: Icons.employee, options: Array.from(options.employees) },
        { name: 'reportId', label: 'Report ID', icon: Icons.reportId, options: Array.from(options.reportIds) },
        { name: 'expenseType', label: 'Expense Type', icon: Icons.expenseType, options: Array.from(options.expenseTypes) },
    ];

    const activeCount = Object.values(filters).filter(v => v !== '' && typeof v === 'string').length - (filters.search ? 1 : 0);

    return (
        <div className="filters-section">
            <div className="filters-header">
                <div className="filters-heading">
                    <span>Dashboard Filters</span>
                    {activeCount > 0 && <span className="filters-active-badge">{activeCount} applied</span>}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button className="screenshot-btn" onClick={handleScreenshot} title="Take Screenshot (PNG)">{Icons.screenshot}</button>
                    <button onClick={onReset} className="reset-button">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ marginRight: 6 }}>
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                        </svg>
                        Reset
                    </button>
                </div>
            </div>
            <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {filterConfigs.map(cfg => (
                    <SearchableDropdown key={cfg.name} label={cfg.label} icon={cfg.icon} placeholder={`Select ${cfg.label}`}
                        options={cfg.options} value={filters[cfg.name]} onChange={(val) => onFilterChange({ ...filters, [cfg.name]: val })} />
                ))}
            </div>
        </div>
    );
};

const ColumnChart = ({ data }) => {
    const COLORS = ['#6FAE2C', '#0B4F94', '#7DC030', '#1565C0', '#8FC44A', '#2196F3', '#4A7A1E'];
    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Approved Amount by Day</h3></div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F2FAE5" vertical={false} />
                        <XAxis dataKey="weekday" stroke="#9E9E9E" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                        <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                            <div className="custom-tooltip"><p className="tooltip-label">{label}</p><p className="tooltip-value">{RS}{payload[0].value.toLocaleString()}</p></div>
                        ) : null} cursor={{ fill: 'rgba(111,174,44,0.05)' }} />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1200} animationEasing="ease-out">
                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const DonutChart = ({ data }) => {
    const COLORS = ['#6FAE2C', '#0B4F94', '#8FC44A', '#1565C0', '#A8D45A', '#2196F3', '#4A7A1E', '#1976D2', '#C2E08F', '#64B5F6'];
    const total = data.reduce((s, i) => s + i.value, 0);

    return (
        <div className="chart-card chart-animate equal-height-card">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Amount Distribution Across Expense Type</h3></div>
            <div className="donut-layout">
                <div className="donut-pie-area">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius="42%" outerRadius="72%" paddingAngle={2} dataKey="value"
                                isAnimationActive animationDuration={1100} animationEasing="ease-out">
                                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={2} />)}
                            </Pie>
                            <Tooltip content={({ active, payload }) => active && payload?.length ? (
                                <div className="custom-tooltip"><p className="tooltip-label">{payload[0].name}</p><p className="tooltip-value">{formatCurrency(payload[0].value)}</p></div>
                            ) : null} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="donut-right-legend">
                    <div className="donut-total-label">Total</div>
                    <div className="donut-total-value">{formatCurrency(total)}</div>
                    <ul className="donut-legend-list">
                        {data.slice(0, 10).map((item, i) => (
                            <li key={item.name} className="donut-legend-item">
                                <span className="donut-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                                <span className="donut-legend-name" title={item.name}>{item.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const EmployeeBarChart = ({ data }) => {
    const COLORS = ['#6FAE2C', '#0B4F94', '#7DC030', '#1565C0', '#8FC44A', '#2196F3', '#4A7A1E', '#1976D2', '#A8D45A', '#64B5F6'];
    return (
        <div className="chart-card chart-animate">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Amount Approved per Employee</h3></div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 10, right: 40, left: 60, bottom: 5 }} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F2FAE5" horizontal={false} />
                        <XAxis type="number" stroke="#9E9E9E" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="employee" stroke="#9E9E9E" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={({ active, payload }) => active && payload?.length ? (
                            <div className="custom-tooltip"><p className="tooltip-label">{payload[0].payload.fullName}</p><p className="tooltip-value">{RS}{payload[0].value.toLocaleString()}</p></div>
                        ) : null} cursor={{ fill: 'rgba(111,174,44,0.05)' }} />
                        <Bar dataKey="amount" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1400} animationEasing="ease-out">
                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const LocationMap = ({ data }) => {
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    const [transform, setTransform] = useState(zoomIdentity);
    const wrapRef = useRef(null);
    const svgRef = useRef(null);

    const maxAmt = Math.max(...data.map(d => d.amount), 1);
    const minAmt = Math.min(...data.map(d => d.amount), 0);

    useEffect(() => {
        if (!svgRef.current) return;
        const zoomBehavior = d3Zoom().scaleExtent([1, 20]).translateExtent([[-300, -200], [1100, 700]]).on('zoom', (e) => setTransform(e.transform));
        const sel = select(svgRef.current);
        sel.call(zoomBehavior);
        sel.on('dblclick.zoom', () => sel.transition().duration(500).call(zoomBehavior.transform, zoomIdentity));
        return () => sel.on('.zoom', null);
    }, []);

    const handleMouseMove = (e) => {
        if (!wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        let best = null, bestDist = 30;
        data.forEach(loc => {
            const [bx, by] = mercatorXY(loc.lon, loc.lat, 150, rect.width, rect.height);
            const sx = transform.x + bx * transform.k, sy = transform.y + by * transform.k;
            const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
            if (dist < bestDist) { bestDist = dist; best = { ...loc, sx, sy }; }
        });
        setTooltip(best);
    };

    return (
        <div className="chart-card chart-animate equal-height-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Amount Approved by Location</h3></div>
            <div ref={wrapRef} style={{ width: '100%', height: 300, position: 'relative' }} onMouseMove={handleMouseMove} onMouseLeave={() => { setTooltip(null); setHoveredCountry(null); }}>
                <div ref={svgRef} style={{ width: '100%', height: '100%', cursor: 'grab', overflow: 'hidden' }}>
                    <ComposableMap projection="geoMercator" projectionConfig={{ scale: 150, center: [10, 20] }} style={{ width: '100%', height: '100%' }}>
                        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
                            <Geographies geography={geoUrl}>
                                {({ geographies }) => geographies.filter(g => g.id !== '010' && g.properties?.name !== 'Antarctica').map((geo, i) => (
                                    <Geography key={geo.rsmKey} geography={geo} onMouseEnter={() => setHoveredCountry(geo.properties.name)} onMouseLeave={() => setHoveredCountry(null)}
                                        fill={hoveredCountry === geo.properties.name ? '#FF7043' : ['#D8ECF8', '#D4EDDA', '#E8E8EA'][i % 3]} stroke="#FFF" strokeWidth={0.5 / transform.k} />
                                ))}
                            </Geographies>
                            {data.map((loc) => {
                                const t = maxAmt === minAmt ? 1 : (loc.amount - minAmt) / (maxAmt - minAmt);
                                const radius = ((tooltip?.city === loc.city ? 9 : 5) + t * 9) / transform.k;
                                return (
                                    <Marker key={loc.city} coordinates={[loc.lon, loc.lat]}>
                                        {tooltip?.city === loc.city && <circle r={radius + 5 / transform.k} fill={lerpColor(t)} opacity={0.25} />}
                                        <circle r={radius} fill={lerpColor(t)} stroke="white" strokeWidth={1.5 / transform.k} opacity={0.9} />
                                    </Marker>
                                );
                            })}
                        </g>
                    </ComposableMap>
                </div>
                {tooltip && (
                    <div style={{ position: 'absolute', left: tooltip.sx, top: tooltip.sy, transform: 'translate(-50%, calc(-100% - 14px))', background: 'white', borderRadius: 10, padding: '8px 14px', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', pointerEvents: 'none', zIndex: 100 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>📍 {tooltip.city}</div>
                        <div style={{ fontSize: 13, color: '#2E7D32', fontWeight: 600 }}>{formatCurrency(tooltip.amount)}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TrendLineChart = ({ data }) => {
    return (
        <div className="chart-card">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Approved Amount Trend</h3></div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                        <defs><linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#43A047" stopOpacity={0.3} /><stop offset="95%" stopColor="#43A047" stopOpacity={0.02} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                        <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fontSize: 11 }} width={55} />
                        <Tooltip />
                        <Area type="monotone" dataKey="amount" stroke="#2E7D32" strokeWidth={2.5} fill="url(#greenGrad)" isAnimationActive />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const ApprovalStatusChart = ({ data, keys }) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
    return (
        <div className="chart-card">
            <div className="chart-title-row"><div className="chart-title-accent" /><h3 className="chart-title">Approval vs Payment Status</h3></div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fontSize: 11 }} width={60} />
                        <Tooltip />
                        {keys.map((key, i) => <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} isAnimationActive />)}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const PJPA32Dashboard = ({ data, insightId }) => {
    const [filters, setFilters] = useState({ employeeId: '', employee: '', reportId: '', expenseType: '', search: '' });
    const [pageSize, setPageSize] = useState(15);
    const [currentPage, setCurrentPage] = useState(1);

    // 1. Calculate Filter Options from Data
    const filterOptions = useMemo(() => {
        const options = {
            employeeIds: new Set(),
            employees: new Set(),
            reportIds: new Set(),
            expenseTypes: new Set()
        };
        data.forEach(item => {
            if (item['Employee ID']) options.employeeIds.add(String(item['Employee ID']));
            if (item['Employee']) options.employees.add(item['Employee']);
            if (item['Report ID']) options.reportIds.add(String(item['Report ID']));
            if (item['Expense Type']) options.expenseTypes.add(item['Expense Type']);
        });
        return options;
    }, [data]);

    // 2. Filter Data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesEmpId = !filters.employeeId || String(item['Employee ID']) === filters.employeeId;
            const matchesEmp = !filters.employee || item['Employee'] === filters.employee;
            const matchesReportId = !filters.reportId || String(item['Report ID']) === filters.reportId;
            const matchesExpense = !filters.expenseType || item['Expense Type'] === filters.expenseType;
            const matchesSearch = !filters.search || Object.values(item).some(v => String(v).toLowerCase().includes(filters.search.toLowerCase()));
            return matchesEmpId && matchesEmp && matchesReportId && matchesExpense && matchesSearch;
        });
    }, [data, filters]);

    // 3. Calculate Stats & Aggregations
    const stats = useMemo(() => {
        const kpis = {
            distinct_employee_id: new Set(filteredData.map(d => d['Employee ID'])).size,
            distinct_employee: new Set(filteredData.map(d => d['Employee'])).size,
            distinct_report_id: new Set(filteredData.map(d => d['Report ID'])).size,
            distinct_expense_type: new Set(filteredData.map(d => d['Expense Type'])).size,
            total_approved_amount: filteredData.reduce((sum, d) => sum + (parseFloat(String(d['Approved Amount']).replace(/,/g, '')) || 0), 0),
        };
        kpis.avg_spend_per_person = kpis.distinct_employee > 0 ? kpis.total_approved_amount / kpis.distinct_employee : 0;

        // Weekend/Holiday Data
        const dayMap = filteredData.reduce((acc, d) => {
            const day = d['Day of Week (Name)'] || 'Other';
            acc[day] = (acc[day] || 0) + (parseFloat(String(d['Approved Amount']).replace(/,/g, '')) || 0);
            return acc;
        }, {});
        const weekendOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const weekendData = weekendOrder.filter(d => dayMap[d]).map(d => ({ weekday: d.substring(0, 3), amount: dayMap[d] }));

        // Expense Distribution
        const expMap = filteredData.reduce((acc, d) => {
            const type = d['Expense Type'] || 'Other';
            acc[type] = (acc[type] || 0) + (parseFloat(String(d['Approved Amount']).replace(/,/g, '')) || 0);
            return acc;
        }, {});
        const expenseDistribution = Object.entries(expMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

        // Employee Data
        const empMap = filteredData.reduce((acc, d) => {
            const name = d['Employee'] || 'Unknown';
            acc[name] = (acc[name] || 0) + (parseFloat(String(d['Approved Amount']).replace(/,/g, '')) || 0);
            return acc;
        }, {});
        const employeeData = Object.entries(empMap).map(([employee, amount]) => ({ employee: employee.split(' ')[0], fullName: employee, amount })).sort((a, b) => b.amount - a.amount).slice(0, 10);

        // Location Data
        const locMap = filteredData.reduce((acc, d) => {
            const city = d['City/Location'] || 'Unknown';
            const coords = CITY_COORDS[city] || { lat: 20, lon: 77 }; // Default India center-ish
            if (!acc[city]) acc[city] = { city, amount: 0, lat: coords.lat, lon: coords.lon };
            acc[city].amount += (parseFloat(String(d['Approved Amount']).replace(/,/g, '')) || 0);
            return acc;
        }, {});
        const locationData = Object.values(locMap);

        // Trend Data
        const trendMap = filteredData.reduce((acc, d) => {
            // Need a date field, assuming 'Transaction Date' exists
            const dateStr = d['Transaction Date'] || d['Date'];
            if (dateStr) {
                const date = new Date(dateStr);
                const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
                acc[key] = (acc[key] || 0) + (parseFloat(String(d['Approved Amount']).replace(/,/g, '')) || 0);
            }
            return acc;
        }, {});
        const trendData = Object.entries(trendMap).map(([month, amount]) => ({ month, amount }));

        // Approval vs Payment
        const statusMap = filteredData.reduce((acc, d) => {
            const status = d['Approval Status'] || 'Unknown';
            const pStatus = d['Payment Status'] || 'Unknown';
            if (!acc[status]) acc[status] = { status };
            acc[status][pStatus] = (acc[status][pStatus] || 0) + 1;
            return acc;
        }, {});
        const approvalStatusData = Object.values(statusMap);
        const paymentKeys = Array.from(new Set(filteredData.map(d => d['Payment Status'] || 'Unknown')));

        return { kpis, weekendData, expenseDistribution, employeeData, locationData, trendData, approvalStatusData, paymentKeys };
    }, [filteredData]);

    // 4. Table Pagination
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    const cols = [
        { key: 'Report ID', label: 'Report ID' },
        { key: 'Employee ID', label: 'Emp ID' },
        { key: 'Employee', label: 'Employee' },
        { key: 'Report Name', label: 'Report Name' },
        { key: 'Expense Type', label: 'Expense Type' },
        { key: 'Approved Amount', label: 'Approved Amt', isAmount: true },
        { key: 'Approval Status', label: 'Status' },
        { key: 'City/Location', label: 'Location' },
        { key: 'Transaction Date', label: 'Date' },
    ];

    // 5. Export to CSV Function
    const exportToCSV = () => {
        if (!filteredData || filteredData.length === 0) return;

        // Build the headers
        const headers = cols.map(c => `"${c.label}"`).join(',');

        // Build the rows and escape quotes
        const csvRows = filteredData.map(row => {
            return cols.map(c => {
                let val = row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '';
                val = val.replace(/"/g, '""'); // Escape inner quotes
                return `"${val}"`; // Wrap in quotes to handle commas safely
            }).join(',');
        });

        // Combine and trigger download
        const csvContent = [headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${insightId}_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="dashboard">
            <div className="abstract-background">
                <svg viewBox="0 0 1440 1024" fill="none" preserveAspectRatio="none">
                    <path d="M0 0H1440V1024H0V0Z" fill="#F4F6F8" />
                    <path d="M-100 200C150 400 450 -100 800 150C1150 400 1300 200 1500 350V-100H-100V200Z" fill="#6FAE2C" opacity="0.07" />
                    <path d="M1500 800C1100 1100 900 600 500 800C100 1000 -50 900 -200 850V1200H1500V800Z" fill="#0B4F94" opacity="0.06" />
                </svg>
            </div>
            <Header insightId={insightId} />
            <div className="dashboard-content">
                <KPICards kpis={stats.kpis} />
                <Filters options={filterOptions} filters={filters} onFilterChange={setFilters} onReset={() => setFilters({ employeeId: '', employee: '', reportId: '', expenseType: '', search: '' })} />

                {/* Charts Layout: 3 sections with 2 charts per section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="chart-row">
                        <EmployeeBarChart data={stats.employeeData} />
                        <ColumnChart data={stats.weekendData} />
                    </div>
                    <div className="chart-row">
                        <DonutChart data={stats.expenseDistribution} />
                        <LocationMap data={stats.locationData} />
                    </div>
                    <div className="chart-row">
                        <TrendLineChart data={stats.trendData} />
                        <ApprovalStatusChart data={stats.approvalStatusData} keys={stats.paymentKeys} />
                    </div>
                </div>

                {/* Data Table */}
                <div className="data-table-card">
                    {/* Added the CSV Export button to the table header row */}
                    <div className="table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1.5px solid #edf7d7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <h3 className="chart-title">Travel Claims Data</h3>
                            <span className="table-count-badge">{filteredData.length.toLocaleString()} records</span>
                        </div>
                        <button onClick={exportToCSV} className="reset-button" style={{ background: '#05192d', color: 'white', padding: '8px 16px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 8 }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export to CSV
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #E0E0E0', borderRadius: 8, padding: '0 12px' }}>
                            {Icons.search}
                            <input type="text" placeholder="Search..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                style={{ border: 'none', outline: 'none', width: '100%', padding: '10px', fontSize: '14px', background: 'white', color: '#000000' }} />
                        </div>
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="pg-btn">
                            {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n} rows</option>)}
                        </select>
                    </div>
                    <div className="table-responsive">
                        <table className="enterprise-table">
                            <thead>
                                <tr><th>#</th>{cols.map(c => <th key={c.key}>{c.label}</th>)}</tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, i) => (
                                    <tr key={i}>
                                        <td>{((currentPage - 1) * pageSize) + i + 1}</td>
                                        {cols.map(c => <td key={c.key} className={c.isAmount ? 'text-right' : ''}>
                                            {c.isAmount ? formatCurrency(parseFloat(String(row[c.key]).replace(/,/g, '')) || 0) : row[c.key]}
                                        </td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="pagination-controls">
                        <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
                        <span>Page {currentPage} of {Math.ceil(filteredData.length / pageSize)}</span>
                        <button className="pg-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredData.length / pageSize)}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PJPA32Dashboard;