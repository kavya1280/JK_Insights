import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import Filters from './components/Filters';
import ColumnChart from './components/ColumnChart';
import DonutChart from './components/DonutChart';
import EmployeeBarChart from './components/EmployeeBarChart';
import LocationMap from './components/LocationMap';
import TrendLineChart from './components/TrendLineChart';
// Remove unused import
import HolidayClaimsChart from './components/HolidayClaimsChart';
import EmployeeBandChart from './components/EmployeeBandChart';
import DataTable from './components/DataTable';
import './index.css';

function App({ onBack }) {
  const [filterOptions, setFilterOptions] = useState(null);
  const [stats, setStats] = useState({
    kpis: null,
    weekendData: [],
    expenseDistribution: [],
    employeeData: [],
    locationData: [],
    holiday_claims: [],
    band_claims: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    employee_id: '',
    employee: '',
    reportId: '',
    expenseType: '',
    startDate: '',
    endDate: '',
    location: '',
    search: ''
  });


  // Fetch filter options once
  useEffect(() => {
    fetch('http://localhost:5000/api/pjpa32/filters')
      .then(res => res.json())
      .then(data => setFilterOptions(data))
      .catch(err => console.error("Filter options fetch error:", err));
  }, []);

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Debounce search separately
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  // Fetch all stats whenever filters change (categorical instant, search debounced)
  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (filters.employee_id) queryParams.append('employee_id', filters.employee_id);
        if (filters.employee) queryParams.append('employee', filters.employee);
        if (filters.report_id) queryParams.append('report_id', filters.report_id);
        if (filters.expense_type) queryParams.append('expense_type', filters.expense_type);
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (debouncedSearch) queryParams.append('search', debouncedSearch);


        const response = await fetch(`http://localhost:8000/api/pjpa32/stats?${queryParams}`);
        const data = await response.json();

        setStats({
          kpis: data.kpis || {},
          weekendData: data.weekend_data || [],
          expenseDistribution: data.expense_distribution || [],
          employeeData: data.employee_data || [],
          locationData: data.location_data || [],
          holiday_claims: data.holiday_claims || [],
          band_claims: data.band_claims || []
        });
        setError(null);
      } catch (err) {
        console.error("Stats Fetch error:", err);
        setError("Failed to fetch dashboard data. Please check if the backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [filters.employee_id, filters.employee, filters.report_id, filters.expense_type, filters.location, filters.startDate, filters.endDate, debouncedSearch]);


  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      employeeId: '',
      employee: '',
      reportId: '',
      expenseType: '',
      location: '',
      search: ''
    });
  };


  const [initialLoading, setInitialLoading] = useState(true);

  // Initial load effect
  useEffect(() => {
    if (!loading && initialLoading) {
      setInitialLoading(false);
    }
  }, [loading, initialLoading]);

  if (initialLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Initializing enterprise travel dashboard...</p>
      </div>
    );
  }

  if (error && !stats.kpis) { // Only show full error if we have no data at all
    return (
      <div className="dashboard-error">
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="abstract-background">
        <svg viewBox="0 0 1440 1024" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 0H1440V1024H0V0Z" fill="#F4F6F8" />
          <path d="M-100 200C150 400 450 -100 800 150C1150 400 1300 200 1500 350V-100H-100V200Z" fill="#6FAE2C" opacity="0.07" />
          <path d="M1500 800C1100 1100 900 600 500 800C100 1000 -50 900 -200 850V1200H1500V800Z" fill="#0B4F94" opacity="0.06" />
          <path d="M-200 600C200 650 350 300 700 450C1050 600 1200 400 1600 500V1200H-200V600Z" fill="#A6A6A6" opacity="0.04" />
          <path d="M1600 100C1300 300 1100 -50 700 100C300 250 100 50 -100 150V-200H1600V100Z" fill="#6FAE2C" opacity="0.05" />
        </svg>
      </div>

      <Header onBack={onBack} />
      <div className="dashboard-content">
        <KPICards kpis={stats.kpis} />

        <Filters
          options={filterOptions}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <div className="charts-grid second-row">
          <EmployeeBarChart data={stats.employeeData} isAggregated={true} title="Amount Approved per Employee" />
          <ColumnChart data={stats.weekendData} isAggregated={true} title="Amount Approved by Weekend" />
          <DonutChart data={stats.expenseDistribution} isAggregated={true} title="Amount Distribution Across Expense Type" />
          <LocationMap data={stats.locationData} isAggregated={true} title="Amount Approved by Location" />

          <HolidayClaimsChart data={stats.holiday_claims} />
          <EmployeeBandChart data={stats.band_claims} />

        </div>

        <DataTable
          filters={filters}
          onFilterChange={handleFilterChange}
          debouncedSearch={debouncedSearch}
        />
      </div>
    </div>
  );
}

export default App;