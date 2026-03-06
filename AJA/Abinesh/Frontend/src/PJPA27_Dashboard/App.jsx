import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import Filters from './components/Filters';
import DonutChart from './components/DonutChart';
import HorizontalBarChart from './components/HorizontalBarChart';
import VerticalBarChart from './components/VerticalBarChart';
import PieChart from './components/PieChart';
import DesignationBarChart from './components/DesignationBarChart';
import LineChart from './components/LineChart';
import DataTable from './components/DataTable';
import './index.css';

const API = 'http://localhost:8000/api/pjpa27';

function App({ onBack }) {
    const [filterOptions, setFilterOptions] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        employee_id: '', payment_status: '', risk_category: '',
        policy: '', designation: '', search: ''
    });

    // Fetch filter options once
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

    // Fetch KPIs and charts on filter change
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const q = new URLSearchParams();
                if (filters.employee_id) q.append('employee_id', filters.employee_id);
                if (filters.payment_status) q.append('payment_status', filters.payment_status);
                if (filters.risk_category) q.append('risk_category', filters.risk_category);
                if (filters.policy) q.append('policy', filters.policy);
                if (filters.designation) q.append('designation', filters.designation);
                if (debouncedSearch) q.append('search', debouncedSearch);

                const [kpiRes, chartRes] = await Promise.all([
                    fetch(`${API}/kpis?${q}`).then(r => r.json()),
                    fetch(`${API}/charts?${q}`).then(r => r.json())
                ]);
                setKpis(kpiRes);
                setCharts(chartRes);
                setError(null);
            } catch (err) {
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [filters.employee_id, filters.payment_status, filters.risk_category, filters.policy, filters.designation, debouncedSearch]);

    const handleFilterChange = (newFilters) => setFilters(newFilters);
    const handleResetFilters = () => setFilters({
        employee_id: '', payment_status: '', risk_category: '',
        policy: '', designation: '', search: ''
    });

    const [initialLoading, setInitialLoading] = useState(true);
    useEffect(() => {
        if (!loading && initialLoading) setInitialLoading(false);
    }, [loading, initialLoading]);

    if (initialLoading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Initializing Notice Period Expense Risk dashboard...</p>
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
        <div className="dashboard pjpa27-dashboard">
            <div className="abstract-background">
                <svg viewBox="0 0 1440 1024" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 0H1440V1024H0V0Z" fill="#F4F6F8" />
                    <path d="M-100 200C150 400 450 -100 800 150C1150 400 1300 200 1500 350V-100H-100V200Z" fill="#6FAE2C" opacity="0.07" />
                    <path d="M1500 800C1100 1100 900 600 500 800C100 1000 -50 900 -200 850V1200H1500V800Z" fill="#0B4F94" opacity="0.06" />
                    <path d="M-200 600C200 650 350 300 700 450C1050 600 1200 400 1600 500V1200H-200V600Z" fill="#A6A6A6" opacity="0.04" />
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
                    <DonutChart data={charts?.risk_distribution || []} />
                    <HorizontalBarChart data={charts?.employee_amount || []} title="Amount Distribution by Employee" />
                    <VerticalBarChart data={charts?.separation_days || []} />
                    <PieChart data={charts?.policy_distribution || []} />
                    <DesignationBarChart data={charts?.designation_amount || []} />
                    <LineChart data={charts?.resignation_trend || []} />
                </div>

                <DataTable filters={filters} onFilterChange={handleFilterChange} debouncedSearch={debouncedSearch} />
            </div>
        </div>
    );
}

export default App;
