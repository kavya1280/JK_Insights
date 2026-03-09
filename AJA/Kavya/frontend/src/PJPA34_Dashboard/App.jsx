import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import Filters from './components/Filters';
import DataTable from './components/DataTable';

import MonthlyClaimAmountByEmployeeChart from './components/EmployeeTotalAmountChart';
import FrequencyVsCostChart from './components/EmployeeClaimCountChart';
import ReportIDClaimMapChart from './components/ReportIDClaimMapChart';
import MonthlyClaimCountAreaChart from './components/MonthlyClaimCountAreaChart';
import AverageClaimAmountByEmployeeChart from './components/AverageClaimAmountByEmployeeChart';
import TotalClaimAmountByPolicyChart from './components/TotalClaimAmountByPolicyChart';

import '../PJPA 32 dashboard/src/index.css';

const API = 'http://localhost:5000/api/pjpa34';

function App({ onBack }) {
    const [filterOptions, setFilterOptions] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        employee_id: '', report_id: '', report_number: '', payment_status: '',
        policy: '', month: '', startDate: '', endDate: '', search: ''
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
                if (filters.report_id) q.append('report_id', filters.report_id);
                if (filters.report_number) q.append('report_number', filters.report_number);
                if (filters.payment_status) q.append('payment_status', filters.payment_status);
                if (filters.policy) q.append('policy', filters.policy);
                if (filters.month) q.append('month', filters.month);
                if (filters.startDate) q.append('startDate', filters.startDate);
                if (filters.endDate) q.append('endDate', filters.endDate);

                if (debouncedSearch) q.append('search', debouncedSearch);

                const response = await fetch(`${API}/stats?${q}`);
                const data = await response.json();
                setKpis(data.kpis);
                setCharts(data.charts);
                setError(null);
            } catch (err) {
                setError("Failed to load dashboard data. Ensure backend is running.");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [filters.employee_id, filters.report_id, filters.report_number, filters.payment_status, filters.policy, filters.month, filters.startDate, filters.endDate, debouncedSearch]);

    const handleFilterChange = (newFilters) => setFilters(newFilters);
    const handleResetFilters = () => setFilters({
        employee_id: '', report_id: '', report_number: '', payment_status: '',
        policy: '', month: '', startDate: '', endDate: '', search: ''
    });

    const [initialLoading, setInitialLoading] = useState(true);
    useEffect(() => {
        if (!loading && initialLoading) setInitialLoading(false);
    }, [loading, initialLoading]);

    if (initialLoading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Initializing High-Frequency Low Value Claims dashboard...</p>
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
        <div className="dashboard pjpa34-dashboard">
            <div className="abstract-background">
                <svg viewBox="0 0 1440 1024" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 0H1440V1024H0V0Z" fill="#F4F6F8" />
                    <path d="M-100 200C150 400 450 -100 800 150C1150 400 1300 200 1500 350V-100H-100V200Z" fill="#6FAE2C" opacity="0.07" />
                    <path d="M1500 800C1100 1100 900 600 500 800C100 1000 -50 900 -200 850V1200H1500V800Z" fill="#0B4F94" opacity="0.06" />
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
                    <MonthlyClaimAmountByEmployeeChart data={charts?.monthly_claim_amount_employee || []} />
                    <FrequencyVsCostChart data={charts?.frequency_cost || []} />
                    <ReportIDClaimMapChart data={charts?.report_claim_map || []} />
                    <MonthlyClaimCountAreaChart data={charts?.monthly_claim_count || []} />
                    <AverageClaimAmountByEmployeeChart data={charts?.avg_claim_employee || []} />
                    <TotalClaimAmountByPolicyChart data={charts?.policy_claim_amount || []} />
                </div>

                <DataTable filters={filters} onFilterChange={handleFilterChange} debouncedSearch={debouncedSearch} />
            </div>
        </div>
    );
}

export default App;
