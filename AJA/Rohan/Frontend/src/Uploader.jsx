import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import "./uploader.css";
import Dashboard from "./Dashboard";
import PJPA36Dashboard from "./PJPA36Dashboard";
import uploaderImg from "./assets/images/upload.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";
import bin from "./assets/images/bin.gif";

const AnimatedBinButton = ({ onDelete }) => {
  const [phase, setPhase] = useState('idle');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBinClick = () => {
    if (phase !== 'idle') return;
    setPhase('open');
    setShowConfirm(true);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPhase('closing');
    setTimeout(() => setPhase('idle'), 400);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    setPhase('swallowing');
    setTimeout(() => {
      setPhase('closing');
      setTimeout(() => {
        onDelete();
        setPhase('idle');
      }, 400);
    }, 1200);
  };

  const lidOpen = phase === 'open' || phase === 'swallowing';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', width: '20px', height: '28px' }}>
      <style>{`
        @keyframes binLidOpen { from { transform: rotate(0deg); } to { transform: rotate(-48deg) translateY(-1px); } }
        @keyframes binLidClose { from { transform: rotate(-48deg) translateY(-1px); } to { transform: rotate(0deg); } }
        @keyframes paperCrumple {
          0%   { opacity:1;   top:-32px; left:50%; transform:translateX(-50%) scale(1)    rotate(0deg);   border-radius:2px; }
          20%  { opacity:1;   top:-20px; left:48%; transform:translateX(-50%) scale(0.88) rotate(-10deg); border-radius:4px; }
          45%  { opacity:1;   top:-8px;  left:52%; transform:translateX(-50%) scale(0.65) rotate(14deg);  border-radius:6px; }
          65%  { opacity:.85; top:0px;   left:50%; transform:translateX(-50%) scale(0.42) rotate(-7deg);  border-radius:50% 40% 45% 50%; }
          82%  { opacity:.4;  top:6px;   left:50%; transform:translateX(-50%) scale(0.22) rotate(5deg);   border-radius:50%; }
          100% { opacity:0;   top:10px;  left:50%; transform:translateX(-50%) scale(0.05) rotate(0deg);   border-radius:50%; }
        }
        @keyframes popRightToLeft { 0% { opacity: 0; transform: translate(10px, -50%) scale(0.95); } 100% { opacity: 1; transform: translate(0, -50%) scale(1); } }
        .anim-bin-wrap:hover .anim-bin-body, .anim-bin-wrap:hover .anim-bin-lid { filter: brightness(1.3); }
      `}</style>

      {showConfirm && (
        <>
          <div onClick={handleCancel} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <div style={{ position: 'absolute', right: '34px', top: '60%', transform: 'translateY(-50%)', zIndex: 9999, background: '#fff', borderRadius: '16px', padding: '16px 20px', width: '240px', textAlign: 'left', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1px solid #edf2f7', animation: 'popRightToLeft 0.2s cubic-bezier(0.2, 1, 0.3, 1) forwards' }}>
            <div style={{ position: 'absolute', right: '-7px', top: '50%', transform: 'translateY(-50%) rotate(45deg)', width: '14px', height: '14px', background: '#fff', borderRight: '1px solid #edf2f7', borderTop: '1px solid #edf2f7' }} />
            <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '16px', fontWeight: '800' }}>Delete Record?</h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCancel} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>No</button>
              <button onClick={handleConfirm} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)' }}>Yes, Delete</button>
            </div>
          </div>
        </>
      )}

      <div className="anim-bin-wrap" onClick={handleBinClick} style={{ position: 'relative', width: '20px', height: '28px', cursor: phase === 'idle' ? 'pointer' : 'default', userSelect: 'none' }}>
        {phase === 'swallowing' && (
          <div style={{ position: 'absolute', top: '-32px', left: '50%', width: '14px', height: '18px', background: 'linear-gradient(135deg,#f8fafc 60%,#e2e8f0)', border: '1.5px solid #cbd5e1', borderRadius: '2px', display: 'flex', flexDirection: 'column', gap: '2px', padding: '3px', animation: 'paperCrumple 1.15s forwards', pointerEvents: 'none', zIndex: 10 }}>
            {[...Array(3)].map((_, i) => (<div key={i} style={{ height: '2px', background: '#94a3b8', borderRadius: '1px', width: i === 1 ? '60%' : '85%' }} />))}
          </div>
        )}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '8px', height: '3px', background: '#1e293b', borderRadius: '2px 2px 0 0', zIndex: 3 }} />
        <div className="anim-bin-lid" style={{ position: 'absolute', top: '2px', left: '1px', width: '18px', height: '4px', background: '#1e293b', borderRadius: '2px', zIndex: 2, transformOrigin: 'right center', animation: lidOpen ? 'binLidOpen 0.3s forwards' : phase === 'closing' ? 'binLidClose 0.35s forwards' : 'none' }} />
        <div className="anim-bin-body" style={{ position: 'absolute', top: '8px', left: '1px', width: '18px', height: '20px', background: '#1e293b', borderRadius: '2px 2px 4px 4px', zIndex: 1, overflow: 'hidden' }}>
          {[4, 8, 12].map(x => (<div key={x} style={{ position: 'absolute', top: '3px', left: `${x}px`, width: '2px', height: '13px', background: 'rgba(255,255,255,0.15)', borderRadius: '1px' }} />))}
        </div>
      </div>
    </div>
  );
};

const DeleteSessionButton = ({ onHide }) => {
  const [phase, setPhase] = useState('idle');

  const handleClick = () => {
    if (phase !== 'hovered' && phase !== 'idle') return;
    setPhase('confirmed');
    setTimeout(() => {
      setPhase('done');
      setTimeout(() => {
        onHide();
      }, 600);
    }, 900);
  };

  return (
    <>
      <style>{`
        @keyframes dsb-x-pop { 0% { opacity: 0; transform: scale(0.5) rotate(-20deg); } 60% { opacity: 1; transform: scale(1.2) rotate(5deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
        @keyframes dsb-check-pop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes dsb-tooltip-in { 0% { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.95); } 100% { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); } }
        .dsb-wrap { position: relative; display: inline-flex; flex-shrink: 0; }
        .dsb-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #f8fafc; cursor: pointer; overflow: visible; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; }
        .dsb-btn:hover { border-color: #fca5a5; background: #fff5f5; box-shadow: 0 2px 8px rgba(239,68,68,0.15); }
        .dsb-btn.phase-confirmed { border-color: #22c55e !important; background: #f0fdf4 !important; box-shadow: 0 2px 8px rgba(34,197,94,0.15) !important; }
        .dsb-label { font-size: 9px; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; text-transform: uppercase; transition: opacity 0.2s, transform 0.2s; position: absolute; white-space: nowrap; pointer-events: none; }
        .dsb-btn:hover .dsb-label { opacity: 0; transform: scale(0.6); }
        .dsb-btn.phase-confirmed .dsb-label { opacity: 0 !important; }
        .dsb-x-icon { position: absolute; width: 13px; height: 13px; opacity: 0; pointer-events: none; }
        .dsb-x-icon::before, .dsb-x-icon::after { content: ''; position: absolute; top: 50%; left: 0; width: 13px; height: 2.5px; background: #ef4444; border-radius: 2px; margin-top: -1.25px; }
        .dsb-x-icon::before { transform: rotate(45deg); }
        .dsb-x-icon::after  { transform: rotate(-45deg); }
        .dsb-btn:hover .dsb-x-icon { animation: dsb-x-pop 0.28s cubic-bezier(0.2,1,0.3,1) forwards; }
        .dsb-btn.phase-confirmed .dsb-x-icon { opacity: 0 !important; animation: none !important; }
        .dsb-check { position: absolute; font-size: 15px; opacity: 0; pointer-events: none; line-height: 1; }
        .dsb-btn.phase-confirmed .dsb-check { animation: dsb-check-pop 0.4s cubic-bezier(0.2,1,0.3,1) forwards; }
        .dsb-tooltip { display: none; position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); background: #1e293b; color: #f1f5f9; font-size: 11px; font-weight: 600; white-space: nowrap; padding: 6px 10px; border-radius: 7px; pointer-events: none; z-index: 999; letter-spacing: 0.2px; box-shadow: 0 4px 14px rgba(0,0,0,0.2); }
        .dsb-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #1e293b; }
        .dsb-btn:hover .dsb-tooltip { display: block; animation: dsb-tooltip-in 0.2s cubic-bezier(0.2,1,0.3,1) forwards; }
        .dsb-btn.phase-confirmed .dsb-tooltip { display: none !important; }
      `}</style>
      <div className="dsb-wrap">
        <button className={`dsb-btn ${phase === 'confirmed' || phase === 'done' ? 'phase-confirmed' : ''}`} onClick={handleClick} onMouseEnter={() => phase === 'idle' && setPhase('hovered')} onMouseLeave={() => phase === 'hovered' && setPhase('idle')}>
          <span className="dsb-label">DEL</span><span className="dsb-x-icon" /><span className="dsb-check">✅</span><span className="dsb-tooltip">🗑 Delete this session</span>
        </button>
      </div>
    </>
  );
};

const SessionCard = ({ session, formatDateTime, onLoad, onHide }) => {
  const [hiding, setHiding] = useState(false);
  const handleHide = () => { setHiding(true); setTimeout(() => onHide(session.id), 500); };
  return (
    <>
      <style>{`
        @keyframes session-card-exit { 0% { opacity: 1; transform: scale(1); max-height: 300px; margin-bottom: 0; } 30% { opacity: 0.6; transform: scale(0.97); } 100% { opacity: 0; transform: scale(0.92); max-height: 0; margin-bottom: -20px; } }
        .session-card-hiding { animation: session-card-exit 0.5s cubic-bezier(0.4,0,0.2,1) forwards; pointer-events: none; overflow: hidden; }
      `}</style>
      <div className={hiding ? 'session-card-hiding' : ''} style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', transition: 'box-shadow 0.2s', position: 'relative' }}>
        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{formatDateTime(session.timestamp).split(' ')[0]}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{formatDateTime(session.timestamp).split(' ')[1]}</span>
            <DeleteSessionButton onHide={handleHide} />
          </div>
        </div>
        <h4 style={{ color: '#05192d', margin: '0 0 8px 0', fontSize: '16px' }}>{session.name}</h4>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px 0' }}>{session.insights.length} insight modules analyzed.</p>
        <button onClick={onLoad} style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#05192d', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
          {"📂 Restore Session"}
        </button>
      </div>
    </>
  );
};

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

  const authHeaders = {
    "Content-Type": "application/json",
    "X-Username": user?.username || "default"
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    let d = new Date(dateString);
    if (isNaN(d.getTime()) && typeof dateString === 'string') {
      d = new Date(dateString.replace(" ", "T"));
    }
    if (isNaN(d.getTime())) return dateString;

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

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
  const [isRestoring, setIsRestoring] = useState(false);
  const [viewingInsightId, setViewingInsightId] = useState(() => localStorage.getItem("aja_viewing_insight") || null);

  // -- PROFILE AND PASSWORD MODAL STATES --
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [pwdStatus, setPwdStatus] = useState({ type: '', msg: '' });
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // -- EDIT PROFILE STATE --
  const profileStorageKey = `aja_profile_${user?.username || 'default'}`;
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = localStorage.getItem(profileStorageKey);
      return saved ? JSON.parse(saved) : { fullName: '', email: '', phone: '', address: '', avatar: '' };
    } catch { return { fullName: '', email: '', phone: '', address: '', avatar: '' }; }
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState(profileData);

  useEffect(() => {
    if (viewingInsightId) localStorage.setItem("aja_viewing_insight", viewingInsightId);
    else localStorage.removeItem("aja_viewing_insight");
  }, [viewingInsightId]);

  const [files, setFiles] = useState({ concurFile: null, leftEmpFile: null, empMasterFile: null, lineItemFile: null });
  const [isUploading, setIsUploading] = useState(false);
  const [activeAnalysisResults, setActiveAnalysisResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aja_last_session_results")) || []; }
    catch { return []; }
  });

  const [currentViewMode, setCurrentViewMode] = useState("table");
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
  const [hiddenSessionIds, setHiddenSessionIds] = useState([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);

  // TOAST FIX: Now supports 'success'
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (text, type = 'error') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchSavedSessions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/sessions", { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setSavedSessions(data);
      }
    } catch (e) { }
  };

  useEffect(() => { fetchSavedSessions(); }, [view]);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("aja_audit_history");
    return saved ? JSON.parse(saved) : [];
  });

  const safelyPersistResults = (data) => {
    const KEY = "aja_last_session_results";
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {
      try {
        const metadataOnly = data.map(({ data, ...rest }) => ({ ...rest, data: [], isMetadataOnly: true }));
        localStorage.setItem(KEY, JSON.stringify(metadataOnly));
      } catch (e2) { }
    }
  };

  useEffect(() => {
    try {
      const historyMinimal = history.map(({ data, ...rest }) => rest);
      localStorage.setItem("aja_audit_history", JSON.stringify(historyMinimal));
    } catch (e) { localStorage.removeItem("aja_audit_history"); }
  }, [history]);

  const handleReportToggle = () => {
    if (view === "report") {
      if (activeAnalysisResults.length > 0 && viewingInsightId) navigate(`${basePath}/results`);
      else navigate(`${basePath}/new-session`);
    } else {
      navigate(`${basePath}/report`);
    }
  };

  const startNewSession = async () => {
    if (activeAnalysisResults.length > 0) safelyPersistResults(activeAnalysisResults);
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
      const currentSessionInsights = activeAnalysisResults.filter(r => !r.isRestored).map(r => r.moduleId);
      if (currentSessionInsights.length === 0) return true;

      const response = await fetch("http://localhost:5000/api/save-session", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ name: name, insights: currentSessionInsights })
      });
      if (response.ok) {
        fetchSavedSessions();
        return true;
      }
    } catch (e) { }
    return false;
  };

  const handleDeleteSession = async (sessionId) => {
    setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
    setHiddenSessionIds(prev => prev.filter(id => id !== sessionId));
    try { await fetch(`http://localhost:5000/api/sessions/${sessionId}`, { method: "DELETE", headers: authHeaders }); } catch (e) { fetchSavedSessions(); }
  };

  const handleLoadSession = async (sessionId) => {
    try {
      setIsRestoring(true);
      navigate(`${basePath}/processing`);
      const session = savedSessions.find(s => s.id === sessionId);
      if (!session) return;

      const loadedResults = [];
      for (const insightId of session.insights) {
        const res = await fetch(`http://localhost:5000/api/sessions/${sessionId}/${insightId}/data`, { headers: authHeaders });
        if (res.ok) {
          const dataJson = await res.json();
          loadedResults.push({
            id: insightId + "_" + Date.now() + Math.random(),
            moduleId: insightId,
            name: INSIGHT_OPTIONS.find(o => o.id === insightId)?.label || insightId,
            status: "Success",
            reason: `Restored from: ${session.name}`,
            missingFiles: [],
            data: dataJson.data || [],
            timestamp: session.timestamp,
            isRestored: true,
            sessionId: sessionId
          });
        }
      }

      setActiveAnalysisResults(prev => {
        const newResults = [...prev.filter(p => !loadedResults.find(l => l.moduleId === p.moduleId && p.sessionId === l.sessionId)), ...loadedResults];
        safelyPersistResults(newResults);
        return newResults;
      });

      setHistory(prev => [...loadedResults, ...prev].slice(0, 50));
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
        Object.keys(updated).forEach(k => { mockFiles[k] = updated[k] ? { name: updated[k].name } : null; });
        localStorage.setItem("aja_session_files", JSON.stringify(mockFiles));
        return updated;
      });
    }
  };

  const removeFile = (fileKey) => {
    setFiles((prev) => {
      const updated = { ...prev, [fileKey]: null };
      const mockFiles = {};
      Object.keys(updated).forEach(k => { mockFiles[k] = updated[k] ? { name: updated[k].name } : null; });
      localStorage.setItem("aja_session_files", JSON.stringify(mockFiles));
      return updated;
    });
  };

  const handleUploadSubmit = async () => {
    setIsUploading(true);
    const formData = new FormData();
    Object.keys(files).forEach(key => {
      if (files[key] && files[key] instanceof File) formData.append(key, files[key]);
    });

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: { "X-Username": user?.username || "default" },
        body: formData
      });
      const resData = await response.json();

      if (response.ok) {
        setUploadKPIs(resData.kpis || {});
        localStorage.setItem("aja_session_kpis", JSON.stringify(resData.kpis || {}));
        navigate(`${basePath}/insight-selection`);
      } else {
        alert(`Upload error: ${resData.message}`);
      }
    } catch (err) { alert("Upload failed. Ensure backend is running."); } finally { setIsUploading(false); }
  };

  const startAnalysis = async () => {
    navigate(`${basePath}/processing`);
    const currentReports = [];
    const toRun = [];

    selectedInsights.forEach(insightId => {
      const insight = INSIGHT_OPTIONS.find(o => o.id === insightId);
      const missingFiles = insight.req.filter(reqFile => !files[reqFile]);

      if (missingFiles.length > 0) {
        currentReports.push({ id: insight.id + "_" + Date.now() + Math.random(), moduleId: insight.id, name: insight.label, status: "Failed", reason: `Missing Data: ${FILE_TYPES.find(f => f.key === missingFiles[0])?.label || missingFiles[0]}`, missingFiles: missingFiles, data: [], timestamp: new Date().toISOString(), isRestored: false });
      } else {
        toRun.push(insightId);
        currentReports.push({ id: insight.id + "_" + Date.now() + Math.random(), moduleId: insight.id, name: insight.label, status: "In Progress", reason: "Processing...", missingFiles: [], data: [], timestamp: new Date().toISOString(), isRestored: false });
      }
    });

    const reportsToUpdate = [...currentReports];
    setHistory(prev => [...reportsToUpdate, ...prev].slice(0, 50));

    for (const insightId of toRun) {
      const insightDef = INSIGHT_OPTIONS.find(o => o.id === insightId);
      try {
        const genRes = await fetch("http://localhost:5000/api/generate", {
          method: "POST", headers: authHeaders, body: JSON.stringify({ insights: [insightId] })
        });
        if (!genRes.ok) throw new Error("Generation failed");

        const dataRes = await fetch(`http://localhost:5000/api/insight/${insightId}/data`, { headers: authHeaders });
        if (!dataRes.ok) throw new Error("Data retrieval failed");

        const dataJson = await dataRes.json();
        const extractedData = Array.isArray(dataJson) ? dataJson : (dataJson.data || []);

        const successItem = { id: insightId + "_" + Date.now() + Math.random(), moduleId: insightId, name: insightDef.label, status: "Success", reason: "", missingFiles: [], data: extractedData, timestamp: new Date().toISOString(), isRestored: false };

        setActiveAnalysisResults(prev => {
          const updated = [...prev.filter(p => !(p.moduleId === insightId && !p.isRestored)), successItem];
          safelyPersistResults(updated);
          return updated;
        });

        setHistory(prev => prev.map(item => (item.moduleId === insightId && item.status === "In Progress") ? successItem : item));

      } catch (err) {
        const failItem = { id: insightId + "_" + Date.now() + Math.random(), moduleId: insightId, name: insightDef.label, status: "In-Active", reason: "Processing error.", missingFiles: [], data: [], timestamp: new Date().toISOString(), isRestored: false };
        setHistory(prev => prev.map(item => (item.moduleId === insightId && item.status === "In Progress") ? failItem : item));
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
        Object.keys(updated).forEach(k => { mockFiles[k] = updated[k] ? { name: updated[k].name } : null; });
        localStorage.setItem("aja_session_files", JSON.stringify(mockFiles));
        return updated;
      });

      const uploadRes = await fetch("http://localhost:5000/api/upload", { method: "POST", headers: { "X-Username": user?.username || "default" }, body: formData });
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
        method: "POST", headers: authHeaders, body: JSON.stringify({ insights: [reportItem.moduleId] })
      });
      if (!genRes.ok) throw new Error("Backend generation failed");

      const dataRes = await fetch(`http://localhost:5000/api/insight/${reportItem.moduleId}/data`, { headers: authHeaders });
      if (!dataRes.ok) throw new Error("Data retrieval failed");

      const dataJson = await dataRes.json();
      const extractedData = Array.isArray(dataJson) ? dataJson : (dataJson.data || []);

      const updatedItem = { ...reportItem, status: "Success", reason: "", missingFiles: [], data: extractedData, timestamp: new Date().toISOString(), isRestored: false };

      setHistory(prev => prev.map(item => item.id === reportItem.id ? updatedItem : item));
      setActiveAnalysisResults(prev => {
        if (prev.some(p => p.id === reportItem.id)) return prev.map(p => p.id === reportItem.id ? updatedItem : p);
        return [...prev, updatedItem];
      });

    } catch (err) {
      setHistory(prev => prev.map(item => item.id === reportItem.id ? { ...item, status: 'Failed', reason: "Retry failed. Check file format." } : item));
    }
  };

  const handleRefreshReport = async () => {
    const successfulItems = history.filter(item => item.status === "Success");
    if (successfulItems.length === 0) { showToast("Empty session to refresh", "warn"); return; }

    setHistory(prev => prev.map(item => item.status === "Success" ? { ...item, status: "Reprocessing", reason: "Fetching latest data..." } : item));

    successfulItems.forEach(async (reportItem) => {
      try {
        const isArchive = reportItem.isRestored === true;
        const url = isArchive ? `http://localhost:5000/api/sessions/${reportItem.sessionId}/${reportItem.moduleId}/data` : `http://localhost:5000/api/insight/${reportItem.moduleId}/data`;

        const res = await fetch(url, { headers: authHeaders });
        if (!res.ok) throw new Error("Failed to fetch data.");

        const dataJson = await res.json();
        const extractedData = Array.isArray(dataJson) ? dataJson : (dataJson.data || []);

        const refreshedItem = { ...reportItem, status: "Success", reason: reportItem.reason, data: extractedData, timestamp: new Date().toISOString() };
        setHistory(prev => prev.map(item => item.id === reportItem.id ? refreshedItem : item));

        setActiveAnalysisResults(prev => {
          let updated;
          if (prev.some(p => p.id === reportItem.id)) updated = prev.map(p => p.id === reportItem.id ? refreshedItem : p);
          else updated = [...prev, refreshedItem];
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
    setHistory((prev) => {
      const updatedHistory = prev.filter((item) => item.id !== id);
      try { localStorage.setItem("aja_audit_history", JSON.stringify(updatedHistory.map(({ data, ...rest }) => rest))); } catch (e) { }
      return updatedHistory;
    });
    setActiveAnalysisResults((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safelyPersistResults(updated);
      return updated;
    });
  };

  // --- AVATAR UPLOAD HANDLER ---
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- SAVE PROFILE HANDLER ---
  const handleSaveProfile = () => {
    setProfileData(tempProfile);
    localStorage.setItem(profileStorageKey, JSON.stringify(tempProfile));
    setIsEditingProfile(false);
    showToast('Profile updated successfully!', 'success');
  };

  // --- PASSWORD SUBMISSION HANDLER ---
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdStatus({ type: '', msg: '' });

    if (pwdForm.new !== pwdForm.confirm) {
      setPwdStatus({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await fetch("http://localhost:5000/api/change-password", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          username: user.username,
          old_password: pwdForm.old,
          new_password: pwdForm.new
        })
      });
      const data = await res.json();

      if (res.ok) {
        setPwdStatus({ type: 'success', msg: 'Password successfully updated!' });
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPwdForm({ old: '', new: '', confirm: '' });
          setPwdStatus({ type: '', msg: '' });
        }, 2000);
      } else {
        setPwdStatus({ type: 'error', msg: data.message || 'Failed to update password.' });
      }
    } catch (err) {
      setPwdStatus({ type: 'error', msg: 'Server error. Please try again.' });
    } finally {
      setIsChangingPwd(false);
    }
  };

  const getPremiumButtonStyle = (isActive) => ({
    padding: '12px 26px', borderRadius: '8px', border: 'none', fontWeight: '700', fontFamily: 'inherit', letterSpacing: '0.5px',
    background: isActive ? '#00df81' : 'transparent', color: isActive ? '#05192d' : '#64748b', cursor: 'pointer', fontSize: '15px', transition: 'all 0.3s ease',
    boxShadow: isActive ? '0 4px 12px rgba(0,223,129,0.3)' : 'none'
  });

  const renderUploadView = () => {
    const cardData = [
      { ...FILE_TYPES[0], icon: (<svg viewBox="0 0 120 120" fill="none" style={{ width: 90, height: 90 }}><rect x="20" y="15" width="70" height="90" rx="8" fill="#e8f5ff" stroke="#00df81" strokeWidth="2" /><rect x="30" y="30" width="50" height="6" rx="3" fill="#00df81" opacity="0.7" /><rect x="30" y="44" width="38" height="5" rx="2.5" fill="#b0e0ff" /><rect x="30" y="55" width="44" height="5" rx="2.5" fill="#b0e0ff" /><rect x="30" y="66" width="30" height="5" rx="2.5" fill="#b0e0ff" /><circle cx="85" cy="85" r="20" fill="#05192d" /><path d="M78 85 L83 90 L92 80" stroke="#00df81" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>), color: "#00df81", accent: "#e8fff4", tag: "01" },
      { ...FILE_TYPES[1], icon: (<svg viewBox="0 0 120 120" fill="none" style={{ width: 90, height: 90 }}><rect x="15" y="25" width="90" height="70" rx="8" fill="#fff5e8" stroke="#00df81" strokeWidth="2" /><rect x="15" y="25" width="90" height="20" rx="8" fill="#05192d" /><rect x="15" y="38" width="90" height="7" fill="#05192d" />{[0, 1, 2, 3].map(i => (<rect key={i} x="25" y={55 + i * 10} width={i % 2 === 0 ? 60 : 40} height="5" rx="2.5" fill={i === 0 ? "#00df81" : "#cbd5e1"} />))}<circle cx="92" cy="92" r="16" fill="#00df81" /><path d="M85 92 L90 96 L99 87" stroke="#05192d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>), color: "#00df81", accent: "#f0fff8", tag: "02" },
      { ...FILE_TYPES[2], icon: (<svg viewBox="0 0 120 120" fill="none" style={{ width: 90, height: 90 }}><circle cx="60" cy="42" r="22" fill="#e8f0ff" stroke="#00df81" strokeWidth="2" /><circle cx="60" cy="40" r="12" fill="#05192d" /><path d="M25 98 C25 75 95 75 95 98" fill="#e8f0ff" stroke="#00df81" strokeWidth="2" /><circle cx="90" cy="88" r="18" fill="#05192d" /><path d="M83 88 L88 93 L97 83" stroke="#00df81" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>), color: "#00df81", accent: "#f5f0ff", tag: "03" },
      { ...FILE_TYPES[3], icon: (<svg viewBox="0 0 120 120" fill="none" style={{ width: 90, height: 90 }}><rect x="20" y="20" width="55" height="70" rx="8" fill="#fff0f0" stroke="#00df81" strokeWidth="2" /><circle cx="47" cy="48" r="12" fill="#05192d" opacity="0.8" /><path d="M25 90 C25 72 70 72 70 90" fill="#fff0f0" stroke="#00df81" strokeWidth="1.5" /><path d="M78 50 L98 50 M88 40 L98 50 L88 60" stroke="#00df81" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="88" cy="88" r="16" fill="#05192d" /><path d="M82 88 L87 92 L95 83" stroke="#00df81" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>), color: "#00df81", accent: "#fff5f5", tag: "04" }
    ];

    const hasAnyFile = Object.values(files).some(f => f);

    return (
      <div className="upload-redesign-root animate-in">
        <div className="upload-bg-canvas">
          <div className="bg-orb bg-orb-1" /><div className="bg-orb bg-orb-2" /><div className="bg-orb bg-orb-3" /><div className="bg-grid" />
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-particle" style={{ left: `${8 + i * 8}%`, animationDelay: `${i * 0.4}s`, animationDuration: `${3 + (i % 3)}s`, width: i % 3 === 0 ? '6px' : '4px', height: i % 3 === 0 ? '6px' : '4px', opacity: 0.15 + (i % 4) * 0.06 }} />
          ))}
        </div>

        <div className="upload-redesign-inner">
          <div className="upload-header-block">
            <div className="upload-badge">Audit Session Setup</div>
            <h1 className="upload-title">Upload <span className="upload-title-accent">Master Data</span></h1>
            <p className="upload-subtitle">Select the files required for your audit session. Upload any combination to get started.</p>
          </div>

          <div className="upload-card-track">
            {cardData.map((type, idx) => {
              const isLoaded = !!files[type.key];
              return (
                <div key={type.key} className={`upload-file-card ${isLoaded ? 'upload-file-card--loaded' : ''}`} style={{ animationDelay: `${idx * 0.08}s` }}>
                  <div className="card-tag">{type.tag}</div>
                  <div className="card-illustration">
                    <div className="card-illustration-bg" />
                    {isLoaded ? (
                      <div className="card-loaded-check"><svg viewBox="0 0 60 60" fill="none" style={{ width: 70, height: 70 }}><circle cx="30" cy="30" r="28" fill="#05192d" /><path d="M18 30 L26 38 L42 22" stroke="#00df81" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                    ) : (<div className="card-svg-wrap">{type.icon}</div>)}
                  </div>
                  <div className="card-content">
                    <div className="card-label">{type.label}</div>
                    <div className="card-sub">{type.sub}</div>
                    {isLoaded ? (
                      <><div className="card-filename"><span className="card-filename-icon">📄</span><span className="card-filename-text">{files[type.key].name}</span></div><button onClick={() => removeFile(type.key)} className="card-remove-btn">✕ Remove</button></>
                    ) : (
                      <><label className="card-upload-label"><input type="file" accept=".csv, .xls, .xlsx, .zip" onChange={(e) => handleFileChange(e, type.key)} style={{ display: 'none' }} /><span className="card-upload-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>Select File</span></label><a href={type.sample} download onClick={(e) => e.stopPropagation()} className="card-sample-link">View sample ↗</a></>
                    )}
                  </div>
                  <div className={`card-status-strip ${isLoaded ? 'card-status-strip--on' : ''}`} />
                </div>
              );
            })}
          </div>

          <div className="upload-progress-row">
            <div className="upload-progress-track">
              {FILE_TYPES.map((type) => (<div key={type.key} className={`upload-progress-dot ${files[type.key] ? 'upload-progress-dot--on' : ''}`} title={type.label} />))}
            </div>
            <span className="upload-progress-label">{Object.values(files).filter(Boolean).length} of 4 files selected</span>
          </div>

          <div className="upload-cta-row">
            <button onClick={handleUploadSubmit} disabled={isUploading || !hasAnyFile} className={`upload-cta-btn ${(!hasAnyFile || isUploading) ? 'upload-cta-btn--disabled' : ''}`}>
              {isUploading ? (<><span className="upload-cta-spinner" />Syncing Data...</>) : (<>Continue to Audit<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>)}
            </button>
            <p className="upload-hint">{hasAnyFile ? "You can upload remaining files after the audit starts." : "Upload at least one file to continue."}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderKPIView = () => (
    <div className="kpi-view-root animate-in">
      <div className="kpi-page-header">
        <div className="kpi-page-header-left">
          <div className="kpi-success-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Validation Complete</div>
          <h1 className="kpi-page-title">Data Validation <span className="kpi-title-accent">Successful</span></h1>
          <p className="kpi-page-subtitle">Your files have been processed. Review the extracted metrics below and choose which audit controls to run.</p>
        </div>
        <button onClick={() => navigate(`${basePath}/new-session`)} className="kpi-change-files-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>Change Files</button>
      </div>

      {uploadKPIs && uploadKPIs.total_transactions !== undefined && (
        <div className="kpi-section">
          <div className="kpi-section-label"><span className="kpi-section-dot kpi-dot-green" />Concur Header Extraction</div>
          <div className="kpi-cards-grid kpi-cards-grid--5">
            {uploadKPIs.unique_employees !== undefined && (
              <div className="kpi-stat-card" style={{ '--kpi-accent': '#00df81' }}>
                <div className="kpi-stat-icon" style={{ background: 'rgba(0,223,129,0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00df81" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
                <div className="kpi-stat-label">Unique Employees</div>
                <div className="kpi-stat-value">{uploadKPIs.unique_employees.toLocaleString()}</div>
                <div className="kpi-stat-bar" style={{ background: 'rgba(0,223,129,0.15)' }}><div className="kpi-stat-bar-fill" style={{ background: '#00df81', width: '70%' }} /></div>
              </div>
            )}
            {uploadKPIs.unique_reports !== undefined && (
              <div className="kpi-stat-card" style={{ '--kpi-accent': '#2196F3' }}>
                <div className="kpi-stat-icon" style={{ background: 'rgba(33,150,243,0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div>
                <div className="kpi-stat-label">Unique Report IDs</div>
                <div className="kpi-stat-value">{uploadKPIs.unique_reports.toLocaleString()}</div>
                <div className="kpi-stat-bar" style={{ background: 'rgba(33,150,243,0.15)' }}><div className="kpi-stat-bar-fill" style={{ background: '#2196F3', width: '60%' }} /></div>
              </div>
            )}
            {uploadKPIs.total_transactions !== undefined && (
              <div className="kpi-stat-card" style={{ '--kpi-accent': '#7DC030' }}>
                <div className="kpi-stat-icon" style={{ background: 'rgba(125,192,48,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#7DC030', fontSize: '18px', fontWeight: '700' }}>#</span></div>
                <div className="kpi-stat-label">Total Transactions</div>
                <div className="kpi-stat-value">{uploadKPIs.total_transactions.toLocaleString()}</div>
                <div className="kpi-stat-bar" style={{ background: 'rgba(125,192,48,0.15)' }}><div className="kpi-stat-bar-fill" style={{ background: '#7DC030', width: '85%' }} /></div>
              </div>
            )}
            {uploadKPIs.average_claim !== undefined && (
              <div className="kpi-stat-card" style={{ '--kpi-accent': '#FF9800' }}>
                <div className="kpi-stat-icon" style={{ background: 'rgba(255,152,0,0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
                <div className="kpi-stat-label">Avg Claim Amount</div>
                <div className="kpi-stat-value kpi-stat-value--sm" title={`₹${uploadKPIs.average_claim.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>₹{uploadKPIs.average_claim.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="kpi-stat-bar" style={{ background: 'rgba(255,152,0,0.15)' }}><div className="kpi-stat-bar-fill" style={{ background: '#FF9800', width: '50%' }} /></div>
              </div>
            )}
            {uploadKPIs.total_amount !== undefined && (
              <div className="kpi-stat-card" style={{ '--kpi-accent': '#05192d' }}>
                <div className="kpi-stat-icon" style={{ background: 'rgba(5,25,45,0.08)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#05192d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg></div>
                <div className="kpi-stat-label">Total Amount Approved</div>
                <div className="kpi-stat-value kpi-stat-value--sm">{uploadKPIs.total_amount >= 10000000 ? `₹${(uploadKPIs.total_amount / 10000000).toFixed(2)} Cr` : uploadKPIs.total_amount >= 100000 ? `₹${(uploadKPIs.total_amount / 100000).toFixed(2)} L` : `₹${uploadKPIs.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</div>
                <div className="kpi-stat-bar" style={{ background: 'rgba(5,25,45,0.08)' }}><div className="kpi-stat-bar-fill" style={{ background: '#05192d', width: '75%' }} /></div>
              </div>
            )}
          </div>
        </div>
      )}

      {uploadKPIs && uploadKPIs.master_unique_employees !== undefined && (
        <div className="kpi-section">
          <div className="kpi-section-label"><span className="kpi-section-dot kpi-dot-purple" />Employee Master Extraction</div>
          <div className="kpi-cards-grid kpi-cards-grid--4">
            <div className="kpi-stat-card" style={{ '--kpi-accent': '#8b5cf6' }}>
              <div className="kpi-stat-icon" style={{ background: 'rgba(139,92,246,0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
              <div className="kpi-stat-label">Master Unique Emps</div>
              <div className="kpi-stat-value">{uploadKPIs.master_unique_employees.toLocaleString()}</div>
              <div className="kpi-stat-bar" style={{ background: 'rgba(139,92,246,0.15)' }}><div className="kpi-stat-bar-fill" style={{ background: '#8b5cf6', width: '100%' }} /></div>
            </div>
            {uploadKPIs.master_active_employees !== undefined && (
              <div className="kpi-stat-card" style={{ '--kpi-accent': '#10b981' }}>
                <div className="kpi-stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div>
                <div className="kpi-stat-label">Active Employees</div>
                <div className="kpi-stat-value">{uploadKPIs.master_active_employees.toLocaleString()}</div>
                <div className="kpi-stat-bar" style={{ background: 'rgba(16,185,129,0.15)' }}><div className="kpi-stat-bar-fill" style={{ background: '#10b981', width: `${Math.round(uploadKPIs.master_active_employees / uploadKPIs.master_unique_employees * 100)}%` }} /></div>
              </div>
            )}
            {uploadKPIs.master_separated_employees !== undefined && (
              <div className="kpi-stat-card" style={{ '--kpi-accent': '#ef4444' }}>
                <div className="kpi-stat-icon" style={{ background: 'rgba(239,68,68,0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" /></svg></div>
                <div className="kpi-stat-label">Separated Employees</div>
                <div className="kpi-stat-value">{uploadKPIs.master_separated_employees.toLocaleString()}</div>
                <div className="kpi-stat-bar" style={{ background: 'rgba(239,68,68,0.15)' }}><div className="kpi-stat-bar-fill" style={{ background: '#ef4444', width: `${Math.round(uploadKPIs.master_separated_employees / uploadKPIs.master_unique_employees * 100)}%` }} /></div>
              </div>
            )}
            {uploadKPIs.master_company_codes !== undefined && (
              <div className="kpi-stat-card" style={{ '--kpi-accent': '#f59e0b' }}>
                <div className="kpi-stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg></div>
                <div className="kpi-stat-label">Company Codes</div>
                <div className="kpi-stat-value">{uploadKPIs.master_company_codes.toLocaleString()}</div>
                <div className="kpi-stat-bar" style={{ background: 'rgba(245,158,11,0.15)' }}><div className="kpi-stat-bar-fill" style={{ background: '#f59e0b', width: '25%' }} /></div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="audit-controls-panel">
        <div className="audit-controls-header">
          <div>
            <h2 className="audit-controls-title">Choose Audit Controls to Run</h2>
            <p className="audit-controls-subtitle"><span className="audit-selected-count">{selectedInsights.length}</span> of {INSIGHT_OPTIONS.length} controls selected</p>
          </div>
          <button onClick={() => { if (selectedInsights.length === INSIGHT_OPTIONS.length) { setSelectedInsights([]); } else { setSelectedInsights(INSIGHT_OPTIONS.map(opt => opt.id)); } }} className={`audit-select-all-btn ${selectedInsights.length === INSIGHT_OPTIONS.length ? 'audit-select-all-btn--deselect' : ''}`}>
            {selectedInsights.length === INSIGHT_OPTIONS.length ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> Deselect All</> : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Select All</>}
          </button>
        </div>

        <div className="audit-controls-grid">
          {INSIGHT_OPTIONS.map((opt, idx) => {
            const isChecked = selectedInsights.includes(opt.id);
            return (
              <label key={opt.id} className={`audit-control-item ${isChecked ? 'audit-control-item--checked' : ''}`} style={{ '--item-delay': `${idx * 0.02}s` }}>
                <div className={`audit-custom-checkbox ${isChecked ? 'audit-custom-checkbox--checked' : ''}`}>{isChecked && (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}</div>
                <input type="checkbox" style={{ display: 'none' }} checked={isChecked} onChange={() => setSelectedInsights(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id])} />
                <div className="audit-control-text"><span className="audit-control-id">{opt.id}</span><span className="audit-control-label">{opt.label.replace(opt.id + ' - ', '')}</span></div>
              </label>
            );
          })}
        </div>

        <div className="audit-controls-footer">
          <label className="audit-notify-label">
            <div className={`audit-custom-checkbox audit-notify-checkbox ${isNotifyEnabled ? 'audit-custom-checkbox--checked' : ''}`}>{isNotifyEnabled && (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}</div>
            <input type="checkbox" style={{ display: 'none' }} checked={isNotifyEnabled} onChange={e => setIsNotifyEnabled(e.target.checked)} />
            <span className="audit-notify-text">Notify me when results are generated</span>
          </label>
          <button onClick={startAnalysis} disabled={selectedInsights.length === 0} className={`audit-start-btn ${selectedInsights.length === 0 ? 'audit-start-btn--disabled' : ''}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>Start Risk Analysis {selectedInsights.length > 0 && <span className="audit-start-count">{selectedInsights.length}</span>}</button>
        </div>
      </div>
    </div>
  );

  const renderProcessingView = () => (
    <div style={{ textAlign: 'center', background: 'white', padding: '60px 40px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', width: '100%', maxWidth: '700px' }}>
      <div className="spinner" style={{ width: '60px', height: '60px', border: '5px solid #f1f5f9', borderTop: '5px solid #00df81', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 30px' }}></div>
      <h2 style={{ color: '#05192d', fontSize: '28px', marginBottom: '10px' }}>{isRestoring ? "Restoring Data..." : "Auditing Data..."}</h2>
      <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '40px' }}>{isRestoring ? "Fetching historical session data from archives." : "Executing control modules. This may take a moment for larger files."}</p>

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
                  {isDone?.status === 'Success' && <span style={{ color: '#1059b9ff', fontSize: '14px' }}>{"✔ Processed"}</span>}
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
    let activeInsight = null;
    if (viewingInsightId) activeInsight = activeAnalysisResults.find(r => r.id === viewingInsightId) || activeAnalysisResults.find(r => r.moduleId === viewingInsightId);

    if (!activeInsight) {
      return (
        <div className="animate-in" style={{ width: '100%', maxWidth: '1200px', textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>📊</div><h2 style={{ color: '#05192d', marginBottom: '10px' }}>No Insight Selected</h2><p style={{ color: '#64748b', marginBottom: '30px' }}>Please select a specific insight to view from your execution report.</p>
          <button onClick={() => navigate(`${basePath}/report`)} style={{ padding: '12px 24px', background: '#00df81', color: '#05192d', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(0,223,129,0.3)' }}>← Go to Execution Report</button>
        </div>
      );
    }

    const isMultiSheet = activeInsight.data && typeof activeInsight.data === 'object' && !Array.isArray(activeInsight.data);
    const sheets = isMultiSheet ? Object.keys(activeInsight.data) : [];
    const currentSheet = activeTabs[activeInsight.id] || (sheets.length > 0 ? sheets[0] : null);

    let displayData = [];
    let currentExceptionName = "";

    if (activeInsight.moduleId === "PJPA32") {
      displayData = activeInsight.data[pjpa32SubView] || [];
      currentExceptionName = pjpa32SubView === 'holiday' ? 'Holiday Travel' : 'Weekend Travel';
    } else if (activeInsight.moduleId === "PJPA24") {
      const sheetName = `${pjpa24Type}_${pjpa24Category}`;
      displayData = activeInsight.data[sheetName] || [];
      currentExceptionName = `${pjpa24Type === 'Mod_Z' ? 'Modified Z-Score' : 'Standard Z-Score'} - ${pjpa24Category}`;
    } else if (activeInsight.moduleId === "PJPA36") {
      const missingList = activeInsight.data?.Missing_Dates_List || [];
      if (missingList.length > 0) {
        displayData = missingList.map(row => {
          const firstVal = Object.values(row)[0];
          const missingDateStr = row['Missing submit date'] || row['Missing Date'] || row['Date'] || firstVal || '';
          let year = '', month = '', dateVal = '', day = '';
          if (missingDateStr) { const d = new Date(missingDateStr); if (!isNaN(d)) { year = d.getFullYear(); month = d.toLocaleString('en-US', { month: 'short' }); dateVal = d.getDate(); day = d.toLocaleString('en-US', { weekday: 'long' }); } }
          return { "Missing submit date": missingDateStr, "Year": year, "Month": month, "Date": dateVal, "Day": day };
        });
      } else { displayData = []; }
      currentExceptionName = "Missing Date Gaps";
    } else if (isMultiSheet) {
      displayData = activeInsight.data[currentSheet] || [];
      currentExceptionName = currentSheet ? currentSheet.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "";
    } else {
      displayData = activeInsight.data || [];
    }

    return (
      <div className="animate-in" style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div><h2 style={{ color: '#05192d', fontSize: '36px', fontWeight: '900', marginBottom: '4px', letterSpacing: '-0.5px' }}>{activeInsight.name.split(" - ")[0]}</h2><p style={{ color: '#64748b', fontSize: '18px', fontWeight: '500' }}>{activeInsight.name.split(" - ")[1] || activeInsight.name}</p></div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {currentViewMode === 'table' && (
              <div style={{ display: 'flex', gap: '10px', marginRight: '10px', paddingRight: '15px', borderRight: '2px solid #e2e8f0' }}>
                <button onClick={() => navigate(`${basePath}/report`)} style={{ padding: '10px 16px', background: '#ffffff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s ease' }} onMouseOver={(e) => { e.target.style.background = '#f8fafc'; e.target.style.color = '#05192d'; }} onMouseOut={(e) => { e.target.style.background = '#ffffff'; e.target.style.color = '#64748b'; }} title="Go back to the Execution Report history">← Execution Report</button>
                <button onClick={() => navigate(`${basePath}/insight-selection`)} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#05192d', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s ease' }} onMouseOver={(e) => e.target.style.background = '#e2e8f0'} onMouseOut={(e) => e.target.style.background = '#f1f5f9'} title="Go back to select new controls">← Control Selection</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}><button onClick={() => setCurrentViewMode("table")} style={getPremiumButtonStyle(currentViewMode === 'table')}>Table View</button><button onClick={() => setCurrentViewMode("dashboard")} style={getPremiumButtonStyle(currentViewMode === 'dashboard')}>Dashboard View</button></div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          {activeInsight.moduleId === "PJPA24" && (
            <><div style={{ display: 'flex', gap: '10px', marginBottom: '15px', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}><button onClick={() => setPjpa24Type('Mod_Z')} style={getPremiumButtonStyle(pjpa24Type === 'Mod_Z')}>Modified Z-Score</button><button onClick={() => setPjpa24Type('Std_Z')} style={getPremiumButtonStyle(pjpa24Type === 'Std_Z')}>Standard Z-Score</button></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}><button onClick={() => setPjpa24Category('Overall')} style={getPremiumButtonStyle(pjpa24Category === 'Overall')}>Overall Context</button><button onClick={() => setPjpa24Category('Emp')} style={getPremiumButtonStyle(pjpa24Category === 'Emp')}>By Employee</button><button onClick={() => setPjpa24Category('Loc')} style={getPremiumButtonStyle(pjpa24Category === 'Loc')}>By Location</button><button onClick={() => setPjpa24Category('RepDate')} style={getPremiumButtonStyle(pjpa24Category === 'RepDate')}>By Report Date</button><button onClick={() => setPjpa24Category('TransDate')} style={getPremiumButtonStyle(pjpa24Category === 'TransDate')}>By Transaction Date</button></div></>
          )}

          {activeInsight.moduleId === "PJPA32" && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}><button onClick={() => setPjpa32SubView('holiday')} style={getPremiumButtonStyle(pjpa32SubView === 'holiday')}>Holiday Travel</button><button onClick={() => setPjpa32SubView('weekend')} style={getPremiumButtonStyle(pjpa32SubView === 'weekend')}>Weekend Travel</button></div>
          )}

          {activeInsight.moduleId !== "PJPA24" && activeInsight.moduleId !== "PJPA32" && activeInsight.moduleId !== "PJPA36" && isMultiSheet && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
              {sheets.map(sheet => {
                const formattedName = sheet.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return (<button key={sheet} onClick={() => setActiveTabs(prev => ({ ...prev, [activeInsight.id]: sheet }))} style={getPremiumButtonStyle(currentSheet === sheet)}>{formattedName}</button>);
              })}
            </div>
          )}

          {currentViewMode === "table" ? (
            <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
              {displayData.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                  <thead><tr style={{ background: '#05192d', color: 'white' }}>{Object.keys(displayData[0]).map(k => <th key={k} style={{ padding: '16px 12px', textAlign: 'left', fontSize: '12px', background: '#05192d', position: 'sticky', top: '0', zIndex: '10', borderBottom: '2px solid #00df81', whiteSpace: 'nowrap' }}>{k}</th>)}</tr></thead>
                  <tbody>{displayData.map((row, i) => (<tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>{Object.values(row).map((v, j) => <td key={j} style={{ padding: '12px', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' }}>{String(v)}</td>)}</tr>))}</tbody>
                </table>
              ) : (<div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>No exceptions identified for the selected insights in the data uploaded.</div>)}
            </div>
          ) : activeInsight.moduleId === "PJPA36" ? (
            <PJPA36Dashboard data={activeInsight.data} insightName={activeInsight.name} />
          ) : (
            <Dashboard data={displayData} onBackToTable={() => setCurrentViewMode("table")} insightName={activeInsight.name} exceptionName={currentExceptionName} />
          )}
        </div>
      </div>
    );
  };

  const renderProfileModal = () => {
    if (!isProfileModalOpen) return null;

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5,25,45,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
        <div className="animate-in" style={{ background: 'white', padding: '30px', borderRadius: '24px', maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' }}>

          {!isEditingProfile && (
            <button onClick={() => { setTempProfile(profileData); setIsEditingProfile(true); }} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: '0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#05192d'; }} onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }} title="Edit Profile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
          )}

          <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 20px' }}>
            {isEditingProfile ? (
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', border: '3px solid #00df81', position: 'relative' }}>
                {tempProfile.avatar ? <img src={tempProfile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
            ) : (
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', border: '3px solid #f1f5f9' }}>
                {profileData.avatar ? <img src={profileData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
              </div>
            )}
          </div>

          {isEditingProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Full Name</label>
                <input type="text" value={tempProfile.fullName} onChange={e => setTempProfile({ ...tempProfile, fullName: e.target.value })} placeholder="John Doe" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Email Address</label>
                <input type="email" value={tempProfile.email} onChange={e => setTempProfile({ ...tempProfile, email: e.target.value })} placeholder="john@example.com" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Phone Number</label>
                <input type="text" value={tempProfile.phone} onChange={e => setTempProfile({ ...tempProfile, phone: e.target.value })} placeholder="+91 9876543210" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Address</label>
                <textarea value={tempProfile.address} onChange={e => setTempProfile({ ...tempProfile, address: e.target.value })} placeholder="City, State" rows="2" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', outline: 'none', resize: 'none' }} />
              </div>
            </div>
          ) : (
            <>
              <h2 style={{ color: '#05192d', marginBottom: '4px', fontSize: '22px' }}>{profileData.fullName || user?.username}</h2>
              {profileData.email && <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 4px 0' }}>{profileData.email}</p>}
              {profileData.phone && <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>{profileData.phone}</p>}

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px', border: '1px solid #edf2f7' }}>
                {profileData.address && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Address</span>
                    <span style={{ color: '#334155', fontSize: '13px', fontWeight: '500' }}>{profileData.address}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Role</span>
                  <span style={{ color: '#05192d', fontSize: '13px', fontWeight: '800', textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Account Status</span>
                  <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '800' }}>Active ✅</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Workspace ID</span>
                  <span style={{ color: '#05192d', fontSize: '13px', fontWeight: '800', fontFamily: 'monospace' }}>USR-{user?.id || '000'}</span>
                </div>
              </div>
            </>
          )}

          {isEditingProfile ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSaveProfile} style={{ flex: 1, padding: '12px', background: '#00df81', color: '#05192d', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>Save Changes</button>
              <button onClick={() => setIsEditingProfile(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setIsProfileModalOpen(false)} style={{ width: '100%', padding: '12px', background: '#f1f5f9', color: '#05192d', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderClearHistoryModal = () => {
    if (!isClearModalOpen) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5,25,45,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '50px', zIndex: 9999, backdropFilter: 'blur(4px)', overflowY: 'auto' }}>
        <div className="animate-in" style={{ background: 'white', padding: '40px', borderRadius: '24px', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'slideDown 0.3s ease-out' }}>
          <style>{`@keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
          <div style={{ marginBottom: '20px' }}><img src={bin} alt="Delete" style={{ width: '60px', height: '60px' }} /></div>
          <h2 style={{ color: '#05192d', marginBottom: '10px' }}>Clear Execution Report</h2>
          <p style={{ color: '#64748b', marginBottom: '30px', lineHeight: '1.5' }}>Would you like to save this session before clearing, or delete everything permanently?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={async () => {
              await handleSaveSession();
              setHistory((prev) => {
                const processingItems = prev.filter(item => ['In Progress', 'Refreshing...', 'Reprocessing'].includes(item.status));
                try { localStorage.setItem("aja_audit_history", JSON.stringify(processingItems.map(({ data, ...rest }) => rest))); } catch (e) { }
                return processingItems;
              });
              setActiveAnalysisResults([]);
              setIsClearModalOpen(false);
            }}
              style={{ padding: '14px', background: '#05192d', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'} onMouseOut={(e) => e.target.style.transform = 'scale(1)'}>
              💾 Save Session & Clear
            </button>
            <button onClick={() => {
              setHistory((prev) => {
                const processingItems = prev.filter(item => ['In Progress', 'Refreshing...', 'Reprocessing'].includes(item.status));
                try { localStorage.setItem("aja_audit_history", JSON.stringify(processingItems.map(({ data, ...rest }) => rest))); } catch (e) { localStorage.removeItem("aja_audit_history"); }
                return processingItems;
              });
              setActiveAnalysisResults([]);
              setIsClearModalOpen(false);
            }}
              style={{ padding: '14px', background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              🔥 Permanently Delete
            </button>
            <button onClick={() => setIsClearModalOpen(false)} style={{ padding: '14px', background: 'none', color: '#64748b', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
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
          <p style={{ color: '#64748b', marginBottom: '30px', lineHeight: '1.5' }}>This will clear your current uploaded files and reset the analysis selection. Your current results will be moved to the "Previous Session" history.</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => { startNewSession(); setIsNewSessionModalOpen(false); }} style={{ flex: 1, padding: '14px', background: '#05192d', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Yes, Start Fresh</button>
            <button onClick={() => setIsNewSessionModalOpen(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

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
                  <td style={{ padding: '20px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatDateTime(item.timestamp)}
                  </td>
                  <td style={{ padding: '20px', fontWeight: 'bold', color: '#05192d' }}>{item.name}</td>
                  <td style={{ padding: '20px' }}>
                    {item.status === 'Success' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: 'fit-content', background: '#e6fcf2', color: '#00df81', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>Success</span>
                        {item.timestamp && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{formatDateTime(item.timestamp).split(' ')[1]}</div>}
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
                          setViewingInsightId(item.id);
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
                              return (<button onClick={() => handleRetryProcessing(item)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#05192d' }}>Retry Processing</button>);
                            } else {
                              return item.missingFiles.map(reqFile => {
                                const isUploadedNow = !!files[reqFile];
                                const fileLabel = FILE_TYPES.find(f => f.key === reqFile)?.label || reqFile;
                                if (isUploadedNow) {
                                  return (<div key={reqFile} style={{ fontSize: '12px', background: '#f0fff4', color: '#166534', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center', fontWeight: 'bold' }}>{"✅ "} {fileLabel} Ready</div>);
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
                            return (<button onClick={() => handleRetryProcessing(item)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#05192d' }}>Retry Processing</button>);
                          }
                        })()}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'center' }}>
                    <AnimatedBinButton onDelete={() => deleteHistoryItem(item.id)} />
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
            <button onClick={() => {
              if (history.length === 0) {
                showToast("Empty session, add insights", "error");
                return;
              }
              setIsClearModalOpen(true);
            }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Clear Report History</button>
          </div>
        </div>

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

        {savedSessions.filter(s => !hiddenSessionIds.includes(s.id)).length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <h3 style={{ color: '#05192d', margin: 0 }}>{"📁"} Saved Session History</h3>
              <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>{savedSessions.filter(s => !hiddenSessionIds.includes(s.id)).length} sessions</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {savedSessions.filter(s => !hiddenSessionIds.includes(s.id)).map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  formatDateTime={formatDateTime}
                  onLoad={() => handleLoadSession(session.id)}
                  onHide={(id) => handleDeleteSession(id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPasswordModal = () => {
    if (!isPasswordModalOpen) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5,25,45,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
        <div className="animate-in" style={{ background: 'white', padding: '40px', borderRadius: '24px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ color: '#05192d', margin: 0, fontSize: '24px' }}>Change Password</h2>
            <button onClick={() => { setIsPasswordModalOpen(false); setPwdStatus({ type: '', msg: '' }); setPwdForm({ old: '', new: '', confirm: '' }); }} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
          </div>

          <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Current Password</label>
              <input type="password" value={pwdForm.old} onChange={(e) => setPwdForm({ ...pwdForm, old: e.target.value })} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>New Password</label>
              <input type="password" value={pwdForm.new} onChange={(e) => setPwdForm({ ...pwdForm, new: e.target.value })} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Confirm New Password</label>
              <input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none' }} />
            </div>

            {pwdStatus.msg && (
              <div style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginTop: '4px', background: pwdStatus.type === 'error' ? '#fef2f2' : '#f0fdf4', color: pwdStatus.type === 'error' ? '#ef4444' : '#10b981', border: `1px solid ${pwdStatus.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
                {pwdStatus.msg}
              </div>
            )}

            <button type="submit" disabled={isChangingPwd} style={{ marginTop: '10px', width: '100%', padding: '14px', background: '#00df81', color: '#05192d', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: isChangingPwd ? 'default' : 'pointer', opacity: isChangingPwd ? 0.7 : 1 }}>
              {isChangingPwd ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="up-page-wrapper">
      {renderNewSessionModal()}
      {renderClearHistoryModal()}
      {renderProfileModal()}
      {renderPasswordModal()}

      {/* ── GLOBAL TOAST NOTIFICATION ── */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 99999, pointerEvents: 'none',
          background: toastMsg.type === 'success' ? '#f0fdf4' : toastMsg.type === 'warn' ? '#fffbeb' : '#fef2f2',
          border: `1.5px solid ${toastMsg.type === 'success' ? '#bbf7d0' : toastMsg.type === 'warn' ? '#fcd34d' : '#fca5a5'}`,
          color: toastMsg.type === 'success' ? '#166534' : toastMsg.type === 'warn' ? '#92400e' : '#b91c1c',
          padding: '12px 24px', borderRadius: '12px',
          fontWeight: '700', fontSize: '14px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'slideDown 0.25s ease-out',
        }}>
          <span>{toastMsg.type === 'success' ? '✅' : toastMsg.type === 'warn' ? '⚠️' : '🚫'}</span>
          {toastMsg.text}
        </div>
      )}

      <nav className="up-nav" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '15px 0', position: 'relative', zIndex: 100 }}>
        <div className="up-inner-nav" style={{ maxWidth: '1400px', margin: '0 auto', width: '90%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={ajalabsblack} alt="AjaLabs" className="nav-logo-aja" style={{ height: '35px' }} />

          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <button onClick={() => setIsNewSessionModalOpen(true)} style={{ background: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#05192d' }}>
              New Session
            </button>
            <button onClick={handleReportToggle} style={{ background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', color: view === 'report' ? '#00df81' : '#64748b' }}>
              {view === 'report' ? 'Close Report' : 'Report'}
            </button>

            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#05192d', transition: '0.2s' }}>
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Profile" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                )}
                {profileData.fullName ? profileData.fullName.split(' ')[0] : user?.username || 'Profile'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>

              {isProfileOpen && (
                <div className="animate-in" style={{ position: 'absolute', top: '100%', right: 0, paddingTop: '8px', width: '220px', zIndex: 100 }}>
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signed in as</div>
                      <div style={{ fontSize: '14px', color: '#05192d', fontWeight: '800' }}>{profileData.fullName || user?.username}</div>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <button onClick={() => { setIsProfileOpen(false); setIsProfileModalOpen(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: '600', fontSize: '13px', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                        <span style={{ fontSize: '16px' }}>👤</span> My Profile
                      </button>
                      <button onClick={() => { setIsProfileOpen(false); setIsPasswordModalOpen(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: '600', fontSize: '13px', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                        <span style={{ fontSize: '16px' }}>🔒</span> Change Password
                      </button>
                      <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                      <button onClick={handleSignOutClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', padding: '10px 12px', background: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold', fontSize: '13px', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}>
                        <span style={{ fontSize: '16px' }}>🚪</span> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
        <p>Copyright @ 2026 | Powered by Ajalabs.ai | <a href="https://www.ajalabs.ai/data-privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: '#00df81' }}>Data Privacy</a></p>
      </footer>
    </div>
  );
};

export default Uploader;