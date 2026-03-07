import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import Filters from './components/Filters';
import DataTable from './components/DataTable';

import EmployeeClaimCountChart from './components/EmployeeClaimCountChart';
import EmployeeTotalAmountChart from './components/EmployeeTotalAmountChart';
import PolicyClaimsChart from './components/PolicyClaimsChart';
import HighRiskEmployeePolicyChart from './components/HighRiskEmployeePolicyChart';
import AnomalyClusterChart from './components/AnomalyClusterChart';
import AnomalySpendEmployeeChart from './components/AnomalySpendEmployeeChart';

import '../PJPA 32 dashboard/src/index.css';

const API = 'http://localhost:8000/api/pjpa37';

function App({ onBack }) {
    const [filterOptions, setFilterOptions] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        employee_id: '', policy: '', cluster_id: '', is_anomaly: '', search: ''
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
                if (filters.policy) q.append('policy', filters.policy);
                if (filters.cluster_id) q.append('cluster_id', filters.cluster_id);
                if (filters.is_anomaly) q.append('is_anomaly', filters.is_anomaly);

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
    }, [filters.employee_id, filters.policy, filters.cluster_id, filters.is_anomaly, debouncedSearch]);

    const handleFilterChange = (newFilters) => setFilters(newFilters);
    const handleResetFilters = () => setFilters({
        employee_id: '', policy: '', cluster_id: '', is_anomaly: '', search: ''
    });

    const [initialLoading, setInitialLoading] = useState(true);
    useEffect(() => {
        if (!loading && initialLoading) setInitialLoading(false);
    }, [loading, initialLoading]);

    if (initialLoading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Initializing Anomaly Detection dashboard...</p>
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
        <div className="dashboard pjpa37-dashboard">
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
                    <EmployeeClaimCountChart data={charts?.total_claim_employee || []} />
                    <EmployeeTotalAmountChart data={charts?.total_spend_employee || []} />
                    <PolicyClaimsChart data={charts?.total_claims_policy || []} />
                    <HighRiskEmployeePolicyChart data={charts?.high_risk_employee_policy || []} />
                    <AnomalyClusterChart data={charts?.anomaly_count_cluster || []} />
                    <AnomalySpendEmployeeChart data={charts?.anomaly_spend_employee || []} />
                </div>

                <DataTable filters={filters} onFilterChange={handleFilterChange} debouncedSearch={debouncedSearch} />
            </div>
        </div>
    );
}

export default App;
