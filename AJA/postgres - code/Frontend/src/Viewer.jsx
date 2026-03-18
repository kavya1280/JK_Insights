import React, { useState, useEffect } from "react";
import "./Viewer.css";
import Dashboard from "./Dashboard";
import PJPA36Dashboard from "./PJPA36Dashboard";
import PJPA32Dashboard from "./PJPA32Dashboard";

const API = "http://localhost:5000";

const INSIGHT_CATALOG = [
  // Employee
  { id: "PJPA10", name: "Junior/Senior Analysis", category: "Employee", icon: "👤", desc: "Compares expense patterns between junior and senior employees." },
  { id: "PJPA27", name: "Notice Period Claims", category: "Employee", icon: "📄", desc: "Expense claims during employee notice period." },
  // Policy
  { id: "PJPA13", name: "Policy Validation", category: "Policy", icon: "📋", desc: "Validates submitted expenses against company travel policy." },
  { id: "PJPA35", name: "Duplicate Report IDs", category: "Policy", icon: "🆔", desc: "Reports with identical IDs indicating data integrity issues." },
  // Fraud
  { id: "PJPA14", name: "Duplicate Claims", category: "Fraud", icon: "🔁", desc: "Detects identical or near-identical expense claims." },
  { id: "PJPA31", name: "Structural Splitting", category: "Fraud", icon: "✂️", desc: "Detects expense splitting to stay under approval limits." },
  // Travel
  { id: "PJPA32", name: "Holiday/Weekend Travel", category: "Travel", icon: "🏖️", desc: "Trips claimed on holidays or weekends." },
  { id: "PJPA36", name: "Missing Days", category: "Travel", icon: "❓", desc: "Travel days missing from expense reports." },
  // Stats
  { id: "PJPA24", name: "Z-Score Anomalies", category: "Stats", icon: "📊", desc: "Statistical outlier detection using Z-score analysis." },
  { id: "PJPA28", name: "Benford's Law", category: "Stats", icon: "🔢", desc: "Applies Benford's Law to detect amount manipulation." },
];

const CATEGORIES = ["All", ...Array.from(new Set(INSIGHT_CATALOG.map(i => i.category)))];
const CATEGORY_COLORS = { Employee: "#8b5cf6", Policy: "#3b82f6", Fraud: "#ef4444", Travel: "#f59e0b", Stats: "#10b981" };

const Viewer = ({ user, logo, ajalabsblack, handleLogout }) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [insightData, setInsightData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");

  // Dashboard/Sub-view states
  const [dataViewMode, setDataViewMode] = useState("table"); // 'table' | 'dashboard'
  const [pjpa32SubView, setPjpa32SubView] = useState('holiday');
  const [pjpa24Type, setPjpa24Type] = useState('Mod_Z');
  const [pjpa24Category, setPjpa24Category] = useState('Overall');
  const [activeTabs, setActiveTabs] = useState({}); // { insightId: activeSheetName }

  useEffect(() => {
    fetch(`${API}/api/sessions`, {
      headers: { "X-Username": user?.username || "viewer" }
    })
      .then(res => res.json())
      .then(data => {
        setSessions(data || []);
        if (data && data.length > 0) {
          setActiveSessionId(data[0].id);
        }
      })
      .catch(console.error);
  }, [user]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const generatedInsightIds = activeSession?.insights || [];

  const filtered = INSIGHT_CATALOG.filter(item => {
    const catMatch = activeCategory === "All" || item.category === activeCategory;
    const searchMatch = !searchQ ||
      item.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQ.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQ.toLowerCase());
    return catMatch && searchMatch;
  });

  const loadInsight = async (insight) => {
    setSelectedInsight(insight);
    setInsightData(null);
    setDataError(null);
    setDataLoading(true);

    if (!generatedInsightIds.includes(insight.id)) {
      setDataError("This insight was not generated in the selected session.");
      setDataLoading(false);
      return;
    }

    // Log activity
    fetch(`${API}/log_activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user?.username, role: user?.role, action: "VIEW_INSIGHT", details: `Viewed ${insight.id} from session ${activeSessionId}` })
    }).catch(() => { });

    try {
      const res = await fetch(`${API}/api/sessions/${activeSessionId}/${insight.id}/data`, {
        headers: { "X-Username": user?.username || "viewer" }
      });
      const data = await res.json();
      if (data.status === "success" || data.data) {
        setInsightData(data.data || data); // handle both array and wrapper return formats safely
      } else {
        setDataError(data.message || "No data available");
      }
    } catch {
      setDataError("Could not connect to server");
    } finally {
      setDataLoading(false);
    }
  };

  const renderTable = (rows) => {
    if (!rows || rows.length === 0) return <div className="vw-no-data">No records in this dataset</div>;
    const cols = Object.keys(rows[0]);
    return (
      <div className="vw-table-scroll">
        <table className="vw-table">
          <thead>
            <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(0, 200).map((row, i) => (
              <tr key={i}>{cols.map(c => <td key={c}>{String(row[c] ?? "—")}</td>)}</tr>
            ))}
          </tbody>
        </table>
        {rows.length > 200 && <div className="vw-table-limit">Showing first 200 of {rows.length} records</div>}
      </div>
    );
  };

  const renderData = () => {
    if (!insightData) return null;

    // Handle PJPA32 Table View
    if (selectedInsight.id === "PJPA32") {
      const rows = insightData[pjpa32SubView] || [];
      return renderTable(rows);
    }

    // Handle PJPA24 Table View
    if (selectedInsight.id === "PJPA24") {
      const sheetName = `${pjpa24Type}_${pjpa24Category}`;
      const rows = insightData[sheetName] || [];
      return renderTable(rows);
    }

    if (Array.isArray(insightData)) return renderTable(insightData);

    // Multiple sheets - show only active one if it exists
    const sheets = Object.keys(insightData);
    const activeSheet = activeTabs[selectedInsight.id] || sheets[0];
    if (insightData[activeSheet]) {
      return (
        <div className="vw-sheet-section">
          <div className="vw-sheet-label">📄 {activeSheet.replace(/_/g, ' ')}</div>
          {renderTable(insightData[activeSheet])}
        </div>
      );
    }

    return Object.entries(insightData).map(([sheet, rows]) => (
      <div key={sheet} className="vw-sheet-section">
        <div className="vw-sheet-label">📄 {sheet}</div>
        {renderTable(rows)}
      </div>
    ));
  };

  // --- HELPER SUB-COMPONENTS FOR DRAWER (Inside Viewer) ---
  const renderSubViewSelectors = () => {
    if (!selectedInsight) return null;
    if (selectedInsight.id === "PJPA32") {
      return (
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
          <button onClick={() => setPjpa32SubView('holiday')} style={getTabStyle(pjpa32SubView === 'holiday')}>Holiday Travel</button>
          <button onClick={() => setPjpa32SubView('weekend')} style={getTabStyle(pjpa32SubView === 'weekend')}>Weekend Travel</button>
        </div>
      );
    }
    if (selectedInsight.id === "PJPA24") {
      return (
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPjpa24Type('Mod_Z')} style={getTabStyle(pjpa24Type === 'Mod_Z')}>Modified Z-Score</button>
            <button onClick={() => setPjpa24Type('Std_Z')} style={getTabStyle(pjpa24Type === 'Std_Z')}>Standard Z-Score</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Overall', 'Emp', 'Loc', 'RepDate', 'TransDate'].map(cat => (
              <button key={cat} onClick={() => setPjpa24Category(cat)} style={getTabStyle(pjpa24Category === cat)}>{cat}</button>
            ))}
          </div>
        </div>
      );
    }
    const isMultiSheet = insightData && typeof insightData === 'object' && !Array.isArray(insightData);
    if (isMultiSheet) {
      const sheets = Object.keys(insightData);
      const activeSheet = activeTabs[selectedInsight.id] || sheets[0];
      return (
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {sheets.map(sheet => (
            <button key={sheet} onClick={() => setActiveTabs(prev => ({ ...prev, [selectedInsight.id]: sheet }))} style={getTabStyle(activeSheet === sheet)}>
              {sheet.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderDashboardContent = () => {
    if (!insightData || !selectedInsight) return null;

    if (selectedInsight.id === "PJPA36") {
      return <PJPA36Dashboard data={insightData} insightName={selectedInsight.name} />;
    }

    let displayData = [];
    let exceptionName = "";

    if (selectedInsight.id === "PJPA32") {
      displayData = insightData[pjpa32SubView] || [];
      exceptionName = pjpa32SubView === 'holiday' ? 'Holiday Travel' : 'Weekend Travel';
      return <PJPA32Dashboard data={displayData} insightName={selectedInsight.name} />;
    } else if (selectedInsight.id === "PJPA24") {
      const sheetName = `${pjpa24Type}_${pjpa24Category}`;
      displayData = insightData[sheetName] || [];
      exceptionName = `${pjpa24Type === 'Mod_Z' ? 'Modified Z' : 'Standard Z'} - ${pjpa24Category}`;
    } else if (typeof insightData === 'object' && !Array.isArray(insightData)) {
      const sheets = Object.keys(insightData);
      const activeSheet = activeTabs[selectedInsight.id] || sheets[0];
      displayData = insightData[activeSheet] || [];
      exceptionName = activeSheet.replace(/_/g, ' ');
    } else {
      displayData = insightData || [];
      exceptionName = selectedInsight.name;
    }

    return <Dashboard data={displayData} insightName={selectedInsight.name} exceptionName={exceptionName} />;
  };

  const getTabStyle = (active) => ({
    padding: '6px 12px',
    borderRadius: '6px',
    border: active ? '1px solid #00df81' : '1px solid #e2e8f0',
    background: active ? '#e8fff4' : '#fff',
    color: active ? '#05192d' : '#64748b',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer'
  });

  return (
    <div className="vw-root">
      {/* ── TOPBAR ── */}
      <nav className="vw-topbar">
        <img src={ajalabsblack} alt="Ajalabs" className="vw-logo-left" />

        <div className="vw-topbar-center">
          <div className="vw-search-wrap">
            <span className="vw-search-icon">🔍</span>
            <input
              className="vw-search-input"
              placeholder="Search insights…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            {searchQ && <button className="vw-search-clear" onClick={() => setSearchQ("")}>✕</button>}
          </div>
        </div>

        <div className="vw-topbar-right">
          <div className="vw-session-select-wrap" style={{ marginRight: '16px' }}>
            <select
              className="vw-session-select"
              value={activeSessionId}
              onChange={e => {
                setActiveSessionId(e.target.value);
                setInsightData(null);
                setSelectedInsight(null);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '13px',
                color: '#1e293b',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {sessions.length === 0 && <option value="">No sessions available</option>}
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.creator ? `[${s.creator}] ` : ""}{s.name || new Date(s.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="vw-view-toggle">
            <button className={`vw-vt-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>⊞</button>
            <button className={`vw-vt-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>☰</button>
          </div>

          <div
            className="vw-profile-wrap"
            onMouseEnter={() => setProfileOpen(true)}
            onMouseLeave={() => setProfileOpen(false)}
          >
            <button className="vw-profile-btn">
              <div className="vw-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
              <span>{user?.username}</span>
              <span className={`vw-chevron ${profileOpen ? "open" : ""}`}>▾</span>
            </button>
            {profileOpen && (
              <div className="vw-dropdown">
                <div className="vw-dropdown-head">
                  <div className="vw-dropdown-name">{user?.username}</div>
                  <div className="vw-dropdown-role">Viewer — Read Only</div>
                </div>
                <div className="vw-dropdown-body">
                  <button className="vw-dropdown-item danger" onClick={handleLogout}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          <img src={logo} alt="JK Cement" className="vw-logo-right" />
        </div>
      </nav>

      {/* ── BODY ── */}
      <div className="vw-body">
        {/* ── SIDEBAR FILTER ── */}
        <aside className="vw-sidebar">
          <div className="vw-sidebar-title">Categories</div>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`vw-cat-btn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
              style={cat !== "All" ? { "--cat-color": CATEGORY_COLORS[cat] } : {}}
            >
              {cat !== "All" && <span className="vw-cat-dot" style={{ background: CATEGORY_COLORS[cat] }} />}
              <span>{cat}</span>
              <span className="vw-cat-count">
                {cat === "All"
                  ? INSIGHT_CATALOG.filter(i => generatedInsightIds.includes(i.id)).length
                  : INSIGHT_CATALOG.filter(i => i.category === cat && generatedInsightIds.includes(i.id)).length}
              </span>
            </button>
          ))}

          <div className="vw-sidebar-divider" />
          <div className="vw-readonly-notice">
            <div className="vw-rn-icon">🔒</div>
            <div className="vw-rn-text">View-only access. You cannot modify or delete data.</div>
          </div>
        </aside>

        {/* ── CATALOG ── */}
        <div className="vw-catalog">
          <div className="vw-catalog-header">
            <div className="vw-catalog-title">
              {activeCategory === "All" ? "All Insights" : activeCategory}
              <span className="vw-catalog-count">{filtered.length}</span>
            </div>
          </div>

          <div className={`vw-catalog-grid ${viewMode}`}>
            {filtered.length === 0 ? (
              <div className="vw-empty">
                <div className="vw-empty-icon">🔍</div>
                <div className="vw-empty-title">No insights found</div>
                <div className="vw-empty-sub">Try adjusting your search or filter</div>
              </div>
            ) : filtered.map(item => {
              const color = CATEGORY_COLORS[item.category] || "#94a3b8";
              const isGenerated = generatedInsightIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`vw-insight-card ${selectedInsight?.id === item.id ? "selected" : ""} ${!isGenerated ? "vw-insight-disabled" : ""}`}
                  style={{
                    "--cc": color,
                    opacity: isGenerated ? 1 : 0.6,
                    cursor: isGenerated ? 'pointer' : 'default'
                  }}
                  onClick={() => isGenerated && loadInsight(item)}
                >
                  <div className="vw-card-top">
                    <div className="vw-card-icon-wrap" style={{ background: color + "18" }}>
                      {item.icon}
                    </div>
                    <div className="vw-card-meta">
                      {isGenerated && (
                        <span className="vw-card-tick" style={{ color: '#10b981', marginRight: '6px', fontSize: '14px' }}>✅</span>
                      )}
                      <span className="vw-card-code">{item.id}</span>
                      <span className="vw-card-cat" style={{ color, background: color + "18" }}>{item.category}</span>
                    </div>
                  </div>
                  <div className="vw-card-name">{item.name}</div>
                  <div className="vw-card-desc">{item.desc}</div>
                  <div className="vw-card-footer">
                    <span className="vw-card-view-btn">View Data →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── DATA DRAWER ── */}
        {selectedInsight && (
          <div className="vw-drawer">
            <div className="vw-drawer-header">
              <div className="vw-drawer-header-left">
                <div className="vw-drawer-code">{selectedInsight.id}</div>
                <div className="vw-drawer-name">{selectedInsight.name}</div>
              </div>
              <div className="vw-drawer-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {!dataLoading && !dataError && insightData && (
                  <div className="vw-data-mode-toggle" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    <button
                      className={`vw-dmt-btn ${dataViewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setDataViewMode('table')}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', background: dataViewMode === 'table' ? '#fff' : 'transparent', boxShadow: dataViewMode === 'table' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                    >Table</button>
                    <button
                      className={`vw-dmt-btn ${dataViewMode === 'dashboard' ? 'active' : ''}`}
                      onClick={() => setDataViewMode('dashboard')}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', background: dataViewMode === 'dashboard' ? '#fff' : 'transparent', boxShadow: dataViewMode === 'dashboard' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                    >Dashboard</button>
                  </div>
                )}
                <button className="vw-drawer-close" onClick={() => setSelectedInsight(null)}>✕</button>
              </div>
            </div>

            <div className="vw-drawer-body">
              {dataLoading ? (
                <div className="vw-drawer-loading">
                  <div className="vw-spinner" />
                  <span>Fetching data…</span>
                </div>
              ) : dataError ? (
                <div className="vw-drawer-error">
                  <div className="vw-error-icon">⚠️</div>
                  <div className="vw-error-title">Data Unavailable</div>
                  <div className="vw-error-sub">{dataError}</div>
                  <div className="vw-error-hint">This insight may not have been run yet for this session.</div>
                </div>
              ) : dataViewMode === 'dashboard' ? (
                <div className="vw-dashboard-container" style={{ padding: '20px' }}>
                  {renderDashboardContent()}
                </div>
              ) : (
                <div className="vw-table-container">
                  {renderSubViewSelectors()}
                  {renderData()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Viewer;