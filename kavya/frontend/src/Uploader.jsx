import React, { useState, useRef } from "react";
import "./uploader.css";
import uploaderImg from "./assets/images/upload.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";

// Import Charting library if installed, otherwise we use a simple list for demo
// npm install recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const INSIGHT_OPTIONS = [
  { id: "PJPA27", label: "PJPA27 - Notice Period Expense Risk" },
  { id: "PJPA28", label: "PJPA28 - Benford's Law" },
  { id: "PJPA29", label: "PJPA29 - Split Expenses" },
  { id: "PJPA30", label: "PJPA30 - Short Trip Frequency Abuse Dashboard" },
  { id: "PJPA39", label: "PJPA39 - Separated Employee Marked as Active" },
];

const Uploader = ({ logo, handleLogout }) => {
  const [step, setStep] = useState("idle"); // idle, setup, processing, completed
  const [viewMode, setViewMode] = useState("uploader"); // uploader, dashboard, table
  const [files, setFiles] = useState([]);
  const [selectedInsight, setSelectedInsight] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const inputRef = useRef(null);

  const processFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter((f) =>
      /\.(xlsx|xls|csv|tsv)$/i.test(f.name)
    );
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRunAnalysis = async () => {
    if (!selectedInsight || files.length === 0) return alert("Select insight and files.");

    setStep("processing");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("insight_id", selectedInsight);

    try {
      const response = await fetch("http://localhost:5000/upload_excel", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data); // Stores kpis, charts, table from PJPA39.py
        setStep("completed");
      } else {
        alert("Upload failed. Please check backend.");
        setStep("setup");
      }
    } catch (err) {
      alert("Server not reachable.");
      setStep("setup");
    }
  };

  const resetAll = () => {
    setStep("idle");
    setViewMode("uploader");
    setFiles([]);
    setSelectedInsight("");
    setAnalysisData(null);
  };

  // --- SUB-COMPONENT: DASHBOARD VIEW ---
  const renderDashboard = () => (
    <div className="view-container animate-in">
      <div className="view-header">
        <button className="back-btn" onClick={() => setViewMode("uploader")}>← Back</button>
        <h2>{selectedInsight} Analysis Dashboard</h2>
      </div>

      <div className="kpi-grid">
        {analysisData?.kpis?.map((kpi, i) => (
          <div key={i} className="kpi-card">
            <span className="kpi-label">{kpi.label}</span>
            <span className="kpi-value">{kpi.value}</span>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        {analysisData?.charts?.map((chart, i) => (
          <div key={i} className="chart-box">
            <h4>{chart.title}</h4>
            <ResponsiveContainer width="100%" height={250}>
              {chart.type === 'line' ? (
                <LineChart data={chart.data}>
                  <XAxis dataKey="category" /> <YAxis /> <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#00df81" />
                </LineChart>
              ) : (
                <BarChart data={chart.data}>
                  <XAxis dataKey="category" /> <YAxis /> <Tooltip />
                  <Bar dataKey="value" fill="#05192d" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );

  // --- SUB-COMPONENT: TABLE VIEW ---
  const renderTable = () => (
    <div className="view-container animate-in">
      <div className="view-header">
        <button className="back-btn" onClick={() => setViewMode("uploader")}>← Back</button>
        <h2>Data Preview</h2>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {analysisData?.table?.length > 0 && Object.keys(analysisData.table[0]).map(key => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysisData?.table?.slice(0, 50).map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- MAIN RENDER LOGIC ---
  if (viewMode === "dashboard") return renderDashboard();
  if (viewMode === "table") return renderTable();

  return (
    <div className="up-page-wrapper">
      <nav className="up-nav">
        <div className="up-inner-nav">
          <img src={ajalabsblack} alt="AJA Labs" className="nav-logo-aja" />
          <div className="nav-right">
            <img src={logo} alt="JK Cement" className="nav-logo-jk" />
            <button className="logout-link" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="up-main-container">
        <div className="up-main-layout">
          <section className="up-column-left">
            <div className="text-content-wrapper">
              <h1 className="hero-title">
                Upload File <br />
                <span className="accent-text">for Analysis</span>
              </h1>
              <p className="hero-subtitle">
                Automated data integrity checks and visualization <br />
                for your financial dashboard projects.
              </p>

              <div className="flow-container">
                {step === "idle" && (
                  <button className="main-start-btn" onClick={() => setStep("setup")}>
                    Start New Analysis
                  </button>
                )}

                {step === "setup" && (
                  <div className="setup-box animate-in">
                    <select
                      className="up-select-field"
                      value={selectedInsight}
                      onChange={(e) => setSelectedInsight(e.target.value)}
                    >
                      <option value="">Select Insight Analysis...</option>
                      {INSIGHT_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>

                    <div className="pill-input" onClick={() => inputRef.current.click()}>
                      <span className="icon">📂</span>
                      <span className="placeholder">
                        {files.length > 0 ? `${files.length} files selected` : "Select multiple files"}
                      </span>
                      <button className="browse-btn">Upload Files</button>
                    </div>
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => processFiles(e.target.files)}
                    />

                    <button className="process-trigger-btn" onClick={handleRunAnalysis}>
                      Process for Analysis
                    </button>
                  </div>
                )}

                {step === "processing" && (
                  <div className="loading-container animate-in">
                    <div className="spinner"></div>
                    <h3>Processing Integrity Analysis...</h3>
                  </div>
                )}

                {step === "completed" && (
                  <div className="results-group animate-in">
                    <div className="action-btns">
                      <button className="btn-result table-btn" onClick={() => setViewMode("table")}>
                        View as Table
                      </button>
                      <button className="btn-result dash-btn" onClick={() => setViewMode("dashboard")}>
                        View as Dashboard
                      </button>
                    </div>
                    <button className="reset-link" onClick={resetAll}>
                      ← Start Different Analysis
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="up-column-right">
            <div className="viz-wrapper">
              <img src={uploaderImg} alt="Analysis Illustration" className="hero-img" />
              <div className="decor-circle"></div>
              <div className="vertical-label-inner">JK CEMENT DATA PIPELINE —</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Uploader;