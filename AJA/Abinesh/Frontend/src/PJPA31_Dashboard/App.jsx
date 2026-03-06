import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import Filters from './components/Filters';
import DataTable from './components/DataTable';
import BillsByCategoryChart from './components/BillsByCategoryChart';
import SplittingAmountDistributionChart from './components/SplittingAmountDistributionChart';
import SplittingCasesByRegionMap from './components/SplittingCasesByRegionMap';
import SpendSplitOverTimeChart from './components/SpendSplitOverTimeChart';
import TopEmployeesSplittingChart from './components/TopEmployeesSplittingChart';
import ApprovalStatusDonutChart from './components/ApprovalStatusDonutChart';
import '../index.css';

const App = ({ data, onBack }) => {
    const [filters, setFilters] = useState({
        employeeName: [],
        department: [],
        reportId: [],
        riskCategory: []
    });

    const options = useMemo(() => {
        const opts = { employeeName: new Set(), department: new Set(), reportId: new Set(), riskCategory: new Set() };
        (data || []).forEach(row => {
            if (row['Employee Name']) opts.employeeName.add(String(row['Employee Name']));
            if (row['Department']) opts.department.add(String(row['Department']));
            if (row['Report Id']) opts.reportId.add(String(row['Report Id']));
            if (row['Risk Category']) opts.riskCategory.add(String(row['Risk Category']));
        });
        return {
            employeeName: Array.from(opts.employeeName).sort(),
            department: Array.from(opts.department).sort(),
            reportId: Array.from(opts.reportId).sort(),
            riskCategory: Array.from(opts.riskCategory).sort(),
        };
    }, [data]);

    const filteredData = useMemo(() => {
        return (data || []).filter(row => {
            const matchEmpName = filters.employeeName.length === 0 || filters.employeeName.includes(String(row['Employee Name']));
            const matchDept = filters.department.length === 0 || filters.department.includes(String(row['Department']));
            const matchRepId = filters.reportId.length === 0 || filters.reportId.includes(String(row['Report Id']));
            const matchRisk = filters.riskCategory.length === 0 || filters.riskCategory.includes(String(row['Risk Category']));
            return matchEmpName && matchDept && matchRepId && matchRisk;
        });
    }, [data, filters]);

    const kpis = useMemo(() => {
        let splitSpend = 0;
        const splitMap = new Map(); // Grouping by Report Id + Policy/Expense Type + Date etc

        // We treat every row as a potential split row since this is the "Splitting Abuse" dataset,
        // or we just define total occurrences and spend
        let count = filteredData.length;

        filteredData.forEach(row => {
            const amt = Number(row['Amount Approved'] || 0);
            splitSpend += amt;
        });

        const splitCount = count;

        // Dummy percentage logic if we don't have total unfiltered values or an underlying total.
        // If we want accurate %, we'd compare against 'data' instead of 'filteredData' as total 
        // but typically dashboards compute against total. As a placeholder based on prompt:
        const baseTotalCount = data ? data.length : 1;
        const baseTotalSpend = data ? data.reduce((s, r) => s + Number(r['Amount Approved'] || 0), 0) : 1;

        const splitPctCount = baseTotalCount ? (splitCount / baseTotalCount) * 100 : 0;
        const splitPctSpend = baseTotalSpend ? (splitSpend / baseTotalSpend) * 100 : 0;

        // Max/Min Split Count logic - group by Report ID or Employee to find who splits most
        const grouped = new Map();
        filteredData.forEach(row => {
            const key = row['Report Id'] || row['Employee Name'] || 'Unknown';
            grouped.set(key, (grouped.get(key) || 0) + 1);
        });

        const splitValues = Array.from(grouped.values());
        const maxSplit = splitValues.length ? Math.max(...splitValues) : 0;
        const minSplit = splitValues.length ? Math.min(...splitValues) : 0;

        return {
            splitCount,
            splitSpend,
            splitPctCount,
            splitPctSpend,
            maxSplit,
            minSplit
        };
    }, [filteredData, data]);

    const handleResetFilters = () => {
        setFilters({ employeeName: [], department: [], reportId: [], riskCategory: [] });
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

            <Header onBack={onBack} />
            <div className="dashboard-content">
                <KPICards kpis={kpis} />

                <Filters
                    options={options}
                    filters={filters}
                    onFilterChange={setFilters}
                    onReset={handleResetFilters}
                />

                <div className="charts-grid">
                    <BillsByCategoryChart data={filteredData} />
                    <SplittingAmountDistributionChart data={filteredData} />
                    <SplittingCasesByRegionMap data={filteredData} />
                    <SpendSplitOverTimeChart data={filteredData} />
                    <TopEmployeesSplittingChart data={filteredData} />
                    <ApprovalStatusDonutChart data={filteredData} />
                </div>

                <DataTable data={filteredData} />
            </div>
        </div>
    );
};

export default App;
