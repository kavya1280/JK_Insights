import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import "./uploader.css";
import Dashboard from "./Dashboard";
import PJPA36Dashboard from "./PJPA36Dashboard";
import uploaderImg from "./assets/images/upload.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";

const INSIGHT_OPTIONS = [
  { id: "PJPA10", label: "PJPA10 - Junior vs. Senior Analysis", req: ["concurFile", "lineItemFile", "empMasterFile"] },
  { id: "PJPA13", label: "PJPA13 - Company Policy Validation", req: ["concurFile", "lineItemFile", "empMasterFile"] },
  { id: "PJPA14", label: "PJPA14 - Duplicate Claims Analysis", req: ["lineItemFile"] },
  { id: "PJPA16", label: "PJPA16 - Employee Master Duplicates", req: ["empMasterFile"] },
  { id: "PJPA18", label: "PJPA18 - Multiple Submits for Same Travel", req: ["concurFile", "lineItemFile"] },
  { id: "PJPA19", label: "PJPA19 - Multiple Travel Modes For Same Trip", req: ["lineItemFile"] },
  { id: "PJPA20", label: "PJPA20 - Odd Time Submission (Late Night/Early)", req: ["concurFile"] },
  { id: "PJPA21", label: "PJPA21 - Overlapping Travel Dates", req: ["concurFile"] },
  { id: "PJPA22", label: "PJPA22 - Cross-Employee Duplicates", req: ["lineItemFile"] },
  { id: "PJPA23", label: "PJPA23 - Submit Date Before Report Start Date", req: ["concurFile"] },
  { id: "PJPA24", label: "PJPA24 - Z-Score & Modified Z-Score Anomalies", req: ["concurFile", "lineItemFile"] },
  { id: "PJPA27", label: "PJPA27 - Notice Period Expense Risk", req: ["leftEmpFile", "concurFile"] },
  { id: "PJPA28", label: "PJPA28 - Benford's Law", req: ["lineItemFile"] },
  { id: "PJPA29", label: "PJPA29 - New Joiner Early Claims", req: ["empMasterFile", "lineItemFile"] },
  { id: "PJPA30", label: "PJPA30 - Short Trip Frequency Abuse", req: ["lineItemFile"] },
  { id: "PJPA31", label: "PJPA31 - Structural Splitting", req: ["lineItemFile"] },
  { id: "PJPA32", label: "PJPA32 - Holiday Travel & Weekend Travel", req: ["lineItemFile"] },
  { id: "PJPA33", label: "PJPA33 - Bulk Booking Reimbursements", req: ["lineItemFile"] },
  { id: "PJPA34", label: "PJPA34 - High-Frequency Low Value Claims", req: ["lineItemFile"] },
  { id: "PJPA35", label: "PJPA35 - Duplicate Report ID", req: ["concurFile"] },
  { id: "PJPA36", label: "PJPA36 - Missing Submit Date (Date Gaps)", req: ["concurFile"] },
  { id: "PJPA38", label: "PJPA38 - Odd Travels (Anomaly Detection)", req: ["lineItemFile"] },
  { id: "PJPA39", label: "PJPA39 - Active Employees with Separation Date", req: ["empMasterFile"] },
  { id: "PJPA40", label: "PJPA40 - Transaction Date Out of Bounds", req: ["concurFile", "lineItemFile"] }
];

const FILE_TYPES = [
  { key: "concurFile", label: "Concur Header Data", sub: "Required for Header Analysis", sample: "/src/assets/Sampledata/Concurheaderdata.csv" },
  { key: "lineItemFile", label: "Line Item Expenses", sub: "Required for Transactional Analysis", sample: "/src/assets/Sampledata/Line Item Expenses.csv" },
  { key: "empMasterFile", label: "Employee Master", sub: "Required for Joiner/Tenure Analysis", sample: "/src/assets/Sampledata/EmployeeMaster.csv" },
  { key: "leftEmpFile", label: "Left Employees", sub: "Required for Notice Period Analysis", sample: "/src/assets/Sampledata/LeftEmployee.csv" }
];

const Uploader = ({ user, logo, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = `/login/${user?.username || 'uploader'}`;

  const getViewFromPath = (path) => {
    if (path.includes('/new-session')) return 'upload';
    if (path.includes('/insight-selection')) return 'kpi_overview';
    if (path.includes('/processing')) return 'processing';
    if (path.includes('/results')) return 'results';
    if (path.includes('/report')) return 'report';
    return 'upload';
  };

  const view = getViewFromPath(location.pathname);

  const [selectedInsights, setSelectedInsights] = useState([]);
  const [isNotifyEnabled, setIsNotifyEnabled] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false); // NEW: Tracks restore vs processing state

  // Controls which single insight is currently displayed in the Results view
  const [viewingInsightId, setViewingInsightId] = useState(() => localStorage.getItem("aja_viewing_insight") || null);

  useEffect(() => {
    if (viewingInsightId) localStorage.setItem("aja_viewing_insight", viewingInsightId);
    else localStorage.removeItem("aja_viewing_insight");
  }, [viewingInsightId]);

  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem("aja_session_files");
      return saved ? JSON.parse(saved) : { concurFile: null, leftEmpFile: null, empMasterFile: null, lineItemFile: null };
    } catch {
      return { concurFile: null, leftEmpFile: null, empMasterFile: null, lineItemFile: null };
    }
  });

  const [isUploading, setIsUploading] = useState(false);
  const [activeAnalysisResults, setActiveAnalysisResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aja_last_session_results")) || []; }
    catch { return []; }
  });

  const [currentViewMode, setCurrentViewMode] = useState("table");

  // Custom states for Nested Menus
  const [pjpa32SubView, setPjpa32SubView] = useState('holiday');
  const [pjpa24Type, setPjpa24Type] = useState('Mod_Z');
  const [pjpa24Category, setPjpa24Category] = useState('Overall');
  const [activeTabs, setActiveTabs] = useState({});

  const [uploadKPIs, setUploadKPIs] = useState(() => {
    try {
      const saved = localStorage.getItem("aja_session_kpis");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [savedSessions, setSavedSessions] = useState([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);

  const [lastSessionResults, setLastSessionResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aja_last_session_results")) || []; }
    catch { return []; }
  });

  const fetchSavedSessions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSavedSessions(data);
      }
    } catch (e) { console.warn("Failed to fetch sessions"); }
  };

  useEffect(() => {
    fetchSavedSessions();
  }, [view]);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("aja_audit_history");
    return saved ? JSON.parse(saved) : [];
  });

  const safelyPersistResults = (data) => {
    const KEY = "aja_last_session_results";
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Local storage full for results. Saving metadata only...");
      try {
        const metadataOnly = data.map(({ data, ...rest }) => ({ ...rest, data: [], isMetadataOnly: true }));
        localStorage.setItem(KEY, JSON.stringify(metadataOnly));
      } catch (e2) {
        console.error("Critical: Local storage exhausted.", e2);
      }
    }
  };

  useEffect(() => {
    try {
      const historyMinimal = history.map(({ data, ...rest }) => rest);
      localStorage.setItem("aja_audit_history", JSON.stringify(historyMinimal));
    } catch (e) {
      localStorage.removeItem("aja_audit_history");
    }
  }, [history]);

  const handleReportToggle = () => {
    if (view === "report") {
      if (activeAnalysisResults.length > 0 && viewingInsightId) {
        navigate(`${basePath}/results`);
      } else {
        navigate(`${basePath}/new-session`);
      }
    } else {
      navigate(`${basePath}/report`);
    }
  };

  const startNewSession = async () => {
    if (activeAnalysisResults.length > 0) {
      setLastSessionResults(activeAnalysisResults);
      safelyPersistResults(activeAnalysisResults);
    }
    setFiles({ concurFile: null, leftEmpFile: null, empMasterFile: null, lineItemFile: null });
    setSelectedInsights([]);
    setUploadKPIs({});
    setActiveTabs({});
    setViewingInsightId(null);

    localStorage.removeItem("aja_session_files");
    localStorage.removeItem("aja_session_kpis");
    localStorage.removeItem("aja_viewing_insight");

    navigate(`${basePath}/new-session`);
  };

  const handleSaveSession = async (name = "") => {
    try {
      const response = await fetch("http://localhost:5000/api/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          insights: activeAnalysisResults.map(r => r.moduleId)
        })
      });
      if (response.ok) {
        fetchSavedSessions();
        return true;
      }
    } catch (e) { console.error("Save failed", e); }
    return false;
  };

  const handleLoadSession = async (sessionId) => {
    try {
      setIsRestoring(true); // Updates the UI to say "Restoring..."
      navigate(`${basePath}/processing`);
      const session = savedSessions.find(s => s.id === sessionId);
      if (!session) return;

      const loadedResults = [];
      for (const insightId of session.insights) {
        const res = await fetch(`http://localhost:5000/api/sessions/${sessionId}/${insightId}/data`);
        if (res.ok) {
          const dataJson = await res.json();
          loadedResults.push({
            id: insightId + "_" + Date.now(),
            moduleId: insightId,
            name: INSIGHT_OPTIONS.find(o => o.id === insightId)?.label || insightId,
            status: "Success",
            reason: `Restored from: ${session.name}`,
            missingFiles: [],
            data: dataJson.data || [],
            timestamp: session.timestamp,
            isRestored: true, // Tagged strictly as restored data
            sessionId: sessionId
          });
        }
      }

      // Append to active results safely
      setActiveAnalysisResults(prev => {
        const newResults = [...prev.filter(p => !loadedResults.find(l => l.moduleId === p.moduleId)), ...loadedResults];
        safelyPersistResults(newResults);
        return newResults;
      });

      // Append to history table
      setHistory(prev => [...loadedResults, ...prev].slice(0, 50));

      // Go back to the report page, NOT the results page
      navigate(`${basePath}/report`);
    } catch (e) {
      alert("Failed to load session data");
      navigate(`${basePath}/report`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileChange = (e, fileKey) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setFiles((prev) => {
        const updated = { ...prev, [fileKey]: newFile };
        const mockFiles = {};
        Object.keys(updated).forEach(k => {
          mockFiles[k] = updated[k] ? { name: updated[k].name } : null;
        });
        localStorage.setItem("aja_session_files", JSON.stringify(mockFiles));
        return updated;
      });
    }
  };

  const removeFile = (fileKey) => {
    setFiles((prev) => {
      const updated = { ...prev, [fileKey]: null };
      const mockFiles = {};
      Object.keys(updated).forEach(k => {
        mockFiles[k] = updated[k] ? { name: updated[k].name } : null;
      });
      localStorage.setItem("aja_session_files", JSON.stringify(mockFiles));
      return updated;
    });
  };

  const handleUploadSubmit = async () => {
    setIsUploading(true);
    const formData = new FormData();
    Object.keys(files).forEach(key => {
      if (files[key] && files[key] instanceof File) {
        formData.append(key, files[key]);
      }
    });

    try {
      const response = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
      const resData = await response.json();

      if (response.ok) {
        setUploadKPIs(resData.kpis || {});
        localStorage.setItem("aja_session_kpis", JSON.stringify(resData.kpis || {}));
        navigate(`${basePath}/insight-selection`);
      } else {
        alert(`Upload error: ${resData.message}`);
      }
    } catch (err) {
      alert("Upload failed. Ensure backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const startAnalysis = async () => {
    navigate(`${basePath}/processing`);
    const currentReports = [];
    const toRun = [];

    selectedInsights.forEach(insightId => {
      const insight = INSIGHT_OPTIONS.find(o => o.id === insightId);
      const missingFiles = insight.req.filter(reqFile => !files[reqFile]);

      if (missingFiles.length > 0) {
        currentReports.push({
          id: insight.id + "_" + Date.now(),
          moduleId: insight.id,
          name: insight.label,
          status: "Failed",
          reason: `Missing Data: ${FILE_TYPES.find(f => f.key === missingFiles[0])?.label || missingFiles[0]}`,
          missingFiles: missingFiles,
          data: [],
          timestamp: new Date().toLocaleString()
        });
      } else {
        toRun.push(insightId);
        currentReports.push({
          id: insight.id + "_" + Date.now(),
          moduleId: insight.id,
          name: insight.label,
          status: "In Progress",
          reason: "Processing...",
          missingFiles: [],
          data: [],
          timestamp: new Date().toLocaleString()
        });
      }
    });

    const reportsToUpdate = [...currentReports];
    setHistory(prev => [...reportsToUpdate, ...prev].slice(0, 50));

    for (const insightId of toRun) {
      const insightDef = INSIGHT_OPTIONS.find(o => o.id === insightId);
      try {
        const genRes = await fetch("http://localhost:5000/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ insights: [insightId] })
        });
        if (!genRes.ok) throw new Error("Generation failed");

        const dataRes = await fetch(`http://localhost:5000/api/insight/${insightId}/data`);
        if (!dataRes.ok) throw new Error("Data retrieval failed");

        const dataJson = await dataRes.json();
        const extractedData = Array.isArray(dataJson) ? dataJson : (dataJson.data || []);

        const successItem = {
          id: insightId + "_" + Date.now(),
          moduleId: insightId,
          name: insightDef.label,
          status: "Success",
          reason: "",
          missingFiles: [],
          data: extractedData,
          timestamp: new Date().toLocaleString()
        };

        setActiveAnalysisResults(prev => {
          const updated = [...prev.filter(p => p.moduleId !== insightId), successItem];
          safelyPersistResults(updated);
          return updated;
        });

        setHistory(prev => prev.map(item =>
          (item.moduleId === insightId && item.status === "In Progress") ? successItem : item
        ));

      } catch (err) {
        const failItem = {
          id: insightId + "_" + Date.now(),
          moduleId: insightId,
          name: insightDef.label,
          status: "In-Active",
          reason: "Processing error.",
          missingFiles: [],
          data: [],
          timestamp: new Date().toLocaleString()
        };
        setHistory(prev => prev.map(item =>
          (item.moduleId === insightId && item.status === "In Progress") ? failItem : item
        ));
      }
    }

    if (isNotifyEnabled && reportsToUpdate.some(r => r.status === "Success")) alert("Audit session completed.");
    navigate(`${basePath}/report`);
  };

  const handleInlineUploadOnly = async (e, reportItem, fileKey) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    try {
      setHistory(prev => prev.map(item => item.id === reportItem.id ? { ...item, reason: `Uploading...` } : item));
      const formData = new FormData();
      formData.append(fileKey, file);

      setFiles((prev) => {
        const updated = { ...prev, [fileKey]: file };
        const mockFiles = {};
        Object.keys(updated).forEach(k => {
          mockFiles[k] = updated[k] ? { name: updated[k].name } : null;
        });
        localStorage.setItem("aja_session_files", JSON.stringify(mockFiles));
        return updated;
      });

      const uploadRes = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");

      setHistory(prev => prev.map(item => item.id === reportItem.id ? { ...item, reason: "Missing Data Pending" } : item));
    } catch (err) {
      setHistory(prev => prev.map(item => item.id === reportItem.id ? { ...item, reason: "Upload failed. Try again." } : item));
    }
  };

  const handleRetryProcessing = async (reportItem) => {
    try {
      setHistory(prev => prev.map(item => item.id === reportItem.id ? { ...item, status: 'In Progress', reason: "Processing Insight..." } : item));

      const genRes = await fetch("http://localhost:5000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insights: [reportItem.moduleId] })
      });
      if (!genRes.ok) throw new Error("Backend generation failed");

      const dataRes = await fetch(`http://localhost:5000/api/insight/${reportItem.moduleId}/data`);
      if (!dataRes.ok) throw new Error("Data retrieval failed");

      const dataJson = await dataRes.json();
      const extractedData = Array.isArray(dataJson) ? dataJson : (dataJson.data || []);

      const updatedItem = { ...reportItem, status: "Success", reason: "", missingFiles: [], data: extractedData, timestamp: new Date().toLocaleString() };

      setHistory(prev => prev.map(item => item.id === reportItem.id ? updatedItem : item));
      setActiveAnalysisResults(prev => [...prev.filter(p => p.moduleId !== reportItem.moduleId), updatedItem]);

    } catch (err) {
      setHistory(prev => prev.map(item => item.id === reportItem.id ? { ...item, status: 'Failed', reason: "Retry failed. Check file format." } : item));
    }
  };

  const handleRefreshReport = async () => {
    // Only refresh items that are NOT restored from a previous session
    const successfulItems = history.filter(item => item.status === "Success" && !item.isRestored);
    if (successfulItems.length === 0) {
      alert("No current session controls to refresh. (Restored historical data is locked and will not be overwritten).");
      return;
    }

    setHistory(prev => prev.map(item => (item.status === "Success" && !item.isRestored) ? { ...item, status: "Reprocessing", reason: "Fetching latest data..." } : item));

    successfulItems.forEach(async (reportItem) => {
      try {
        const res = await fetch(`http://localhost:5000/api/insight/${reportItem.moduleId}/data`);
        if (!res.ok) throw new Error("Failed to fetch data.");

        const dataJson = await res.json();
        const extractedData = Array.isArray(dataJson) ? dataJson : (dataJson.data || []);

        const refreshedItem = { ...reportItem, status: "Success", reason: "", data: extractedData, timestamp: new Date().toLocaleString() };

        setHistory(prev => prev.map(item => item.id === reportItem.id ? refreshedItem : item));
        setActiveAnalysisResults(prev => {
          const updated = [...prev.filter(p => p.moduleId !== reportItem.moduleId), refreshedItem];
          safelyPersistResults(updated);
          return updated;
        });
      } catch (err) {
        setHistory(prev => prev.map(item => item.id === reportItem.id ? { ...item, status: "In-Active", reason: "Refresh failed." } : item));
      }
    });
  };

  const handleSignOutClick = () => {
    const isProcessing = history.some(item => ['In Progress', 'Refreshing...', 'Reprocessing'].includes(item.status));
    if (window.confirm(isProcessing ? "You have insights currently processing! Are you sure you want to sign out?" : "Are you sure you want to sign out?")) {
      handleLogout();
    }
  };

  const deleteHistoryItem = (id) => {
    if (window.confirm("Are you sure you want to remove this record from the report?")) {
      setHistory((prev) => {
        const updatedHistory = prev.filter((item) => item.id !== id);
        try {
          const historyMinimal = updatedHistory.map(({ data, ...rest }) => rest);
          localStorage.setItem("aja_audit_history", JSON.stringify(historyMinimal));
        } catch (e) { console.error("Failed to update storage", e); }
        return updatedHistory;
      });
    }
  };

  const getPremiumButtonStyle = (isActive) => ({
    padding: '12px 26px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '700',
    fontFamily: 'inherit',
    letterSpacing: '0.5px',
    background: isActive ? '#00df81' : 'transparent',
    color: isActive ? '#05192d' : '#64748b',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    boxShadow: isActive ? '0 4px 12px rgba(0,223,129,0.3)' : 'none'
  });

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
        <button onClick={() => navigate(`${basePath}/new-session`)} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', color: '#000000' }}>← Change Files</button>
      </div>

      {uploadKPIs && uploadKPIs.total_transactions !== undefined && (
        <>
          <h3 style={{ marginBottom: '15px', color: '#05192d', fontSize: '16px', borderLeft: '4px solid #00df81', paddingLeft: '10px' }}>Concur Header Extraction</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            {uploadKPIs.unique_employees !== undefined && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #00df81', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Unique Employees</div>
                <div style={{ fontSize: '24px', color: '#05192d', fontWeight: '800' }}>{uploadKPIs.unique_employees.toLocaleString()}</div>
              </div>
            )}
            {uploadKPIs.unique_reports !== undefined && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #2196F3', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Unique Report IDs</div>
                <div style={{ fontSize: '24px', color: '#05192d', fontWeight: '800' }}>{uploadKPIs.unique_reports.toLocaleString()}</div>
              </div>
            )}
            {uploadKPIs.total_transactions !== undefined && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #7DC030', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Total Transactions</div>
                <div style={{ fontSize: '24px', color: '#05192d', fontWeight: '800' }}>{uploadKPIs.total_transactions.toLocaleString()}</div>
              </div>
            )}
            {uploadKPIs.average_claim !== undefined && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #FF9800', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Avg Claim Amount</div>
                <div title={`₹${uploadKPIs.average_claim.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} style={{ fontSize: '24px', color: '#05192d', fontWeight: '800' }}>
                  ₹{uploadKPIs.average_claim.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
            {uploadKPIs.total_amount !== undefined && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #05192d', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Total Amount Approved</div>
                <div title={`₹${uploadKPIs.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} style={{ fontSize: '24px', color: '#05192d', fontWeight: '800' }}>
                  {uploadKPIs.total_amount >= 10000000 ? `₹${(uploadKPIs.total_amount / 10000000).toFixed(2)} Cr` : uploadKPIs.total_amount >= 100000 ? `₹${(uploadKPIs.total_amount / 100000).toFixed(2)} L` : `₹${uploadKPIs.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {uploadKPIs && uploadKPIs.master_unique_employees !== undefined && (
        <>
          <h3 style={{ marginBottom: '15px', color: '#05192d', fontSize: '16px', borderLeft: '4px solid #8b5cf6', paddingLeft: '10px' }}>Employee Master Extraction</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '40px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #8b5cf6', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Master Unique Emps</div>
              <div style={{ fontSize: '24px', color: '#05192d', fontWeight: '800' }}>{uploadKPIs.master_unique_employees.toLocaleString()}</div>
            </div>
            {uploadKPIs.master_active_employees !== undefined && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #10b981', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Active Employees</div>
                <div style={{ fontSize: '24px', color: '#05192d', fontWeight: '800' }}>{uploadKPIs.master_active_employees.toLocaleString()}</div>
              </div>
            )}
            {uploadKPIs.master_separated_employees !== undefined && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #ef4444', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Separated Employees</div>
                <div style={{ fontSize: '24px', color: '#05192d', fontWeight: '800' }}>{uploadKPIs.master_separated_employees.toLocaleString()}</div>
              </div>
            )}
            {uploadKPIs.master_company_codes !== undefined && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #f59e0b', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Company Codes</div>
                <div style={{ fontSize: '24px', color: '#05192d', fontWeight: '800' }}>{uploadKPIs.master_company_codes.toLocaleString()}</div>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h3 style={{ color: '#05192d', margin: 0 }}>Choose Audit Controls to Run</h3>
          <button
            onClick={() => {
              if (selectedInsights.length === INSIGHT_OPTIONS.length) {
                setSelectedInsights([]);
              } else {
                setSelectedInsights(INSIGHT_OPTIONS.map(opt => opt.id));
              }
            }}
            style={{
              padding: '8px 16px',
              background: selectedInsights.length === INSIGHT_OPTIONS.length ? '#fef2f2' : '#f8fafc',
              color: selectedInsights.length === INSIGHT_OPTIONS.length ? '#ef4444' : '#05192d',
              border: selectedInsights.length === INSIGHT_OPTIONS.length ? '1px solid #fca5a5' : '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {selectedInsights.length === INSIGHT_OPTIONS.length ? "✕ Deselect All" : "✓ Select All"}
          </button>
        </div>
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
    <div style={{ textAlign: 'center', background: 'white', padding: '60px 40px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', width: '100%', maxWidth: '700px' }}>
      <div className="spinner" style={{ width: '60px', height: '60px', border: '5px solid #f1f5f9', borderTop: '5px solid #00df81', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 30px' }}></div>
      <h2 style={{ color: '#05192d', fontSize: '28px', marginBottom: '10px' }}>
        {isRestoring ? "Restoring Data..." : "Auditing Data..."}
      </h2>
      <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '40px' }}>
        {isRestoring ? "Fetching historical session data from archives." : "Executing control modules. This may take a moment for larger files."}
      </p>

      {!isRestoring && (
        <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #edf2f7' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#05192d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Progress</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedInsights.map(id => {
              const insight = INSIGHT_OPTIONS.find(o => o.id === id);
              const isProcessing = history.find(h => h.moduleId === id && h.status === 'In Progress');
              const isDone = history.find(h => h.moduleId === id && (h.status === 'Success' || h.status === 'Failed'));

              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#05192d', fontWeight: (isProcessing || isDone) ? '600' : '400' }}>{insight?.label}</span>
                  {isProcessing && <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #f1f5f9', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>}
                  {isDone?.status === 'Success' && <span style={{ color: '#1059b9ff', fontSize: '14px' }}>{"✔ Processing"}</span>}
                  {isDone?.status === 'Failed' && <span style={{ color: '#ef4444', fontSize: '14px' }}>{"✘ Failed"}</span>}
                  {!isProcessing && !isDone && <span style={{ color: '#94a3b8', fontSize: '14px' }}>Waiting...</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderResultsView = () => {
    // Filter down to ONLY the insight that was clicked on
    const insightsToRender = viewingInsightId ? activeAnalysisResults.filter(r => r.moduleId === viewingInsightId) : activeAnalysisResults;

    return (
      <div className="animate-in" style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            {insightsToRender.length === 1 ? (
              <>
                <h2 style={{ color: '#05192d', fontSize: '36px', fontWeight: '900', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                  {insightsToRender[0].name.split(" - ")[0]}
                </h2>
                <p style={{ color: '#64748b', fontSize: '18px', fontWeight: '500' }}>
                  {insightsToRender[0].name.split(" - ")[1] || insightsToRender[0].name}
                </p>
              </>
            ) : (
              <>
                <h2 style={{ color: '#05192d', fontSize: '32px', marginBottom: '5px' }}>Audit Insights</h2>
                <p style={{ color: '#64748b' }}>Viewing results for {insightsToRender.length} control modules.</p>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setCurrentViewMode("table")} style={getPremiumButtonStyle(currentViewMode === 'table')}>Table View</button>
              <button onClick={() => setCurrentViewMode("dashboard")} style={getPremiumButtonStyle(currentViewMode === 'dashboard')}>Dashboard View</button>
            </div>
          </div>
        </div>

        {insightsToRender.map((insight) => {
          // --- GENERIC MULTI-SHEET LOGIC ---
          const isMultiSheet = insight.data && typeof insight.data === 'object' && !Array.isArray(insight.data);
          const sheets = isMultiSheet ? Object.keys(insight.data) : [];
          const currentSheet = activeTabs[insight.id] || (sheets.length > 0 ? sheets[0] : null);

          let displayData = [];
          let currentExceptionName = "";

          if (insight.moduleId === "PJPA32") {
            displayData = insight.data[pjpa32SubView] || [];
            currentExceptionName = pjpa32SubView === 'holiday' ? 'Holiday Travel' : 'Weekend Travel';
          } else if (insight.moduleId === "PJPA24") {
            const sheetName = `${pjpa24Type}_${pjpa24Category}`;
            displayData = insight.data[sheetName] || [];
            currentExceptionName = `${pjpa24Type === 'Mod_Z' ? 'Modified Z-Score' : 'Standard Z-Score'} - ${pjpa24Category}`;
          } else if (isMultiSheet) {
            displayData = insight.data[currentSheet] || [];
            currentExceptionName = currentSheet ? currentSheet.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "";
          } else {
            displayData = insight.data || [];
          }

          return (
            <div key={insight.id} style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              {/* TABS FOR PJPA24 */}
              {insight.moduleId === "PJPA24" && (
                <>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                    <button onClick={() => setPjpa24Type('Mod_Z')} style={getPremiumButtonStyle(pjpa24Type === 'Mod_Z')}>Modified Z-Score</button>
                    <button onClick={() => setPjpa24Type('Std_Z')} style={getPremiumButtonStyle(pjpa24Type === 'Std_Z')}>Standard Z-Score</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                    <button onClick={() => setPjpa24Category('Overall')} style={getPremiumButtonStyle(pjpa24Category === 'Overall')}>Overall Context</button>
                    <button onClick={() => setPjpa24Category('Emp')} style={getPremiumButtonStyle(pjpa24Category === 'Emp')}>By Employee</button>
                    <button onClick={() => setPjpa24Category('Loc')} style={getPremiumButtonStyle(pjpa24Category === 'Loc')}>By Location</button>
                    <button onClick={() => setPjpa24Category('RepDate')} style={getPremiumButtonStyle(pjpa24Category === 'RepDate')}>By Report Date</button>
                    <button onClick={() => setPjpa24Category('TransDate')} style={getPremiumButtonStyle(pjpa24Category === 'TransDate')}>By Transaction Date</button>
                  </div>
                </>
              )}

              {/* TABS FOR PJPA32 (Holiday / Weekend) */}
              {insight.moduleId === "PJPA32" && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                  <button onClick={() => setPjpa32SubView('holiday')} style={getPremiumButtonStyle(pjpa32SubView === 'holiday')}>Holiday Travel</button>
                  <button onClick={() => setPjpa32SubView('weekend')} style={getPremiumButtonStyle(pjpa32SubView === 'weekend')}>Weekend Travel</button>
                </div>
              )}

              {/* TABS FOR OTHER MULTI-SHEET INSIGHTS (PJPA10, 13, 16, etc.) */}
              {insight.moduleId !== "PJPA24" && insight.moduleId !== "PJPA32" && isMultiSheet && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                  {sheets.map(sheet => {
                    const formattedName = sheet.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return (
                      <button
                        key={sheet}
                        onClick={() => setActiveTabs(prev => ({ ...prev, [insight.id]: sheet }))}
                        style={getPremiumButtonStyle(currentSheet === sheet)}
                      >
                        {formattedName}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* DATA RENDERER */}
              {currentViewMode === "table" ? (
                <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                  {displayData.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                      <thead>
                        <tr style={{ background: '#05192d', color: 'white' }}>
                          {Object.keys(displayData[0]).map(k => <th key={k} style={{ padding: '16px 12px', textAlign: 'left', fontSize: '12px', background: '#05192d', position: 'sticky', top: '0', zIndex: '10', borderBottom: '2px solid #00df81', whiteSpace: 'nowrap' }}>{k}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {displayData.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            {Object.values(row).map((v, j) => <td key={j} style={{ padding: '12px', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' }}>{String(v)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found for this module or tab.</div>
                  )}
                </div>
              ) : insight.moduleId === "PJPA36" ? (
                <PJPA36Dashboard 
                  data={insight.data} 
                  insightName={insight.name}
                />
              ) : (
                <Dashboard
                  data={displayData}
                  onBackToTable={() => setCurrentViewMode("table")}
                  insightName={insight.name}
                  exceptionName={currentExceptionName}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderClearHistoryModal = () => {
    if (!isClearModalOpen) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5,25,45,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
        <div className="animate-in" style={{ background: 'white', padding: '40px', borderRadius: '24px', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>{"🗑"}</div>
          <h2 style={{ color: '#05192d', marginBottom: '10px' }}>Clear Execution Report</h2>
          <p style={{ color: '#64748b', marginBottom: '30px', lineHeight: '1.5' }}>Would you like to save this session before clearing, or delete everything permanently?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={async () => {
                await handleSaveSession();
                setHistory((prev) => {
                  const processingItems = prev.filter(item => ['In Progress', 'Refreshing...', 'Reprocessing'].includes(item.status));
                  try {
                    const historyMinimal = processingItems.map(({ data, ...rest }) => rest);
                    localStorage.setItem("aja_audit_history", JSON.stringify(historyMinimal));
                  } catch (e) { console.warn("Failed to update history storage", e); }
                  return processingItems;
                });
                setIsClearModalOpen(false);
              }}
              style={{ padding: '14px', background: '#05192d', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              {"💾 Save Session & Clear"}
            </button>
            <button
              onClick={() => {
                setHistory((prev) => {
                  const processingItems = prev.filter(item => ['In Progress', 'Refreshing...', 'Reprocessing'].includes(item.status));
                  try {
                    const historyMinimal = processingItems.map(({ data, ...rest }) => rest);
                    localStorage.setItem("aja_audit_history", JSON.stringify(historyMinimal));
                  } catch (e) {
                    console.warn("Failed to update history storage", e);
                    localStorage.removeItem("aja_audit_history");
                  }
                  return processingItems;
                });
                setIsClearModalOpen(false);
              }}
              style={{ padding: '14px', background: '#f8fafc', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              {"🔥 Permanently Delete"}
            </button>
            <button
              onClick={() => setIsClearModalOpen(false)}
              style={{ padding: '14px', background: 'none', color: '#64748b', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNewSessionModal = () => {
    if (!isNewSessionModalOpen) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5,25,45,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
        <div className="animate-in" style={{ background: 'white', padding: '40px', borderRadius: '24px', maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>{"🔄"}</div>
          <h2 style={{ color: '#05192d', marginBottom: '10px' }}>Start New Session?</h2>
          <p style={{ color: '#64748b', marginBottom: '30px', lineHeight: '1.5' }}>
            This will clear your current uploaded files and reset the analysis selection.
            Your current results will be moved to the "Previous Session" history.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                startNewSession();
                setIsNewSessionModalOpen(false);
              }}
              style={{ flex: 1, padding: '14px', background: '#05192d', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              Yes, Start Fresh
            </button>
            <button
              onClick={() => setIsNewSessionModalOpen(false)}
              style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper component to render the beautiful table views for history
  const renderHistoryTable = (historyData, title) => {
    if (historyData.length === 0) return null;
    return (
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: '#05192d', marginBottom: '15px', fontSize: '18px', borderLeft: '4px solid #00df81', paddingLeft: '10px' }}>{title}</h3>
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '20px', textAlign: 'left', color: '#64748b', background: '#f8fafc' }}>Timestamp</th>
                <th style={{ padding: '20px', textAlign: 'left', color: '#64748b', background: '#f8fafc' }}>Insight Module</th>
                <th style={{ padding: '20px', textAlign: 'left', color: '#64748b', background: '#f8fafc' }}>Status</th>
                <th style={{ padding: '20px', textAlign: 'left', color: '#64748b', background: '#f8fafc' }}>Action</th>
                <th style={{ padding: '20px', background: '#f8fafc' }}></th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>{item.timestamp}</td>
                  <td style={{ padding: '20px', fontWeight: 'bold', color: '#05192d' }}>{item.name}</td>
                  <td style={{ padding: '20px' }}>
                    {item.status === 'Success' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: 'fit-content', background: '#e6fcf2', color: '#00df81', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>Success</span>
                        {item.timestamp && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                      </div>
                    ) : (item.status === 'In Progress' || item.status === 'Refreshing...' || item.status === 'Reprocessing') ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: 'fit-content', background: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>{item.status}</span>
                        <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: '500' }}>Processing...</div>
                      </div>
                    ) : item.status === 'In-Active' ? (
                      <div>
                        <span style={{ display: 'inline-block', width: 'fit-content', background: '#f1f5f9', color: '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>In-Active</span>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>{item.reason}</div>
                      </div>
                    ) : (
                      <div>
                        <span style={{ display: 'inline-block', width: 'fit-content', background: '#fef2f2', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>Failed</span>
                        <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px', fontWeight: '500' }}>{item.reason}</div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '20px' }}>
                    {item.status === 'Success' ? (
                      <button
                        onClick={() => {
                          setViewingInsightId(item.moduleId);
                          setCurrentViewMode('table');
                          navigate(`${basePath}/results`);
                        }}
                        style={{ padding: '8px 16px', background: '#05192d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        View Insights
                      </button>
                    ) : item.status === 'Refreshing...' ? (
                      <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid #f1f5f9', borderTop: '2px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          const stillMissing = item.missingFiles?.filter(reqFile => !files[reqFile]) || [];

                          if (item.missingFiles && item.missingFiles.length > 0) {
                            if (stillMissing.length === 0) {
                              return (
                                <button onClick={() => handleRetryProcessing(item)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#05192d' }}>
                                  Retry Processing
                                </button>
                              );
                            } else {
                              return item.missingFiles.map(reqFile => {
                                const isUploadedNow = !!files[reqFile];
                                const fileLabel = FILE_TYPES.find(f => f.key === reqFile)?.label || reqFile;

                                if (isUploadedNow) {
                                  return (
                                    <div key={reqFile} style={{ fontSize: '12px', background: '#f0fff4', color: '#166534', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center', fontWeight: 'bold' }}>
                                      {"✅ "} {fileLabel} Ready
                                    </div>
                                  );
                                } else {
                                  return (
                                    <label key={reqFile} style={{ fontSize: '12px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-block', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                      <input type="file" accept=".csv, .xls, .xlsx, .zip" style={{ display: 'none' }} onChange={(e) => handleInlineUploadOnly(e, item, reqFile)} />
                                      <span style={{ color: '#2563eb', fontWeight: 'bold' }}>Upload {fileLabel}</span>
                                    </label>
                                  );
                                }
                              });
                            }
                          } else {
                            return (
                              <button onClick={() => handleRetryProcessing(item)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#05192d' }}>
                                Retry Processing
                              </button>
                            );
                          }
                        })()}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'center' }}>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      title="Delete Record"
                      style={{ background: 'none', border: 'none', color: '#000000ff', cursor: 'pointer', fontSize: '20px', transition: 'color 0.2s' }}
                      onMouseOver={(e) => e.target.style.color = '#ef4444'}
                      onMouseOut={(e) => e.target.style.color = '#080808ff'}
                    >
                      {"🗑"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReportView = () => {
    // Split history into current execution vs restored sessions
    const currentSessionHistory = history.filter(h => !h.isRestored);
    const restoredHistory = history.filter(h => h.isRestored);

    return (
      <div className="animate-in" style={{ width: '100%', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => navigate(`${basePath}/insight-selection`)} style={{ border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>← Control Selection</button>
            <h2 style={{ color: '#05192d', fontSize: '28px' }}>Execution Report</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleRefreshReport} style={{ background: '#00df81', color: '#05192d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{"↻ Refresh Successful Controls"}</button>
            <button onClick={() => setIsClearModalOpen(true)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Clear Report History</button>
          </div>
        </div>

        {renderClearHistoryModal()}

        {history.length > 0 ? (
          <>
            {renderHistoryTable(currentSessionHistory, "Current Session Execution")}
            {renderHistoryTable(restoredHistory, "Restored Historical Insights")}
          </>
        ) : (
          <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>{"📊"}</div>
            <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#05192d' }}>Report Empty</div>
            <p>Ready for your first audit analysis.</p>
          </div>
        )}

        {savedSessions.length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <h3 style={{ color: '#05192d', margin: 0 }}>{"📁"} Saved Session History</h3>
              <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>{savedSessions.length} sessions</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {savedSessions.map(session => (
                <div key={session.id} style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', transition: '0.2s' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                    <span>{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 style={{ color: '#05192d', margin: '0 0 8px 0', fontSize: '16px' }}>{session.name}</h4>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px 0' }}>{session.insights.length} insight modules analyzed.</p>
                  <button
                    onClick={() => handleLoadSession(session.id)}
                    style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#05192d', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                    {"📂 Restore Session"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="up-page-wrapper">
      {renderNewSessionModal()}
      <nav className="up-nav" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '15px 0' }}>
        <div className="up-inner-nav" style={{ maxWidth: '1400px', margin: '0 auto', width: '90%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={ajalabsblack} alt="AjaLabs" className="nav-logo-aja" style={{ height: '35px' }} />
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <button onClick={() => setIsNewSessionModalOpen(true)} style={{ background: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#05192d' }}>
              New Session
            </button>
            <button onClick={handleReportToggle} style={{ background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', color: view === 'report' ? '#00df81' : '#64748b' }}>{view === 'report' ? 'Close Report' : 'Report'}</button>
            <button onClick={handleSignOutClick} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>Sign Out</button>
            <img src={logo} alt="JK Cement" className="nav-logo-jk" style={{ height: '40px' }} />
          </div>
        </div>
      </nav>
      <div className="up-main-area" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '40px' }}>
        <Routes>
          <Route path="new-session" element={renderUploadView()} />
          <Route path="insight-selection" element={renderKPIView()} />
          <Route path="processing" element={renderProcessingView()} />
          <Route path="results" element={renderResultsView()} />
          <Route path="report" element={renderReportView()} />
          <Route path="/" element={<Navigate to="new-session" replace />} />
          <Route path="*" element={<Navigate to="new-session" replace />} />
        </Routes>
      </div>
      <footer className="uploader-page-footer">
        <p>Copyright @ 2026 | Powered by Ajalabs | Data Privacy</p>
      </footer>
    </div>
  );
};

export default Uploader;
