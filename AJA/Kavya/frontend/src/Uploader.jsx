import React, { useState, useEffect } from "react";
import "./uploader.css";
import Dashboard from "./Dashboard";
import uploaderImg from "./assets/images/upload.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";

const INSIGHT_OPTIONS = [
  { id: "PJPA27", label: "PJPA27 - Notice Period Expense Risk", req: ["leftEmpFile", "concurFile"] },
  { id: "PJPA28", label: "PJPA28 - Benford's Law", req: ["lineItemFile"] },
  { id: "PJPA29", label: "PJPA29 - New Joiner Early Claims", req: ["empMasterFile", "lineItemFile"] },
  { id: "PJPA30", label: "PJPA30 - Short Trip Frequency Abuse", req: ["lineItemFile"] },
  { id: "PJPA31", label: "PJPA31 - Structural Splitting", req: ["lineItemFile"] },
  { id: "PJPA32_HOL", label: "PJPA32 - Holiday Travel & Weekend Travel", req: ["lineItemFile"] },
  { id: "PJPA33", label: "PJPA33 - Bulk Booking Reimbursements", req: ["lineItemFile"] },
  { id: "PJPA34", label: "PJPA34 - High-Frequency Low Value Claims", req: ["lineItemFile"] },
  { id: "PJPA35", label: "PJPA35 - Duplicate Report ID", req: ["concurFile"] },
  { id: "PJPA36", label: "PJPA36 - Missing Submit Date (Date Gaps)", req: ["concurFile"] },
  { id: "PJPA38", label: "PJPA38 - Odd Travels (Anomaly Detection)", req: ["lineItemFile"] },
  { id: "PJPA39", label: "PJPA39 - Active Employees with Separation Date", req: ["empMasterFile"] },
  { id: "PJPA40", label: "PJPA40 - Transaction Date Out of Bounds", req: ["concurFile", "lineItemFile"] },
];

const FILE_TYPES = [
  { key: "concurFile", label: "Concur Header Data", sub: "Required for Header Analysis", sample: "/src/assets/Sampledata/Concurheaderdata.csv" },
  { key: "lineItemFile", label: "Line Item Expenses", sub: "Required for Transactional Analysis", sample: "/src/assets/Sampledata/Line Item Expenses.csv" },
  { key: "empMasterFile", label: "Employee Master", sub: "Required for Joiner/Tenure Analysis", sample: "/src/assets/Sampledata/EmployeeMaster.csv" },
  { key: "leftEmpFile", label: "Left Employees", sub: "Required for Notice Period Analysis", sample: "/src/assets/Sampledata/LeftEmployee.csv" },
];

const Uploader = ({ logo, handleLogout }) => {
  const [view, setView] = useState("upload");
  const [previousView, setPreviousView] = useState("upload");
  const [selectedInsights, setSelectedInsights] = useState([]);
  const [isNotifyEnabled, setIsNotifyEnabled] = useState(false);
  const [files, setFiles] = useState({
    concurFile: null,
    leftEmpFile: null,
    empMasterFile: null,
    lineItemFile: null
  });

  const [isUploading, setIsUploading] = useState(false);
  const [activeAnalysisResults, setActiveAnalysisResults] = useState([]);
  const [analysisErrors, setAnalysisErrors] = useState([]);
  const [currentViewMode, setCurrentViewMode] = useState("table");

  // --- PERSISTENCE LOGIC (Now acting as the Session Report) ---
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("aja_audit_history");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    try {
      const historyMinimal = history.map(({ data, ...rest }) => rest);
      localStorage.setItem("aja_audit_history", JSON.stringify(historyMinimal));
    } catch (e) {
      console.warn("Local storage full, history not saved. Clearing oldest entries...");
      localStorage.removeItem("aja_audit_history");
    }
  }, [history]);

  // --- Handlers ---
  const handleReportToggle = () => {
    if (view === "report") {
      setView(previousView);
    } else {
      setPreviousView(view);
      setView("report");
    }
  };

  const startNewSession = () => {
    setFiles({ concurFile: null, leftEmpFile: null, empMasterFile: null, lineItemFile: null });
    setSelectedInsights([]);
    setActiveAnalysisResults([]);
    setView("upload");
  };

  const handleFileChange = (e, fileKey) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [fileKey]: e.target.files[0] }));
    }
  };

  const removeFile = (fileKey) => {
    setFiles((prev) => ({ ...prev, [fileKey]: null }));
  };

  const handleUploadSubmit = async () => {
    setIsUploading(true);
    const formData = new FormData();
    Object.keys(files).forEach(key => { if (files[key]) formData.append(key, files[key]); });

    try {
      const response = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
      if (response.ok) {
        setView("kpi_overview");
      } else {
        const errData = await response.json();
        alert(`Upload error: ${errData.message}`);
      }
    } catch (err) {
      alert("Upload failed. Ensure backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const startAnalysis = async () => {
    setAnalysisErrors([]);
    setView("processing");

    const currentReports = [];
    const toRun = [];

    // 1. Check for missing files and pre-mark failures
    selectedInsights.forEach(insightId => {
      const insight = INSIGHT_OPTIONS.find(o => o.id === insightId);
      const missingFiles = insight.req.filter(reqFile => !files[reqFile]);

      if (missingFiles.length > 0) {
        currentReports.push({
          id: insight.id + "_" + Date.now(),
          moduleId: insight.id,
          name: insight.label,
          status: "Failed",
          reason: `Missing Data: ${missingFiles.map(f => FILE_TYPES.find(ft => ft.key === f)?.label || f).join(", ")}`,
          missingFiles: missingFiles,
          data: [],
          timestamp: new Date().toLocaleString()
        });
      } else {
        toRun.push(insightId);
      }
    });

    // 2. Process the valid ones
    if (toRun.length > 0) {
      try {
        const generateResponse = await fetch("http://localhost:5000/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ insights: toRun })
        });

        if (!generateResponse.ok) throw new Error("Backend failed to generate insights");

        const fetchPromises = toRun.map(id =>
          fetch(`http://localhost:5000/api/insight/${id}/data`).then(res => ({ id, res }))
        );

        const results = await Promise.all(fetchPromises);

        for (const resultObj of results) {
          const insightDef = INSIGHT_OPTIONS.find(o => o.id === resultObj.id);
          try {
            const dataJson = await resultObj.res.json();
            const extractedData = Array.isArray(dataJson) ? dataJson : (dataJson.data || []);
            currentReports.push({
              id: resultObj.id + "_" + Date.now(),
              moduleId: resultObj.id,
              name: insightDef.label,
              status: "Success",
              reason: "",
              missingFiles: [],
              data: extractedData,
              timestamp: new Date().toLocaleString()
            });
          } catch (err) {
            currentReports.push({
              id: resultObj.id + "_" + Date.now(),
              moduleId: resultObj.id,
              name: insightDef.label,
              status: "Failed",
              reason: "Data processing error.",
              missingFiles: [],
              data: [],
              timestamp: new Date().toLocaleString()
            });
          }
        }
      } catch (e) {
        toRun.forEach(id => {
          const insightDef = INSIGHT_OPTIONS.find(o => o.id === id);
          currentReports.push({
            id: id + "_" + Date.now(),
            moduleId: id,
            name: insightDef.label,
            status: "Failed",
            reason: "Server execution failed.",
            missingFiles: [],
            data: [],
            timestamp: new Date().toLocaleString()
          });
        });
      }
    }

    const successfulReports = currentReports.filter(r => r.status === "Success");
    setActiveAnalysisResults(successfulReports);
    setHistory(prev => [...currentReports, ...prev].slice(0, 50)); 

    if (isNotifyEnabled && successfulReports.length > 0) alert("Audit session completed.");
    
    // Send user directly to the new Report view to see what passed/failed
    setView("report");
  };

  // --- Inline Reupload Logic for the Report Page ---
  const handleInlineReupload = async (e, reportItem, fileKey) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (fileKey && !file) return;

    try {
      // Show processing status
      setHistory(prev => prev.map(item => item.id === reportItem.id ? { ...item, status: "Refreshing..." } : item));

      // 1. Upload if there's a file
      if (file) {
        const formData = new FormData();
        formData.append(fileKey, file);
        setFiles(prev => ({ ...prev, [fileKey]: file })); // Sync local state
        
        const uploadRes = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Upload failed");
      }

      // 2. Generate
      const genRes = await fetch("http://localhost:5000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insights: [reportItem.moduleId] })
      });
      if (!genRes.ok) throw new Error("Backend generation failed");

      // 3. Fetch Data
      const dataRes = await fetch(`http://localhost:5000/api/insight/${reportItem.moduleId}/data`);
      if (!dataRes.ok) throw new Error("Data retrieval failed");

      const dataJson = await dataRes.json();
      const extractedData = Array.isArray(dataJson) ? dataJson : (dataJson.data || []);

      const updatedItem = {
        ...reportItem,
        status: "Success",
        reason: "",
        missingFiles: [],
        data: extractedData,
        timestamp: new Date().toLocaleString()
      };

      // 4. Update the report table to Success
      setHistory(prev => prev.map(item => item.id === reportItem.id ? updatedItem : item));
      setActiveAnalysisResults(prev => [...prev.filter(p => p.moduleId !== reportItem.moduleId), updatedItem]);

    } catch (err) {
      setHistory(prev => prev.map(item => item.id === reportItem.id ? { ...item, status: "Failed", reason: "Retry failed." } : item));
      alert("Action failed. Ensure backend is running and file is valid.");
    }
  };

  const handleRefreshReport = async () => {
    const successfulItems = history.filter(item => item.status === "Success");

    if (successfulItems.length === 0) {
      alert("No successful reports to refresh.");
      return;
    }

    // Mark all successful items as Refreshing... in the UI
    setHistory(prev => prev.map(item => 
      item.status === "Success" ? { ...item, status: "Refreshing..." } : item
    ));

    // Process each insight individually so UI updates line-by-line
    successfulItems.forEach(async (reportItem) => {
      try {
        // Re-generate
        const genRes = await fetch("http://localhost:5000/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ insights: [reportItem.moduleId] })
        });
        if (!genRes.ok) throw new Error();

        // Re-fetch data
        const res = await fetch(`http://localhost:5000/api/insight/${reportItem.moduleId}/data`);
        if (!res.ok) throw new Error();

        const dataJson = await res.json();
        const extractedData = Array.isArray(dataJson) ? dataJson : (dataJson.data || []);

        setHistory(prev => prev.map(item => 
          item.id === reportItem.id 
          ? { ...item, status: "Success", data: extractedData, timestamp: new Date().toLocaleString() } 
          : item
        ));
      } catch (err) {
        setHistory(prev => prev.map(item => 
          item.id === reportItem.id ? { ...item, status: "Failed", reason: "Refresh failed." } : item
        ));
      }
    });
  };

  const renderUploadView = () => (
    <div className="up-split-layout animate-in" style={{ display: 'flex', maxWidth: '1200px', width: '100%', minHeight: '600px', background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
      <section style={{ flex: 1.2, padding: '40px' }}>
        <h1 style={{ color: '#05192d', fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Upload Master Data</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Select the files required for your audit session.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {FILE_TYPES.map((type) => (
            <div key={type.key} style={{ position: 'relative', border: files[type.key] ? '2px solid #00df81' : '1px dashed #cbd5e1', borderRadius: '12px', padding: '15px', background: files[type.key] ? '#f0fff4' : '#f8fafc', transition: '0.3s' }}>
              {!files[type.key] ? (
                <label style={{ display: 'block', cursor: 'pointer' }}>
                  <input type="file" accept=".csv, .xls, .xlsx, .zip" onChange={(e) => handleFileChange(e, type.key)} style={{ display: 'none' }} />
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#05192d', display: 'block' }}>{type.label}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{type.sub}</span>
                  <div style={{ marginTop: '8px', color: '#00df81', fontSize: '12px', fontWeight: 'bold' }}>+ Click to Upload</div>
                  <a href={type.sample} download className="sample-link" onClick={(e) => e.stopPropagation()} style={{ fontSize: '11px', color: '#64748b', textDecoration: 'underline' }}>View Sample</a>
                </label>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00df81', textTransform: 'uppercase' }}>{type.label} Loaded</span>
                  <span style={{ fontSize: '14px', color: '#05192d', fontWeight: '600', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {files[type.key].name}
                  </span>
                  <button onClick={() => removeFile(type.key)} style={{ marginTop: 'auto', background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', padding: '5px 0' }}>✕ Remove File</button>
                  <a href={type.sample} download style={{ fontSize: '11px', color: '#64748b', textDecoration: 'underline' }}>View Sample</a>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <button onClick={handleUploadSubmit} disabled={isUploading} style={{ padding: '14px 30px', background: '#05192d', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: isUploading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(5,25,45,0.2)' }}>
            {isUploading ? "Syncing Data..." : "Continue to Audit"}
          </button>
        </div>
      </section>
      <section style={{ flex: 0.8, background: '#05192d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <img src={uploaderImg} alt="Illustration" style={{ width: '100%', maxWidth: '280px', marginBottom: '30px' }} />
          <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>Smart Extraction</h3>
          <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>Our engine automatically identifies columns and prepares datasets for risk modeling.</p>
        </div>
      </section>
    </div>
  );

  const renderKPIView = () => (
    <div className="animate-in" style={{ width: '100%', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#05192d', fontSize: '28px' }}>Data Validation Successful</h2>
        <button onClick={() => setView("upload")} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #789eccff', cursor: 'pointer' }}>← Back</button>
      </div>
      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '25px', color: '#05192d' }}>Choose Audit Controls to Run</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {INSIGHT_OPTIONS.map(opt => (
            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: selectedInsights.includes(opt.id) ? '2px solid #00df81' : '1px solid #e2e8f0', background: selectedInsights.includes(opt.id) ? '#f0fff4' : 'white', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' }}>
              <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: '#00df81' }} checked={selectedInsights.includes(opt.id)} onChange={() => { setSelectedInsights(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]); }} />
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#05192d' }}>{opt.label}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '30px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '600', color: '#05192d', cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={isNotifyEnabled} onChange={e => setIsNotifyEnabled(e.target.checked)} />
            Notify me when results are generated
          </label>
          <button onClick={startAnalysis} disabled={selectedInsights.length === 0} style={{ padding: '16px 50px', background: '#00df81', color: '#05192d', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,223,129,0.2)' }}>
            Start Risk Analysis
          </button>
        </div>
      </div>
    </div>
  );

  const renderProcessingView = () => (
    <div style={{ textAlign: 'center', background: 'white', padding: '80px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', width: '100%', maxWidth: '600px' }}>
      <div className="spinner" style={{ width: '70px', height: '70px', border: '6px solid #f1f5f9', borderTop: '6px solid #00df81', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 30px' }}></div>
      <h2 style={{ color: '#05192d', fontSize: '28px' }}>Auditing Data...</h2>
      <p style={{ color: '#64748b', fontSize: '16px' }}>Executing {selectedInsights.length} control modules. This may take a moment.</p>
    </div>
  );

  const renderResultsView = () => (
    <div className="animate-in" style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ color: '#05192d', fontSize: '32px', marginBottom: '5px' }}>Audit Insights</h2>
          <p style={{ color: '#64748b' }}>Viewing results for specific control modules.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setCurrentViewMode("table")} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #05192d', fontWeight: 'bold', background: currentViewMode === 'table' ? '#05192d' : 'white', color: currentViewMode === 'table' ? 'white' : '#05192d', cursor: 'pointer' }}>Table View</button>
          <button onClick={() => setCurrentViewMode("dashboard")} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #05192d', fontWeight: 'bold', background: currentViewMode === 'dashboard' ? '#05192d' : 'white', color: currentViewMode === 'dashboard' ? 'white' : '#05192d', cursor: 'pointer' }}>Dashboard View</button>
          <button onClick={() => setView("report")} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#05192d', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Back to Report</button>
        </div>
      </div>

      {activeAnalysisResults.map((insight) => (
        <div key={insight.id}>
          {currentViewMode === "table" ? (
            <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginBottom: '20px', color: '#05192d', borderLeft: '4px solid #00df81', paddingLeft: '15px' }}>{insight.name}</h3>
              <div style={{ overflowX: 'auto' }}>
                {insight.data && insight.data.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#05192d', color: 'white' }}>
                        {Object.keys(insight.data[0]).map(k => <th key={k} style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>{k}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {insight.data.slice(0, 10).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          {Object.values(row).map((v, j) => <td key={j} style={{ padding: '12px', fontSize: '13px', color: '#334155' }}>{String(v)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found for this module.</div>
                )}
              </div>
            </div>
          ) : (
            <Dashboard data={insight.data} onBackToTable={() => setCurrentViewMode("table")} />
          )}
        </div>
      ))}
    </div>
  );

  const renderReportView = () => (
    <div className="animate-in" style={{ width: '100%', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setView("kpi_overview")} style={{ border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>← Control Selection</button>
          <h2 style={{ color: '#05192d', fontSize: '28px' }}>Execution Report</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleRefreshReport} 
            style={{ background: '#00df81', color: '#05192d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            ↻ Refresh Successful Controls
          </button>
          <button onClick={() => { setHistory([]); localStorage.removeItem("aja_audit_history"); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Clear Report History</button>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        {history.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '20px', textAlign: 'left', color: '#64748b' }}>Timestamp</th>
                <th style={{ padding: '20px', textAlign: 'left', color: '#64748b' }}>Insight Module</th>
                <th style={{ padding: '20px', textAlign: 'left', color: '#64748b' }}>Status</th>
                <th style={{ padding: '20px', textAlign: 'left', color: '#64748b' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>{item.timestamp}</td>
                  <td style={{ padding: '20px', fontWeight: 'bold', color: '#05192d' }}>{item.name}</td>
                  <td style={{ padding: '20px' }}>
                    {item.status === 'Success' ? (
                      <span style={{ background: '#e6fcf2', color: '#00df81', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Success</span>
                    ) : item.status === 'Refreshing...' ? (
                      <span style={{ background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Refreshing...</span>
                    ) : (
                      <div>
                        <span style={{ background: '#fef2f2', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Failed</span>
                        <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', fontWeight: '500' }}>{item.reason}</div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '20px' }}>
                    {item.status === 'Success' ? (
                      <button 
                        onClick={() => {
                          setActiveAnalysisResults([item]); 
                          setCurrentViewMode('table');
                          setView('results');
                        }} 
                        style={{ padding: '8px 16px', background: '#05192d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        View Insights
                      </button>
                    ) : item.status === 'Refreshing...' ? (
                        <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid #f1f5f9', borderTop: '2px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {item.missingFiles && item.missingFiles.length > 0 ? (
                          item.missingFiles.map(reqFile => {
                            const fileLabel = FILE_TYPES.find(f => f.key === reqFile)?.label || reqFile;
                            return (
                              <label key={reqFile} style={{ fontSize: '12px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-block', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                <input type="file" accept=".csv, .xls, .xlsx, .zip" style={{ display: 'none' }} onChange={(e) => handleInlineReupload(e, item, reqFile)} />
                                <span style={{ color: '#2563eb', fontWeight: 'bold' }}>Upload {fileLabel}</span>
                              </label>
                            );
                          })
                        ) : (
                          <button onClick={() => handleInlineReupload({ target: {} }, item, null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#05192d' }}>
                            Retry Processing
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>No audit reports have been executed yet.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="up-page-wrapper">
      <nav className="up-nav" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '15px 0' }}>
        <div className="up-inner-nav" style={{ maxWidth: '1400px', margin: '0 auto', width: '90%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={ajalabsblack} alt="AjaLabs" className="nav-logo-aja" style={{ height: '35px' }} />
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <button onClick={startNewSession} style={{ background: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#05192d' }}>New Session</button>
            <button onClick={handleReportToggle} style={{ background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', color: view === 'report' ? '#00df81' : '#64748b' }}>{view === 'report' ? 'Close Report' : 'Report'}</button>
            <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>Sign Out</button>
            <img src={logo} alt="JK Cement" className="nav-logo-jk" style={{ height: '40px' }} />
          </div>
        </div>
      </nav>
      <div className="up-main-area" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '40px' }}>
        {view === 'upload' && renderUploadView()}
        {view === 'kpi_overview' && renderKPIView()}
        {view === 'processing' && renderProcessingView()}
        {view === 'results' && renderResultsView()}
        {view === 'report' && renderReportView()}
      </div>
    </div>
  );
};

export default Uploader;