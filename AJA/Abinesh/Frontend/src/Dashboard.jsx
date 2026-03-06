import React, { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const Dashboard = ({ data, moduleId, onBackToTable }) => {
    // Aggregation helper: Sums a specific value field based on a category field
    const aggregate = (field, valueField = "Amount Approved") => {
        const summary = data.reduce((acc, item) => {
            const category = item[field] || "N/A";
            const rawValue = item[valueField] || item["Approved Amount"] || item["Total Approved Amount"] || 0;
            const value = parseFloat(String(rawValue).replace(/,/g, "")) || 0;
            acc[category] = (acc[category] || 0) + value;
            return acc;
        }, {});
        return Object.entries(summary)
            .map(([category, value]) => ({ category, value }))
            .sort((a, b) => b.value - a.value);
    };

    // Configuration for different insight modules
    const configs = {
        "PJPA27": {
            title: "Notice Period Expense Risk",
            color: "#16a34a",
            kpis: [
                { label: "Employees", val: new Set(data.map(d => d["Employee ID"])).size },
                { label: "Critical Risks", val: data.filter(d => d["Risk Category"] === "CRITICAL").length },
                { label: "High Risks", val: data.filter(d => d["Risk Category"] === "HIGH").length },
                { label: "Total Approved", val: (data.reduce((sum, item) => sum + (parseFloat(String(item["Amount Approved"]).replace(/,/g, "")) || 0), 0) / 1000000).toFixed(1) + "M" }
            ],
            charts: [
                { title: "Amount Distribution across Risk Category", type: "donut", field: "Risk Category" },
                { title: "Top 10 Employees by Risk Spend", type: "bar", field: "Employee Name", horizontal: true, limit: 10 },
                { title: "Amount Approved by Days of Separation", type: "bar", field: "Notice Period Days", limit: 15 },
                { title: "Amount Distribution across Policy", type: "pie", field: "Policy" }
            ]
        },
        "PJPA32_HOL": {
            title: "Holiday Travel Exceptions",
            color: "#3b82f6", // Blue
            kpis: [
                { label: "Total Exceptions", val: data.length },
                { label: "Unique Employees", val: new Set(data.map(d => d["Employee ID"])).size },
                { label: "Total Spend", val: (data.reduce((sum, item) => sum + (parseFloat(String(item["Approved Amount"]).replace(/,/g, "")) || 0), 0) / 1000).toFixed(1) + "K" },
                { label: "Avg per Claim", val: data.length > 0 ? (data.reduce((sum, item) => sum + (parseFloat(String(item["Approved Amount"]).replace(/,/g, "")) || 0), 0) / data.length).toFixed(0) : 0 }
            ],
            charts: [
                { title: "Spend by Holiday", type: "donut", field: "Holiday Name" },
                { title: "Top 10 Employees (Holiday)", type: "bar", field: "Employee", horizontal: true, limit: 10 },
                { title: "Spend by Expense Type", type: "bar", field: "Expense Type", limit: 10 },
                { title: "Spend by Location", type: "pie", field: "City/Location" }
            ]
        },
        "PJPA32_WE": {
            title: "Weekend Travel Exceptions",
            color: "#f59e0b", // Amber
            kpis: [
                { label: "Total Exceptions", val: data.length },
                { label: "Unique Employees", val: new Set(data.map(d => d["Employee ID"])).size },
                { label: "Total Spend", val: (data.reduce((sum, item) => sum + (parseFloat(String(item["Approved Amount"]).replace(/,/g, "")) || 0), 0) / 1000).toFixed(1) + "K" },
                { label: "Avg per Claim", val: data.length > 0 ? (data.reduce((sum, item) => sum + (parseFloat(String(item["Approved Amount"]).replace(/,/g, "")) || 0), 0) / data.length).toFixed(0) : 0 }
            ],
            charts: [
                { title: "Spend by Day of Week", type: "donut", field: "Day of Week (Name)" },
                { title: "Top 10 Employees (Weekend)", type: "bar", field: "Employee", horizontal: true, limit: 10 },
                { title: "Spend by Expense Type", type: "bar", field: "Expense Type", limit: 10 },
                { title: "Spend by Location", type: "pie", field: "City/Location" }
            ]
        }
    };

    const currentConfig = configs[moduleId] || configs["PJPA27"]; // Fallback to PJPA27

    return (
        <div style={{ background: "#f0f2f5", padding: "24px", borderRadius: "24px", width: "100%", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.05)" }}>
            {/* Dashboard Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", border: `5px solid ${currentConfig.color}22`, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
                        <span style={{ fontWeight: "900", color: currentConfig.color, fontSize: "16px" }}>{moduleId.split('_')[0]}</span>
                    </div>
                    <div>
                        <h2 style={{ color: "#05192d", fontSize: "28px", fontWeight: "800", marginBottom: "4px" }}>{currentConfig.title}</h2>
                        <div style={{ height: "4px", width: "60px", background: currentConfig.color, borderRadius: "2px" }}></div>
                    </div>
                </div>
                <button onClick={onBackToTable} style={{ padding: "12px 24px", background: "#05192d", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", transition: "0.3s", boxShadow: "0 4px 12px rgba(5,25,45,0.2)" }}>
                    ← Back to Table View
                </button>
            </div>

            {/* KPI Section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
                {currentConfig.kpis.map((kpi, idx) => (
                    <div key={idx} style={{ background: "white", padding: "24px", borderRadius: "20px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: currentConfig.color }}></div>
                        <div style={{ fontSize: "28px", fontWeight: "900", color: "#05192d" }}>{kpi.val}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase", marginTop: "8px", letterSpacing: "1px" }}>{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Grid Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                {currentConfig.charts.map((chart, idx) => (
                    <ChartCard key={idx} title={chart.title}>
                        {chart.type === "donut" && <DonutChart data={aggregate(chart.field).slice(0, chart.limit || 10)} />}
                        {chart.type === "bar" && <BarChart data={aggregate(chart.field).slice(0, chart.limit || 10)} isHorizontal={chart.horizontal} />}
                        {chart.type === "pie" && <PieChart data={aggregate(chart.field).slice(0, chart.limit || 10)} />}
                    </ChartCard>
                ))}
            </div>
        </div>
    );
};

const ChartCard = ({ title, children }) => (
    <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 15px 35px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
        <h4 style={{ marginBottom: "20px", fontSize: "14px", color: "#475569", textAlign: "left", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h4>
        <div style={{ height: "300px" }}>{children}</div>
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