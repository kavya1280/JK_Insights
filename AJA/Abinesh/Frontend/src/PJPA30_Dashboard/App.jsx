import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import Filters from './components/Filters';
import DataTable from './components/DataTable';
import TotalSpendByEmployeeChart from './components/TotalSpendByEmployeeChart';
import TripsByEmployeeChart from './components/TripsByEmployeeChart';
import AverageTripCostChart from './components/AverageTripCostChart';
import EmployeeTripTrendChart from './components/EmployeeTripTrendChart';
import ReportsOverTimeChart from './components/ReportsOverTimeChart';
import TripsVsSpendBubbleChart from './components/TripsVsSpendBubbleChart';
import '../index.css';

const App = ({ data, onBack }) => {
    const [filters, setFilters] = useState({
        employeeId: [],
        reportId: [],
        reportName: [],
        approvalStatus: []
    });

    const options = useMemo(() => {
        const opts = { employeeId: new Set(), reportId: new Set(), reportName: new Set(), approvalStatus: new Set() };
        (data || []).forEach(row => {
            if (row['Employee ID']) opts.employeeId.add(String(row['Employee ID']));
            if (row['Report Id']) opts.reportId.add(String(row['Report Id']));
            if (row['Report Name']) opts.reportName.add(String(row['Report Name']));
            if (row['Approval Status']) opts.approvalStatus.add(String(row['Approval Status']));
        });
        return {
            employeeId: Array.from(opts.employeeId).sort(),
            reportId: Array.from(opts.reportId).sort(),
            reportName: Array.from(opts.reportName).sort(),
            approvalStatus: Array.from(opts.approvalStatus).sort(),
        };
    }, [data]);

    const filteredData = useMemo(() => {
        return (data || []).filter(row => {
            const matchEmp = filters.employeeId.length === 0 || filters.employeeId.includes(String(row['Employee ID']));
            const matchRep = filters.reportId.length === 0 || filters.reportId.includes(String(row['Report Id']));
            const matchName = filters.reportName.length === 0 || filters.reportName.includes(String(row['Report Name']));
            const matchStatus = filters.approvalStatus.length === 0 || filters.approvalStatus.includes(String(row['Approval Status']));
            return matchEmp && matchRep && matchName && matchStatus;
        });
    }, [data, filters]);

    const kpis = useMemo(() => {
        const emps = new Set();
        const reps = new Set();
        let totalAmt = 0;

        let totalTrips = 0;
        let weekdayTrips = 0;

        filteredData.forEach(row => {
            if (row['Employee Name']) emps.add(row['Employee Name']);

            const repId = row['Report Id'];
            if (repId) reps.add(repId);

            totalAmt += Number(row['Amount Approved'] || 0);

            // We determine weekday vs weekend. A trip usually has a date. We'll check 'Submit Date' or 'Transaction Date'.
            let dStr = row['Submit Date'] || row['Date'] || row['Transaction Date'];
            if (dStr) {
                try {
                    const dt = new Date(dStr);
                    if (!isNaN(dt)) {
                        const day = dt.getDay(); // 0 is Sunday, 6 is Saturday
                        totalTrips++;
                        if (day >= 1 && day <= 5) weekdayTrips++;
                    }
                } catch (e) { }
            }
        });

        const tripCount = reps.size;
        const avgTripCost = tripCount ? totalAmt / tripCount : 0;
        const weekdayPct = totalTrips ? (weekdayTrips / totalTrips) * 100 : 0;
        const weekendPct = totalTrips ? ((totalTrips - weekdayTrips) / totalTrips) * 100 : 0;

        return {
            employeeCount: emps.size,
            totalSpend: totalAmt,
            tripCount,
            avgTripCost,
            weekdayPct,
            weekendPct
        };
    }, [filteredData]);

    const handleResetFilters = () => {
        setFilters({ employeeId: [], reportId: [], reportName: [], approvalStatus: [] });
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
                    <TotalSpendByEmployeeChart data={filteredData} />
                    <TripsByEmployeeChart data={filteredData} />
                    <AverageTripCostChart data={filteredData} />
                    <EmployeeTripTrendChart data={filteredData} />
                    <ReportsOverTimeChart data={filteredData} />
                    <TripsVsSpendBubbleChart data={filteredData} />
                </div>

                <DataTable data={filteredData} />
            </div>
        </div>
    );
};

export default App;
