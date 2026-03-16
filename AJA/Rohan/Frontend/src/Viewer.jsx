import React, { useState, useEffect } from "react";
import "./Viewer.css";

const API = "http://localhost:5000";

const INSIGHT_CATALOG = [
  { id: "PJPA10", name: "Junior/Senior Analysis", category: "Employee", icon: "👤", desc: "Compares expense patterns between junior and senior employees." },
  { id: "PJPA13", name: "Policy Validation", category: "Policy", icon: "📋", desc: "Validates submitted expenses against company travel policy." },
  { id: "PJPA14", name: "Duplicate Claims", category: "Fraud", icon: "🔁", desc: "Detects identical or near-identical expense claims." },
  { id: "PJPA16", name: "Duplicate Employee", category: "Employee", icon: "👥", desc: "Identifies duplicate entries in the employee master." },
  { id: "PJPA18", name: "Multiple Submits", category: "Fraud", icon: "📤", desc: "Flags employees who submit the same report multiple times." },
  { id: "PJPA19", name: "Multiple Travel Modes", category: "Travel", icon: "✈️", desc: "Detects trips using conflicting transportation modes." },
  { id: "PJPA20", name: "Odd Time Submission", category: "Fraud", icon: "🕐", desc: "Flags expense reports submitted at unusual hours." },
  { id: "PJPA21", name: "Overlapping Travel Dates", category: "Travel", icon: "📅", desc: "Identifies employees with overlapping travel schedules." },
  { id: "PJPA22", name: "Cross-Employee Duplicate", category: "Fraud", icon: "⚡", desc: "Detects duplicated claims submitted by different employees." },
  { id: "PJPA23", name: "Submit Before Start", category: "Policy", icon: "⏩", desc: "Flags claims submitted before the travel start date." },
  { id: "PJPA24", name: "Z-Score Anomalies", category: "Stats", icon: "📊", desc: "Statistical outlier detection using Z-score analysis." },
  { id: "PJPA27", name: "Notice Period Claims", category: "Employee", icon: "📄", desc: "Expense claims during employee notice period." },
  { id: "PJPA28", name: "Benford's Law", category: "Stats", icon: "🔢", desc: "Applies Benford's Law to detect amount manipulation." },
  { id: "PJPA29", name: "New Joiner Claims", category: "Employee", icon: "🆕", desc: "Anomalous claims from recently joined employees." },
  { id: "PJPA30", name: "Short Trip Abuse", category: "Travel", icon: "🏃", desc: "Short trips with disproportionately high expenses." },
  { id: "PJPA31", name: "Structural Splitting", category: "Fraud", icon: "✂️", desc: "Detects expense splitting to stay under approval limits." },
  { id: "PJPA32", name: "Holiday/Weekend Travel", category: "Travel", icon: "🏖️", desc: "Trips claimed on holidays or weekends." },
  { id: "PJPA33", name: "Bulk Booker", category: "Travel", icon: "📦", desc: "Employees booking travel in unusually large batches." },
  { id: "PJPA34", name: "Low Value Claims", category: "Fraud", icon: "💰", desc: "High-frequency low-value claims to avoid detection." },
  { id: "PJPA35", name: "Duplicate Report IDs", category: "Policy", icon: "🆔", desc: "Reports with identical IDs indicating data integrity issues." },
  { id: "PJPA36", name: "Missing Days", category: "Travel", icon: "❓", desc: "Travel days missing from expense reports." },
  { id: "PJPA38", name: "Odd Travels", category: "Travel", icon: "🌍", desc: "Unusual travel destinations flagged by rarity analysis." },
  { id: "PJPA39", name: "Active with Sep Date", category: "Employee", icon: "⚠️", desc: "Active employees with a recorded separation date." },
  { id: "PJPA40", name: "Transaction Date Anomaly", category: "Policy", icon: "🗓️", desc: "Expenses with transaction dates outside the travel window." },
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

    // Log activity
    fetch(`${API}/log_activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user?.username, role: user?.role, action: "VIEW_INSIGHT", details: `Viewed ${insight.id}` })
    }).catch(() => { });

    try {
      const res = await fetch(`${API}/get_insight_data/${insight.id}`, {
        headers: { "X-Username": user?.username || "viewer" }
      });
      const data = await res.json();
      if (data.status === "success") {
        setInsightData(data.data);
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
    if (Array.isArray(insightData)) return renderTable(insightData);
    // Multiple sheets
    return Object.entries(insightData).map(([sheet, rows]) => (
      <div key={sheet} className="vw-sheet-section">
        <div className="vw-sheet-label">📄 {sheet}</div>
        {renderTable(rows)}
      </div>
    ));
  };

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
                {cat === "All" ? INSIGHT_CATALOG.length : INSIGHT_CATALOG.filter(i => i.category === cat).length}
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
              return (
                <div
                  key={item.id}
                  className={`vw-insight-card ${selectedInsight?.id === item.id ? "selected" : ""}`}
                  style={{ "--cc": color }}
                  onClick={() => loadInsight(item)}
                >
                  <div className="vw-card-top">
                    <div className="vw-card-icon-wrap" style={{ background: color + "18" }}>{item.icon}</div>
                    <div className="vw-card-meta">
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
              <div>
                <div className="vw-drawer-code">{selectedInsight.id}</div>
                <div className="vw-drawer-name">{selectedInsight.name}</div>
              </div>
              <button className="vw-drawer-close" onClick={() => setSelectedInsight(null)}>✕</button>
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
                  <div className="vw-error-hint">This insight may not have been run yet for your workspace.</div>
                </div>
              ) : (
                renderData()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Viewer;