import React, { useState, useMemo } from 'react';

const SIZE_OPTIONS = [10, 25, 50, 75, 100];

const COLUMNS = [
    { key: 'Employee Name', label: 'Employee Name' },
    { key: 'Employee ID', label: 'Employee ID' },
    { key: 'Report Id', label: 'Report ID' },
    { key: 'Submit Date', label: 'Submit Date' },
    { key: 'Approval Status', label: 'Approval Status' },
    { key: 'Amount Approved', label: 'Amount Approved', isAmount: true },
    { key: '_calculatedTripCount', label: 'Trip Count', formatString: true }
];

const formatVal = (col, val) => {
    if (val === undefined || val === null || val === 'N/A' || val === '') return '-';
    if (col.isAmount) {
        const num = Number(val);
        if (!isNaN(num)) return `\u20B9${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return String(val);
};

const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6FAE2C" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 8 }}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const DataTable = ({ data }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [goToPage, setGoToPage] = useState('');

    // We need to calculate the trip count per employee and attach it to rows
    const enrichedData = useMemo(() => {
        if (!data) return [];

        // First pass: calculate trips per employee
        const map = new Map();
        data.forEach(item => {
            const emp = item['Employee Name'] || 'Unknown';
            const repId = item['Report Id'];
            if (!map.has(emp)) map.set(emp, new Set());
            if (repId) map.get(emp).add(repId);
        });

        // Second pass: attach count
        return data.map(item => ({
            ...item,
            '_calculatedTripCount': map.get(item['Employee Name'] || 'Unknown')?.size || 0
        }));
    }, [data]);

    const filteredData = useMemo(() => {
        if (!search.trim()) return enrichedData;
        const lowerSearch = search.toLowerCase();
        return enrichedData.filter(row =>
            COLUMNS.some(col => String(row[col.key === 'Report ID' ? 'Report Id' : col.key] || '').toLowerCase().includes(lowerSearch))
        );
    }, [enrichedData, search]);

    const total = filteredData.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const currentData = filteredData.slice(startIndex, startIndex + pageSize);

    const handleDownloadCSV = () => {
        if (!filteredData.length) return;
        const escape = v => {
            const s = v == null ? '' : String(v);
            return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const csvLines = [
            COLUMNS.map(c => c.label).join(','),
            ...filteredData.map(row => COLUMNS.map(c => escape(formatVal(c, row[c.key === 'Report ID' ? 'Report Id' : c.key]))).join(','))
        ];
        const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'pjpa30_data.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleGoToPage = (e) => {
        e.preventDefault();
        const pg = parseInt(goToPage, 10);
        if (!isNaN(pg) && pg >= 1 && pg <= totalPages) setCurrentPage(pg);
        setGoToPage('');
    };

    return (
        <div className="data-table-card">
            <div className="table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <h3 className="chart-title" style={{ margin: 0 }}>Filtered Claims Data</h3>
                    <span className="table-count-badge" style={{ alignSelf: 'flex-start', background: '#e0f2f1', color: '#00695c', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        {total.toLocaleString()} records total
                    </span>
                </div>
                <button onClick={handleDownloadCSV} style={{ padding: '8px 16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#333' }}>
                    {'\u2913 Download CSV'}
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 15 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #E0E0E0',
                    borderRadius: '8px', padding: '0 12px', height: '40px', flex: 1, maxWidth: '400px'
                }}>
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search all columns in this table..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#333', background: 'transparent' }}
                    />
                    {search && (
                        <button onClick={() => { setSearch(''); setCurrentPage(1); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9E9E9E' }}>✕</button>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Show</span>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={pageSize}
                            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            style={{
                                padding: '8px 30px 8px 12px', fontSize: '13px', fontWeight: 600, background: '#F1F8E9',
                                color: '#2E7D32', border: '1.5px solid #2E7D32', borderRadius: '8px', appearance: 'none',
                                cursor: 'pointer', outline: 'none'
                            }}
                        >
                            {SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} entries</option>)}
                        </select>
                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="3">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-responsive">
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th className="th-index">#</th>
                            {COLUMNS.map(col => <th key={col.key} className={col.isAmount ? 'text-right' : ''}>{col.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.length > 0 ? currentData.map((row, idx) => (
                            <tr key={idx}>
                                <td className="td-index">{startIndex + idx + 1}</td>
                                {COLUMNS.map(col => (
                                    <td key={col.key} className={col.isAmount ? 'text-right td-amount' : ''}>
                                        {formatVal(col, row[col.key === 'Report ID' ? 'Report Id' : col.key])}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={COLUMNS.length + 1} style={{ textAlign: 'center', padding: '20px', color: '#9e9e9e' }}>
                                    {search ? `No results for "${search}"` : 'No data available'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {total > 0 && (
                <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <form onSubmit={handleGoToPage} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 13, color: '#757575', whiteSpace: 'nowrap' }}>Go to page:</span>
                        <input
                            type="number" min={1} max={totalPages}
                            value={goToPage}
                            onChange={e => setGoToPage(e.target.value)}
                            placeholder={String(currentPage)}
                            style={{ width: 55, padding: '5px 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, textAlign: 'center', outline: 'none' }}
                        />
                        <button type="submit" style={{ padding: '5px 12px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer' }}>Go</button>
                    </form>

                    <span className="pagination-info" style={{ fontSize: '14px', color: '#757575' }}>
                        Showing <strong>{startIndex + 1}&ndash;{Math.min(startIndex + pageSize, total)}</strong> of <strong>{total.toLocaleString()}</strong>
                    </span>

                    <div className="pagination-buttons" style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e0e0e0', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>&laquo;</button>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e0e0e0', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>&lsaquo; Prev</button>
                        <span style={{ padding: '6px 12px', fontWeight: 'bold' }}>Page {currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e0e0e0', background: 'white', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}>Next &rsaquo;</button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e0e0e0', background: 'white', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}>&raquo;</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
