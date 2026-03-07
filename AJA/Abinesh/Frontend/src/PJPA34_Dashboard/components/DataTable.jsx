import React, { useState, useEffect, useCallback } from 'react';

const SIZE_OPTIONS = [10, 25, 50, 75, 100];

const PREFERRED = [
    { key: 'Employee ID', label: 'Employee ID' },
    { key: 'Employee Name', label: 'Employee Name' },
    { key: 'Count(Report Id)', label: 'Count(Report ID)' },
    { key: 'Sum(Amount Approved)', label: 'Total Amount Approved', isAmount: true },
    { key: 'Count(Report Id) > 1', label: 'Multiple Claims' },
    { key: 'Amount Approved < Threshold', label: 'Below Threshold' },
    { key: 'Expense Type', label: 'Expense Type' },
    { key: 'Payment Type', label: 'Payment Type' },
    { key: 'Transaction Date', label: 'Transaction Date' },
    { key: 'Business Purpose', label: 'Business Purpose' }
];

const buildQuery = (filters, extra = {}) => {
    const q = new URLSearchParams();
    if (filters.employee_id) q.append('employee_id', filters.employee_id);
    if (filters.employee) q.append('employee', filters.employee);
    if (filters.expense_type) q.append('expense_type', filters.expense_type);
    if (filters.payment_type) q.append('payment_type', filters.payment_type);
    Object.entries(extra).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) q.append(k, v); });
    return q.toString();
};

const formatVal = (col, val) => {
    if (val === undefined || val === null || val === 'N/A' || Number.isNaN(val)) return '-';
    if (col.isAmount && typeof val === 'number')
        return `\u20B9${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return String(val);
};

const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6FAE2C" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 8 }}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const DataTable = ({ filters, onFilterChange, debouncedSearch }) => {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [columns, setColumns] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [csvLoading, setCsvLoading] = useState(false);
    const [goToPage, setGoToPage] = useState('');

    const [localSearch, setLocalSearch] = useState(filters.search || '');

    useEffect(() => {
        setLocalSearch(filters.search || '');
    }, [filters.search]);

    const handleLocalSearchChange = (e) => {
        const val = e.target.value;
        setLocalSearch(val);
        onFilterChange({ ...filters, search: val });
    };

    useEffect(() => { setCurrentPage(1); }, [filters.employee_id, filters.employee, filters.expense_type, filters.payment_type, pageSize, debouncedSearch]);

    useEffect(() => {
        let cancelled = false;
        const doFetch = async () => {
            setLoading(true);
            try {
                const qs = buildQuery(filters, {
                    page: currentPage,
                    page_size: pageSize,
                    search: debouncedSearch || undefined,
                });
                const res = await fetch(`http://localhost:8000/api/pjpa34/table?${qs}`);
                if (!res.ok) throw new Error('Network error');
                const json = await res.json();
                if (!cancelled) {
                    const rows = json.data ?? [];
                    setData(rows);
                    setTotal(json.total ?? 0);
                    setError(null);
                    if (rows.length > 0) {
                        const keys = Object.keys(rows[0]);
                        const pref = PREFERRED.filter(p => keys.includes(p.key));
                        const extras = keys.filter(k => !PREFERRED.find(p => p.key === k)).map(k => ({ key: k, label: k }));
                        setColumns([...pref, ...extras]);
                    }
                }
            } catch (e) {
                if (!cancelled) setError('Failed to load data.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        doFetch();
        return () => { cancelled = true; };
    }, [filters.employee_id, filters.employee, filters.expense_type, filters.payment_type, currentPage, pageSize, debouncedSearch]);


    const handleDownloadCSV = useCallback(async () => {
        try {
            setCsvLoading(true);
            const qs = buildQuery(filters, { page: 1, page_size: 100000, search: debouncedSearch || undefined });
            const res = await fetch(`http://localhost:8000/api/pjpa34/table/csv?${qs}`);
            const text = await res.text();

            const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'high_freq_low_value_claims.csv'; a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('CSV error:', e);
        } finally {
            setCsvLoading(false);
        }
    }, [filters.employee_id, filters.employee, filters.expense_type, filters.payment_type, debouncedSearch]);


    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (currentPage - 1) * pageSize;

    const handleGoToPage = (e) => {
        e.preventDefault();
        const pg = parseInt(goToPage, 10);
        if (!isNaN(pg) && pg >= 1 && pg <= totalPages) setCurrentPage(pg);
        setGoToPage('');
    };

    return (
        <div className="data-table-card">
            <div className="table-header-row" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <h3 className="chart-title" style={{ margin: 0 }}>High-Freq Low-Value Claims Data</h3>
                    <span className="table-count-badge" style={{ alignSelf: 'flex-start' }}>{total.toLocaleString()} records total</span>
                </div>
                <button className="csv-download-btn" onClick={handleDownloadCSV} disabled={csvLoading}>
                    {csvLoading ? 'Exporting…' : '\u2913 Download CSV'}
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #E0E0E0', borderRadius: '8px', padding: '0 12px', height: '40px', flex: 1, maxWidth: '400px' }}>
                    <SearchIcon />
                    <input type="text" placeholder="Search all columns in this table..." value={localSearch} onChange={handleLocalSearchChange} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#333', background: 'transparent' }} />
                    {localSearch && <button onClick={() => handleLocalSearchChange({ target: { value: '' } })} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9E9E9E' }}>✕</button>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Show</span>
                    <div style={{ position: 'relative' }}>
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ padding: '8px 30px 8px 12px', fontSize: '13px', fontWeight: 600, background: '#F1F8E9', color: '#2E7D32', border: '1.5px solid #2E7D32', borderRadius: '8px', appearance: 'none', cursor: 'pointer', outline: 'none' }}>
                            {SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} entries</option>)}
                        </select>
                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-responsive" style={{ position: 'relative' }}>
                {loading && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#DCF0B2', overflow: 'hidden', zIndex: 10 }}>
                        <div className="loading-bar-animation" style={{ height: '100%', background: '#6FAE2C', width: '30%' }} />
                    </div>
                )}
                <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    {error ? (
                        <p style={{ color: '#c62828', textAlign: 'center', padding: 20 }}>{error}</p>
                    ) : (
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th className="th-index">#</th>
                                    {columns.map(col => <th key={col.key} className={col.isAmount ? 'text-right' : ''}>{col.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((row, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                                        <td className="td-index">{startIndex + idx + 1}</td>
                                        {columns.map(col => (
                                            <td key={col.key} className={col.isAmount ? 'text-right td-amount' : ''}>
                                                {formatVal(col, row[col.key])}
                                            </td>
                                        ))}
                                    </tr>
                                )) : !loading && <tr><td colSpan={(columns.length || 1) + 1} className="td-empty">{debouncedSearch ? `No results for "${debouncedSearch}"` : 'No data available'}</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {!loading && !error && (
                <div className="pagination-controls">
                    <form onSubmit={handleGoToPage} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 13, color: '#757575', whiteSpace: 'nowrap' }}>Go to page:</span>
                        <input type="number" min={1} max={totalPages || 1} value={goToPage} onChange={e => setGoToPage(e.target.value)} placeholder={String(currentPage)} style={{ width: 55, padding: '5px 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, textAlign: 'center', outline: 'none' }} />
                        <button type="submit" className="pg-btn" style={{ padding: '5px 12px' }}>Go</button>
                    </form>
                    <span className="pagination-info">Showing <strong>{total > 0 ? startIndex + 1 : 0}&ndash;{Math.min(startIndex + pageSize, total)}</strong> of <strong>{total.toLocaleString()}</strong>{debouncedSearch && <span style={{ color: '#FF7043', marginLeft: 6 }}>(filtered)</span>}</span>
                    <div className="pagination-buttons">
                        <button className="pg-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>&laquo;</button>
                        <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>&lsaquo; Prev</button>
                        <span className="page-number">Page {currentPage} / {totalPages || 1}</span>
                        <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Next &rsaquo;</button>
                        <button className="pg-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>&raquo;</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
