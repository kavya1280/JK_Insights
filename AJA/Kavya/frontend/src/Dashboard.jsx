import React, { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const Dashboard = ({ data, onBackToTable }) => {
    // Aggregation helper: Sums "Amount Approved" based on a specific category
    const aggregate = (field) => {
        const summary = data.reduce((acc, item) => {
            const category = item[field] || "N/A";
            const value = parseFloat(String(item["Amount Approved"]).replace(/,/g, "")) || 0;
            acc[category] = (acc[category] || 0) + value;
            return acc;
        }, {});
        return Object.entries(summary).map(([category, value]) => ({ category, value }));
    };

    return (
        <div style={{ background: "#f0f2f5", padding: "24px", borderRadius: "16px", width: "100%" }}>
            {/* Dashboard Header mimicking PJPA27 design */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", border: "5px solid #f0fff4", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                        <span style={{ fontWeight: "900", color: "#16a34a", fontSize: "18px" }}>PJPA27</span>
                    </div>
                    <h2 style={{ color: "#16a34a", fontSize: "28px", fontWeight: "700" }}>Notice Period Expense Risk</h2>
                </div>
                <button onClick={onBackToTable} style={{ padding: "12px 24px", background: "#05192d", color: "white", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
                    ← Back to Table View
                </button>
            </div>

            {/* KPI Section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "25px" }}>
                {[
                    { label: "Employee", val: new Set(data.map(d => d["Employee ID"])).size },
                    { label: "Critical Risks", val: data.filter(d => d["Risk Category"] === "CRITICAL").length },
                    { label: "High Risks", val: data.filter(d => d["Risk Category"] === "HIGH").length },
                    { label: "Avg Spend", val: "65.1K" },
                    { label: "Risk Spend", val: "17.8M" },
                    { label: "Approved", val: "34.9M" }
                ].map((kpi, idx) => (
                    <div key={idx} style={{ background: "white", padding: "18px", borderRadius: "14px", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
                        <div style={{ fontSize: "22px", fontWeight: "900", color: "#05192d" }}>{kpi.val}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase", marginTop: "4px" }}>{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Grid Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                <ChartCard title="Amount Distribution across Risk Category">
                    <DonutChart data={aggregate("Risk Category")} />
                </ChartCard>
                <ChartCard title="Amount Distribution by Employee">
                    <BarChart data={aggregate("Employee Name").slice(0, 10)} isHorizontal={true} />
                </ChartCard>
                <ChartCard title="Amount Approved by Days of Separation">
                    <BarChart data={aggregate("Notice Period Days").slice(0, 15)} />
                </ChartCard>
                <ChartCard title="Amount Distribution across Policy">
                    <PieChart data={aggregate("Policy")} />
                </ChartCard>
            </div>
        </div>
    );
};

const ChartCard = ({ title, children }) => (
    <div style={{ background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        <h4 style={{ marginBottom: "15px", fontSize: "13px", color: "#475569", textAlign: "center", fontWeight: "700" }}>{title}</h4>
        <div style={{ height: "320px" }}>{children}</div>
    </div>
);

// --- Individual amCharts Components ---

const DonutChart = ({ data }) => {
    const ref = useRef(null);
    useLayoutEffect(() => {
        let root = am5.Root.new(ref.current);
        root.setThemes([am5themes_Animated.new(root)]);
        let chart = root.container.children.push(am5percent.PieChart.new(root, { innerRadius: am5.percent(50) }));
        let series = chart.series.push(am5percent.PieSeries.new(root, { valueField: "value", categoryField: "category" }));
        series.data.setAll(data);
        series.appear(1000, 100);
        return () => root.dispose();
    }, [data]);
    return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};

const BarChart = ({ data, isHorizontal = false }) => {
    const ref = useRef(null);
    useLayoutEffect(() => {
        let root = am5.Root.new(ref.current);
        root.setThemes([am5themes_Animated.new(root)]);
        let chart = root.container.children.push(am5xy.XYChart.new(root, { panX: false, panY: false, wheelX: "none", wheelY: "none" }));
        let xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 30 });
        let yRenderer = am5xy.AxisRendererY.new(root, { minGridDistance: 20 });

        let xAxis, yAxis;
        if (isHorizontal) {
            yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "category", renderer: yRenderer }));
            xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, { renderer: xRenderer }));
        } else {
            xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "category", renderer: xRenderer }));
            yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { renderer: yRenderer }));
        }

        let series = chart.series.push(am5xy.ColumnSeries.new(root, {
            xAxis: xAxis, yAxis: yAxis,
            valueXField: isHorizontal ? "value" : undefined,
            valueYField: isHorizontal ? undefined : "value",
            categoryXField: isHorizontal ? undefined : "category",
            categoryYField: isHorizontal ? "category" : undefined
        }));

        series.columns.template.setAll({ cornerRadiusTL: 5, cornerRadiusTR: 5, strokeOpacity: 0 });
        xAxis.data.setAll(data);
        yAxis.data ? yAxis.data.setAll(data) : null;
        series.data.setAll(data);
        series.appear(1000);
        return () => root.dispose();
    }, [data]);
    return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};

const PieChart = ({ data }) => {
    const ref = useRef(null);
    useLayoutEffect(() => {
        let root = am5.Root.new(ref.current);
        root.setThemes([am5themes_Animated.new(root)]);
        let chart = root.container.children.push(am5percent.PieChart.new(root, {}));
        let series = chart.series.push(am5percent.PieSeries.new(root, { valueField: "value", categoryField: "category" }));
        series.data.setAll(data);
        series.appear(1000, 100);
        return () => root.dispose();
    }, [data]);
    return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};

export default Dashboard;