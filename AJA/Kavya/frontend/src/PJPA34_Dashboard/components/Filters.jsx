import React, { useState, useRef, useEffect } from 'react';

const FilterIcons = {
    employeeId: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>),
    employee: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
    expenseType: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>),
    paymentType: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>)
};

const ScreenshotIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const handleScreenshot = async () => {
    try {
        document.body.classList.add('is-taking-screenshot');
        await new Promise(r => setTimeout(r, 100));
        const h2c = (await import('html2canvas')).default;
        const canvas = await h2c(document.body, { useCORS: true, allowTaint: true, scale: 2, backgroundColor: '#F4F6F8', logging: false });
        const link = document.createElement('a');
        link.download = `pjpa34_dashboard_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) { console.error('Screenshot failed:', err); window.print(); }
    finally { document.body.classList.remove('is-taking-screenshot'); }
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

    const handleToggle = () => { setIsOpen(!isOpen); if (!isOpen) setSearchTerm(''); };
    const filtered = options.filter(opt => String(opt).toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="filter-group" ref={wrapperRef}>
            <label className="filter-label">
                <span className="filter-label-icon" style={{ color: '#6FAE2C' }}>{icon}</span>{label}
            </label>
            <div className="filter-select-wrapper" style={{ position: 'relative' }}>
                <div onClick={handleToggle} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'white', border: '1.5px solid #E5E7EB',
                    borderRadius: '10px', fontSize: '14px', color: value ? '#333' : '#9CA3AF',
                    cursor: 'pointer', minHeight: '44px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: value ? '600' : '400', color: value ? '#2E7D32' : '#9CA3AF' }}>
                        {value || placeholder}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {value && <button onClick={(e) => { e.stopPropagation(); onChange(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '0 4px', fontSize: '14px' }}>✕</button>}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                </div>
                {isOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
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
                                    style={{ padding: '10px 12px', fontSize: '13px', color: value === opt ? '#2E7D32' : '#4B5563', background: value === opt ? '#F1F8E9' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontWeight: value === opt ? '600' : '400' }}
                                    onMouseEnter={(e) => e.target.style.background = value === opt ? '#F1F8E9' : '#F9FAFB'}
                                    onMouseLeave={(e) => e.target.style.background = value === opt ? '#F1F8E9' : 'transparent'}
                                >{opt}</div>
                            )) : <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>No matches found</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Filters = ({ options, filters, onFilterChange, onReset }) => {
    const uniqueValues = {
        employee_id: (options?.employee_ids || []).map(String),
        report_id: (options?.report_ids || []).map(String),
        report_number: (options?.report_numbers || []).map(String),
        payment_status: options?.payment_statuses || [],
        policy: options?.policies || [],
        month: options?.months || []
    };

    const handleChange = (name, val) => onFilterChange({ ...filters, [name]: val });

    const filterConfigs = [
        { name: 'employee_id', label: 'Employee ID', icon: FilterIcons.employeeId, placeholder: 'All' },
        { name: 'report_id', label: 'Report ID', icon: FilterIcons.expenseType, placeholder: 'All' },
        { name: 'report_number', label: 'Report Number', icon: FilterIcons.paymentType, placeholder: 'All' },
        { name: 'payment_status', label: 'Payment Status', icon: FilterIcons.employeeId, placeholder: 'All' },
        { name: 'policy', label: 'Policy', icon: FilterIcons.expenseType, placeholder: 'All' },
        { name: 'month', label: 'Month', icon: FilterIcons.employee, placeholder: 'All' }
    ];

    const { search, ...activeFilters } = filters;
    const activeCount = Object.values(activeFilters).filter(v => v !== '').length;

    return (
        <div className="filters-section">
            <div className="filters-header">
                <div className="filters-heading">
                    <span>Dashboard Filters</span>
                    {activeCount > 0 && <span className="filters-active-badge">{activeCount} applied</span>}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button className="screenshot-btn" onClick={handleScreenshot} title="Take Screenshot" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }}>{ScreenshotIcon}</button>
                    <button onClick={onReset} className="reset-button">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ marginRight: 6 }}>
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                        </svg>Reset
                    </button>
                </div>
            </div>
            <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {filterConfigs.map(cfg => (
                    <SearchableDropdown key={cfg.name} label={cfg.label} icon={cfg.icon} placeholder={cfg.placeholder}
                        options={uniqueValues[cfg.name]} value={filters[cfg.name]} onChange={(val) => handleChange(cfg.name, val)} />
                ))}

                <div className="filter-group">
                    <label className="filter-label">
                        <span className="filter-label-icon" style={{ color: '#6FAE2C' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </span>Start Date
                    </label>
                    <input type="date" value={filters.startDate} onChange={(e) => handleChange('startDate', e.target.value)}
                        style={{ padding: '10px 14px', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', color: '#333', cursor: 'pointer', minHeight: '44px', width: '100%' }} />
                </div>

                <div className="filter-group">
                    <label className="filter-label">
                        <span className="filter-label-icon" style={{ color: '#6FAE2C' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </span>End Date
                    </label>
                    <input type="date" value={filters.endDate} onChange={(e) => handleChange('endDate', e.target.value)}
                        style={{ padding: '10px 14px', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', color: '#333', cursor: 'pointer', minHeight: '44px', width: '100%' }} />
                </div>
            </div>
        </div>
    );
};

export default Filters;
