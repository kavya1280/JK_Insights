import { useEffect } from 'react';
import { useData } from '../hooks/useData';
import { KPIGrid } from '../components/KPI';
import { Chart } from '../components/Chart';
import { FilterPanel } from '../components/Filter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, Table, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const {
    dashboardData,
    filterOptions,
    fetchDashboardData,
    fetchTableData,
    setCurrentView,
    uploadedFile,
    loading
  } = useData();

  useEffect(() => {
    if (!dashboardData && uploadedFile) {
      fetchDashboardData();
    }
  }, [uploadedFile]);

  const handleApplyFilters = (filters: any) => {
    fetchDashboardData(filters);
  };

  const handleClearFilters = () => {
    fetchDashboardData();
  };

  const handleViewTable = () => {
    fetchTableData({ page: 1, page_size: 25 });
    setCurrentView('table');
  };

  if (loading && !dashboardData) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={48} className="animate-spin" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (useData().error) {
    return (
      <div className="dashboard-empty">
        <div className="text-red-500 mb-4">Error: {useData().error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-empty">
        <FileSpreadsheet size={64} />
        <h2>No Data Available</h2>
        <p>Please upload an Excel file to view the dashboard.</p>
        <Button onClick={() => setCurrentView('upload')}>
          Upload File
        </Button>
      </div>
    );
  }

  const { kpis, charts, file_type } = dashboardData;

  // Determine which charts to show based on file type
  const renderCharts = () => {
    if (file_type === 'PJPA37') {
      return (
        <>
          <div className="chart-row">
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.claims_by_employee || []}
                  type="bar"
                  title="Total Claims by Employee"
                />
              </CardContent>
            </Card>
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.spend_by_employee || []}
                  type="bar"
                  title="Total Spend by Employee"
                />
              </CardContent>
            </Card>
          </div>
          <div className="chart-row">
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.claims_by_policy || []}
                  type="pie"
                  title="Claims by Policy"
                />
              </CardContent>
            </Card>
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.high_risk_employees || []}
                  type="bar"
                  title="High Risk Employees"
                />
              </CardContent>
            </Card>
          </div>
        </>
      );
    } else if (file_type === 'PJPA38') {
      return (
        <>
          <div className="chart-row">
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.flag_distribution || []}
                  type="donut"
                  title="Flag Distribution"
                />
              </CardContent>
            </Card>
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.rare_by_expense || []}
                  type="bar"
                  title="Rare Trips by Expense Type"
                />
              </CardContent>
            </Card>
          </div>
          <div className="chart-row">
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.rare_travellers || []}
                  type="bar"
                  title="Rare Travellers"
                />
              </CardContent>
            </Card>
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.amount_vs_usage || []}
                  type="scatter"
                  title="Amount vs Usage"
                />
              </CardContent>
            </Card>
          </div>
        </>
      );
    } else if (file_type === 'PJPA39') {
      return (
        <>
          <div className="chart-row">
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.emp_by_department || []}
                  type="bar"
                  title="Employees by Department"
                />
              </CardContent>
            </Card>
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.aging_bucket || []}
                  type="bar"
                  title="Aging Bucket"
                />
              </CardContent>
            </Card>
          </div>
          <div className="chart-row">
            <Card className="chart-card">
              <CardContent>
                <Chart
                  data={charts.year_trend || []}
                  type="line"
                  title="Year Trend"
                />
              </CardContent>
            </Card>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-page overflow-x-hidden">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1 className="text-2xl font-bold text-[#0B1F3A]">{dashboardData.filename}</h1>
          <span className="file-type-badge">{file_type}</span>
        </div>
        <div className="header-actions">
          <Button onClick={handleViewTable} variant="outline" className="gap-2">
            <Table size={18} />
            View Table
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        options={filterOptions}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* KPI Cards */}
      <div className="mb-8">
        <KPIGrid kpis={kpis} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderCharts()}
      </div>
    </div>
  );
}
