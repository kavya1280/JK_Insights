import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import Filters from './components/Filters';
import DataTable from './components/DataTable';

import DuplicateReportChart from './components/DuplicateReportChart';
import EmployeeAmountChart from './components/EmployeeAmountChart';
import DuplicateTrendChart from './components/DuplicateTrendChart';
import ApprovalStatusChart from './components/ApprovalStatusChart';
import DepartmentChart from './components/DepartmentChart';

import '../PJPA 32 dashboard/src/index.css';

const API = 'http://localhost:8000/api/pjpa35';

function App({ onBack }) {
    const [filterOptions, setFilterOptions] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        employee_id: '', employee: '', report_id: '', search: ''
    });

    useEffect(() => {
        fetch(`${API}/filters`)
            .then(r => r.json())
            .then(data => setFilterOptions(data))
            .catch(err => console.error("Filter fetch error:", err));
    }, []);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(filters.search), 500);
        return () => clearTimeout(t);
    }, [filters.search]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const q = new URLSearchParams();
                if (filters.employee_id) q.append('employee_id', filters.employee_id);
                if (filters.employee) q.append('employee', filters.employee);
                if (filters.report_id) q.append('report_id', filters.report_id);

                if (debouncedSearch) q.append('search', debouncedSearch);

                const [kpiRes, chartRes] = await Promise.all([
                    fetch(`${API}/kpis?${q}`).then(r => r.json()),
                    fetch(`${API}/charts?${q}`).then(r => r.json())
                ]);
                setKpis(kpiRes);
                setCharts(chartRes);
                setError(null);
            } catch (err) {
                setError("Failed to load dashboard data. Ensure backend is running.");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [filters.employee_id, filters.employee, filters.report_id, debouncedSearch]);

    const handleFilterChange = (newFilters) => setFilters(newFilters);
    const handleResetFilters = () => setFilters({
        employee_id: '', employee: '', report_id: '', search: ''
    });

    const [initialLoading, setInitialLoading] = useState(true);
    useEffect(() => {
        if (!loading && initialLoading) setInitialLoading(false);
    }, [loading, initialLoading]);

    if (initialLoading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Initializing Duplicate Report ID dashboard...</p>
            </div>
        );
    }

    if (error && !kpis) {
        return (
            <div className="dashboard-error">
                <h3>Oops! Something went wrong</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="dashboard pjpa35-dashboard">
            <div className="abstract-background">
                <svg viewBox="0 0 1440 1024" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 0H1440V1024H0V0Z" fill="#F4F6F8" />
                    <path d="M-100 200C150 400 450 -100 800 150C1150 400 1300 200 1500 350V-100H-100V200Z" fill="#EF5350" opacity="0.05" />
                    <path d="M1500 800C1100 1100 900 600 500 800C100 1000 -50 900 -200 850V1200H1500V800Z" fill="#0B4F94" opacity="0.04" />
                </svg>
            </div>

            <Header onBack={onBack} />

            <div className="dashboard-content">
                <KPICards kpis={kpis} />

                <Filters
                    options={filterOptions}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                />

                <div className="charts-grid">
                    <DuplicateReportChart data={charts?.duplicate_count_by_report || []} />
                    <EmployeeAmountChart data={charts?.amount_by_employee || []} />
                    <DuplicateTrendChart data={charts?.duplicate_trend || []} />
                    <ApprovalStatusChart data={charts?.approval_status_dist || []} />
                    <DepartmentChart data={charts?.department_dist || []} />
                </div>

                <DataTable filters={filters} onFilterChange={handleFilterChange} debouncedSearch={debouncedSearch} />
            </div>
        </div>
    );
}

export default App;
