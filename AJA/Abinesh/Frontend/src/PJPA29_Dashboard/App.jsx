import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import Filters from './components/Filters';
import DataTable from './components/DataTable';
import SpeedOfSpendingChart from './components/SpeedOfSpendingChart';
import AmountVsDurationChart from './components/AmountVsDurationChart';
import DateBasedSpendingChart from './components/DateBasedSpendingChart';
import AmountByPolicyChart from './components/AmountByPolicyChart';
import AmountByStateMap from './components/AmountByStateMap';
import '../index.css';

const App = ({ data, onBack }) => {
    const [filters, setFilters] = useState({
        employeeId: [],
        gender: [],
        policy: [],
        region: [],
        reportingManager: [],
        state: []
    });

    // Extract unique options for filters
    const options = useMemo(() => {
        const opts = { employeeId: new Set(), gender: new Set(), policy: new Set(), region: new Set(), reportingManager: new Set(), state: new Set() };
        (data || []).forEach(row => {
            if (row['Employee ID']) opts.employeeId.add(String(row['Employee ID']));
            if (row['Gender']) opts.gender.add(String(row['Gender']));
            if (row['Policy']) opts.policy.add(String(row['Policy']));
            if (row['Region']) opts.region.add(String(row['Region']));
            if (row['Reporting Manager']) opts.reportingManager.add(String(row['Reporting Manager']));
            if (row['State']) opts.state.add(String(row['State']));
        });
        return {
            employeeId: Array.from(opts.employeeId).sort(),
            gender: Array.from(opts.gender).sort(),
            policy: Array.from(opts.policy).sort(),
            region: Array.from(opts.region).sort(),
            reportingManager: Array.from(opts.reportingManager).sort(),
            state: Array.from(opts.state).sort()
        };
    }, [data]);

    // Apply filters locally
    const filteredData = useMemo(() => {
        return (data || []).filter(row => {
            const matchEmp = filters.employeeId.length === 0 || filters.employeeId.includes(String(row['Employee ID']));
            const matchGender = filters.gender.length === 0 || filters.gender.includes(String(row['Gender']));
            const matchPolicy = filters.policy.length === 0 || filters.policy.includes(String(row['Policy']));
            const matchRegion = filters.region.length === 0 || filters.region.includes(String(row['Region']));
            const matchMgr = filters.reportingManager.length === 0 || filters.reportingManager.includes(String(row['Reporting Manager']));
            const matchState = filters.state.length === 0 || filters.state.includes(String(row['State']));
            return matchEmp && matchGender && matchPolicy && matchRegion && matchMgr && matchState;
        });
    }, [data, filters]);

    // Compute KPIs
    const kpis = useMemo(() => {
        const empIds = new Set();
        const repIds = new Set();
        const depts = new Set();
        let totalAmt = 0;
        let totalDuration = 0;
        let durationCount = 0;
        let highCrit = 0;

        filteredData.forEach(row => {
            if (row['Employee ID']) empIds.add(row['Employee ID']);
            if (row['Report Id']) repIds.add(row['Report Id']);
            if (row['Department']) depts.add(row['Department']);

            totalAmt += Number(row['Amount Approved'] || 0);

            const dur = Number(row['Claim Duration']);
            if (!isNaN(dur)) {
                totalDuration += dur;
                durationCount++;
            }

            const risk = String(row['Risk Category']).toLowerCase();
            if (risk === 'high' || risk === 'critical') {
                highCrit++;
            }
        });

        return {
            distinctEmployeeIds: empIds.size,
            countReports: repIds.size,
            distinctDepartments: depts.size,
            totalAmount: totalAmt,
            avgClaimDuration: durationCount ? (totalDuration / durationCount) : 0,
            highCriticalClaims: highCrit
        };
    }, [filteredData]);

    const handleResetFilters = () => {
        setFilters({ employeeId: [], gender: [], policy: [], region: [], reportingManager: [], state: [] });
    };

    return (
        <div className="dashboard">
            <div className="abstract-background">
                <svg viewBox="0 0 1440 1024" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 0H1440V1024H0V0Z" fill="#F4F6F8" />
                    <path d="M-100 200C150 400 450 -100 800 150C1150 400 1300 200 1500 350V-100H-100V200Z" fill="#6FAE2C" opacity="0.07" />
                    <path d="M1500 800C1100 1100 900 600 500 800C100 1000 -50 900 -200 850V1200H1500V800Z" fill="#0B4F94" opacity="0.06" />
                </svg>
            </div>

            <Header onBack={onBack} title="New Joiner Early Claims" subtitle="PJPA29 · Human Resources Analysis" />
            <div className="dashboard-content">
                <KPICards kpis={kpis} />

                <Filters
                    options={options}
                    filters={filters}
                    onFilterChange={setFilters}
                    onReset={handleResetFilters}
                />

                <div className="charts-grid">
                    <SpeedOfSpendingChart data={filteredData} />
                    <AmountVsDurationChart data={filteredData} />
                    <DateBasedSpendingChart data={filteredData} />
                    <AmountByPolicyChart data={filteredData} />
                    <AmountByStateMap data={filteredData} />
                </div>

                <DataTable data={filteredData} />
            </div>
        </div>
    );
};

export default App;
