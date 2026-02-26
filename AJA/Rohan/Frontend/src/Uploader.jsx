import React, { useState } from "react";
import "./uploader.css";
import uploaderImg from "./assets/images/upload.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const INSIGHT_OPTIONS = [
  { id: "PJPA27", label: "PJPA27 - Notice Period Expense Risk" },
  { id: "PJPA28", label: "PJPA28 - Benford's Law" },
  { id: "PJPA29", label: "PJPA29 - New Joiner Early Claims" },
  { id: "PJPA30", label: "PJPA30 - Short Trip Frequency Abuse" },
  { id: "PJPA31", label: "PJPA31 - Structural Splitting" },
  { id: "PJPA32_HOL", label: "PJPA32 - Holiday Travel" },
  { id: "PJPA32_WE", label: "PJPA32 - Weekend Travel" },
  { id: "PJPA33", label: "PJPA33 - Bulk Booking Reimbursements" },
  { id: "PJPA34", label: "PJPA34 - High-Frequency Low Value Claims" },
  { id: "PJPA35", label: "PJPA35 - Duplicate Report ID" },
];

const Uploader = ({ logo, handleLogout }) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedInsight, setSelectedInsight] = useState("");
  const [step, setStep] = useState("select"); 
  const [viewMode, setViewMode] = useState(null);
  const [insightData, setInsightData] = useState([]);
  
  // File Upload State
  const [files, setFiles] = useState({
    concurFile: null,
    leftEmpFile: null,
    empMasterFile: null,
    lineItemFile: null
  });
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // --- Handlers ---
  const handleFileChange = (e, fileKey) => {
    setFiles({ ...files, [fileKey]: e.target.files[0] });
  };

  const handleUploadSubmit = async () => {
    setIsUploading(true);
    setUploadStatus("Uploading and processing master data... Please wait.");
    
    const formData = new FormData();
    if (files.concurFile) formData.append("concurFile", files.concurFile);
    if (files.leftEmpFile) formData.append("leftEmpFile", files.leftEmpFile);
    if (files.empMasterFile) formData.append("empMasterFile", files.empMasterFile);
    if (files.lineItemFile) formData.append("lineItemFile", files.lineItemFile);

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (response.ok && result.status === "success") {
        setUploadStatus("✅ Data processed successfully! You can now run analyses.");
        setTimeout(() => {
            setActiveTab("analyze");
            setUploadStatus("");
        }, 2000);
      } else {
        setUploadStatus(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setUploadStatus("❌ Failed to connect to the backend server.");
    } finally {
      setIsUploading(false);
    }
  };

  const startAnalysis = async () => {
    if (!selectedInsight) return;
    setStep("processing");
    
    try {
      const response = await fetch(`http://localhost:5000/api/insight/${selectedInsight}/data`);
      const result = await response.json();

      if (response.ok && result.status === "success") {
        setInsightData(result.data);
        setStep("completed");
        setViewMode("table"); // Automatically show the table when done
      } else {
        alert(result.message || "Failed to fetch data. Did you upload the master files?");
        setStep("select");
      }
    } catch (error) {
      alert("Cannot connect to backend server. Is app.py running?");
      setStep("select");
    }
  };

  const resetAnalysis = () => {
    setStep("select");
    setSelectedInsight("");
    setViewMode(null);
    setInsightData([]);
  };

  const handleDownload = () => {
    window.open(`http://localhost:5000/api/insight/${selectedInsight}/download`, '_blank');
  };

  // --- Renderers ---
  const renderTable = () => {
    if (!insightData || insightData.length === 0) return <p>No data found.</p>;
    const headers = Object.keys(insightData[0]);
    
    return (
      <div style={{ overflowX: 'auto', maxHeight: '600px', width: '100%', background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#05192d', color: 'white', position: 'sticky', top: 0 }}>
              {headers.map(h => <th key={h} style={{ padding: '12px', borderBottom: '2px solid #ddd', whiteSpace: 'nowrap' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {insightData.map((row, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8fafc' : 'white' }}>
                {headers.map(h => <td key={h} style={{ padding: '10px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row[h]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!insightData || insightData.length === 0) return <p>No data found.</p>;
    const headers = Object.keys(insightData[0]);
    const xAxisKey = headers.find(h => typeof insightData[0][h] === 'string') || headers[0];
    const yAxisKey = headers.find(h => typeof insightData[0][h] === 'number') || headers[1];

    return (
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', height: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '20px', color: '#05192d' }}>{selectedInsight} Overview</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={insightData.slice(0, 30)} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} angle={-45} textAnchor="end" height={80} tick={{fontSize: 12}} />
            <YAxis tick={{fontSize: 12}} />
            <Tooltip cursor={{fill: '#f1f5f9'}} />
            <Bar dataKey={yAxisKey} fill="#00df81" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="up-page-wrapper">
      <nav className="up-nav" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '15px 0' }}>
        <div className="up-inner-nav">
          <img src={ajalabsblack} alt="AjaLabs" className="nav-logo-aja" style={{ height: '40px' }} />
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span className="user-badge" style={{ background: '#e2e8f0', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', color: '#05192d' }}>Role: Uploader</span>
            <button className="logout-btn" onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>Sign Out</button>
            <img src={logo} alt="JK Cement" className="nav-logo-jk" style={{ height: '40px' }} />
          </div>
        </div>
      </nav>

      {/* --- RESULTS VIEW (Full Width) --- */}
      {viewMode === "table" || viewMode === "dashboard" ? (
        <div className="dashboard-root" style={{ padding: '40px', background: '#f8fafc', minHeight: 'calc(100vh - 70px)' }}>
          <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ color: '#05192d' }}>{INSIGHT_OPTIONS.find(o => o.id === selectedInsight)?.label}</h2>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                style={{ padding: '8px 16px', background: viewMode === 'table' ? '#05192d' : 'white', color: viewMode === 'table' ? 'white' : '#05192d', border: '1px solid #05192d', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => setViewMode("table")}
              >Table View</button>
              <button 
                style={{ padding: '8px 16px', background: viewMode === 'dashboard' ? '#05192d' : 'white', color: viewMode === 'dashboard' ? 'white' : '#05192d', border: '1px solid #05192d', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => setViewMode("dashboard")}
              >Chart View</button>
              <button 
                style={{ padding: '8px 16px', background: '#00df81', color: '#05192d', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={handleDownload}
              >↓ Download Excel</button>
              <button 
                style={{ padding: '8px 16px', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                onClick={resetAnalysis}
              >← Back</button>
            </div>
          </div>
          {viewMode === "table" ? renderTable() : renderDashboard()}
        </div>
      ) : (
        /* --- UPLOAD & SELECT VIEW (Split Layout) --- */
        <div className="up-main-area" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div className="up-split-layout" style={{ display: 'flex', maxWidth: '1200px', width: '100%', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
            
            <section className="up-column-left" style={{ flex: 1, padding: '50px' }}>
              <h1 style={{ color: '#05192d', marginBottom: '10px', fontSize: '28px' }}>Audit Control Center</h1>
              <p style={{ color: '#64748b', marginBottom: '30px', lineHeight: '1.6' }}>Upload your master datasets below, or jump straight to analysis if the data is already up to date.</p>
              
              {/* Tab Navigation */}
              <div style={{ display: 'flex', marginBottom: '30px', borderBottom: '2px solid #e2e8f0' }}>
                <button 
                  style={{ flex: 1, padding: '15px', border: 'none', background: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', borderBottom: activeTab === 'upload' ? '3px solid #00df81' : 'none', color: activeTab === 'upload' ? '#05192d' : '#94a3b8' }}
                  onClick={() => setActiveTab("upload")}
                >1. Upload Master Data</button>
                <button 
                  style={{ flex: 1, padding: '15px', border: 'none', background: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', borderBottom: activeTab === 'analyze' ? '3px solid #00df81' : 'none', color: activeTab === 'analyze' ? '#05192d' : '#94a3b8' }}
                  onClick={() => setActiveTab("analyze")}
                >2. Generate Insights</button>
              </div>

              {/* Tab 1: UPLOAD */}
              {activeTab === "upload" && (
                <div className="upload-section animate-in">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Concur Header Data (CSV/Excel)</label>
                      <input type="file" onChange={(e) => handleFileChange(e, "concurFile")} style={{ width: '100%', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Line Item Expenses (CSV/Excel)</label>
                      <input type="file" onChange={(e) => handleFileChange(e, "lineItemFile")} style={{ width: '100%', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Employee Master (CSV/Excel)</label>
                      <input type="file" onChange={(e) => handleFileChange(e, "empMasterFile")} style={{ width: '100%', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Left Employees (CSV/Excel)</label>
                      <input type="file" onChange={(e) => handleFileChange(e, "leftEmpFile")} style={{ width: '100%', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '8px' }} />
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleUploadSubmit} 
                    disabled={isUploading}
                    style={{ width: '100%', padding: '15px', background: isUploading ? '#94a3b8' : '#05192d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', marginTop: '25px', cursor: isUploading ? 'not-allowed' : 'pointer', transition: '0.3s' }}
                  >
                    {isUploading ? "Processing Data Pipeline..." : "Upload & Sync Data"}
                  </button>
                  {uploadStatus && <p style={{ marginTop: '15px', fontSize: '14px', color: uploadStatus.includes('❌') ? '#ef4444' : '#10b981', textAlign: 'center', fontWeight: '500' }}>{uploadStatus}</p>}
                </div>
              )}

              {/* Tab 2: ANALYZE */}
              {activeTab === "analyze" && (
                <div className="analysis-box animate-in">
                  {step === "select" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <select 
                        value={selectedInsight} 
                        onChange={(e) => setSelectedInsight(e.target.value)}
                        style={{ width: '100%', padding: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', color: '#05192d', outline: 'none' }}
                      >
                        <option value="" disabled>-- Select Audit Module to Run --</option>
                        {INSIGHT_OPTIONS.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                      <button 
                        onClick={startAnalysis} 
                        disabled={!selectedInsight}
                        style={{ width: '100%', padding: '15px', background: !selectedInsight ? '#e2e8f0' : '#00df81', color: !selectedInsight ? '#94a3b8' : '#05192d', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: !selectedInsight ? 'not-allowed' : 'pointer', transition: '0.3s' }}
                      >
                        Generate Insight
                      </button>
                    </div>
                  )}

                  {step === "processing" && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #00df81', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                      <h3 style={{ color: '#05192d' }}>Fetching Data from Server...</h3>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="up-column-right" style={{ flex: 1, background: '#05192d', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ textAlign: 'center', padding: '40px', zIndex: 2 }}>
                <img src={uploaderImg} alt="Analysis Illustration" style={{ width: '80%', maxWidth: '300px', marginBottom: '30px' }} />
                <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '10px' }}>AI-Powered Auditing</h3>
                <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6' }}>Ensure compliance and detect anomalies across thousands of expense records instantly.</p>
              </div>
              <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(0, 223, 129, 0.1)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 1 }}></div>
            </section>

          </div>
        </div>
      )}
      
      {/* Spinner animation keyframes */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Uploader;