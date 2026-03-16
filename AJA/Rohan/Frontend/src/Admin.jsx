import React, { useState, useEffect, useCallback } from "react";
import "./admin.css";

const API = "http://localhost:5000";

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const fmtTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const ACTION_META = {
  LOGIN: { icon: "🔑", color: "#00df81", label: "Login" },
  LOGOUT: { icon: "🚪", color: "#94a3b8", label: "Logout" },
  RUN_INSIGHTS: { icon: "⚙️", color: "#3b82f6", label: "Insights Run" },
  SAVE_SESSION: { icon: "💾", color: "#8b5cf6", label: "Session Saved" },
  VIEW_INSIGHT: { icon: "👁️", color: "#f59e0b", label: "Insight Viewed" },
  USER_CREATED: { icon: "➕", color: "#00df81", label: "User Created" },
  USER_UPDATED: { icon: "✏️", color: "#3b82f6", label: "User Updated" },
  USER_DELETED: { icon: "🗑️", color: "#ef4444", label: "User Deleted" },
};

const ROLE_COLORS = { admin: "#00df81", uploader: "#3b82f6", reviewer: "#f59e0b", viewer: "#8b5cf6" };

// ── component ──────────────────────────────────────────────────────────────
const Admin = ({ user, logo, ajalabsblack, handleLogout }) => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeRoleFilter, setActiveRoleFilter] = useState("all");
  const [sideOpen, setSideOpen] = useState({ users: false, monitor: false });

  // Users state
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState({ id: "", username: "", password: "", role: "viewer", status: "Active" });
  const [searchQuery, setSearchQuery] = useState("");

  // Monitoring state
  const [activityLog, setActivityLog] = useState([]);
  const [sessionsSummary, setSessionsSummary] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // ── fetch helpers ──────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(`${API}/get_users`);
      setUsersList(await res.json());
    } catch (e) { console.error(e); }
    finally { setUsersLoading(false); }
  }, []);

  const fetchMonitorData = useCallback(async () => {
    setMonitorLoading(true);
    try {
      const [logRes, sessRes, reportRes] = await Promise.all([
        fetch(`${API}/admin/activity_log?date=${selectedDate}`),
        fetch(`${API}/admin/sessions_summary`),
        fetch(`${API}/admin/daily_report`),
      ]);
      setActivityLog(await logRes.json());
      setSessionsSummary(await sessRes.json());
      setDailyReport(await reportRes.json());
    } catch (e) { console.error(e); }
    finally { setMonitorLoading(false); }
  }, [selectedDate]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    if (activeSection === "activity" || activeSection === "sessions" || activeSection === "daily") {
      fetchMonitorData();
    }
  }, [activeSection, fetchMonitorData]);

  // ── user CRUD ──────────────────────────────────────────────────────────
  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/delete_user/${userId}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
      else { const d = await res.json(); alert(d.message); }
    } catch { alert("Delete failed"); }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const isEditing = !!currentUser.id;
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `${API}/update_user/${currentUser.id}` : `${API}/add_user`;
    const { id, ...payload } = currentUser;
    try {
      const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setShowModal(false); fetchUsers(); setCurrentUser({ id: "", username: "", password: "", role: "viewer", status: "Active" }); }
      else { const d = await res.json(); alert(d.message); }
    } catch { alert("Backend unreachable"); }
  };

  const openEditModal = (u) => { setCurrentUser({ ...u, password: "" }); setShowModal(true); };
  const openAddModal = () => { setCurrentUser({ id: "", username: "", password: "", role: "viewer", status: "Active" }); setShowModal(true); };

  // ── derived data ───────────────────────────────────────────────────────
  const filteredUsers = usersList.filter(u => {
    const roleMatch = activeRoleFilter === "all" || u.role === activeRoleFilter;
    const searchMatch = !searchQuery || u.username.toLowerCase().includes(searchQuery.toLowerCase());
    return roleMatch && searchMatch;
  });

  const stats = {
    total: usersList.length,
    uploaders: usersList.filter(u => u.role === "uploader").length,
    reviewers: usersList.filter(u => u.role === "reviewer").length,
    viewers: usersList.filter(u => u.role === "viewer").length,
    active: usersList.filter(u => u.status === "Active").length,
  };

  const activeSessions = sessionsSummary.filter(s => !s.logout_time).length;

  // ── sidebar toggle ─────────────────────────────────────────────────────
  const toggleSide = (key) => setSideOpen(p => ({ ...p, [key]: !p[key] }));

  // ── render ─────────────────────────────────────────────────────────────
  const navItem = (key, icon, label) => (
    <div
      key={key}
      className={`adm-nav-item ${activeSection === key ? "active" : ""}`}
      onClick={() => setActiveSection(key)}
    >
      <span className="adm-nav-icon">{icon}</span>
      <span>{label}</span>
    </div>
  );

  const renderDashboard = () => (
    <div className="adm-section-wrapper">
      <div className="adm-page-title-row">
        <div>
          <h2 className="adm-page-title">Overview</h2>
          <p className="adm-page-subtitle">Platform health at a glance</p>
        </div>
        <div className="adm-live-badge"><span className="adm-pulse" />Live</div>
      </div>

      <div className="adm-stats-grid">
        {[
          { label: "Total Users", value: stats.total, icon: "👥", accent: "#00df81" },
          { label: "Active Now", value: activeSessions, icon: "🟢", accent: "#3b82f6" },
          { label: "Uploaders", value: stats.uploaders, icon: "⬆️", accent: "#f59e0b" },
          { label: "Reviewers", value: stats.reviewers, icon: "🔍", accent: "#8b5cf6" },
          { label: "Viewers", value: stats.viewers, icon: "👁️", accent: "#ec4899" },
          { label: "Active Accounts", value: stats.active, icon: "✅", accent: "#00df81" },
        ].map((s) => (
          <div className="adm-stat-card" key={s.label} style={{ "--accent": s.accent }}>
            <div className="adm-stat-icon">{s.icon}</div>
            <div className="adm-stat-val">{s.value}</div>
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-bar" />
          </div>
        ))}
      </div>

      <div className="adm-quick-grid">
        <div className="adm-quick-card" onClick={() => setActiveSection("users")}>
          <div className="adm-quick-icon">👤</div>
          <div className="adm-quick-text">
            <div className="adm-quick-title">Manage Users</div>
            <div className="adm-quick-sub">Add, edit, remove accounts</div>
          </div>
          <div className="adm-quick-arrow">→</div>
        </div>
        <div className="adm-quick-card" onClick={() => setActiveSection("activity")}>
          <div className="adm-quick-icon">📋</div>
          <div className="adm-quick-text">
            <div className="adm-quick-title">Activity Log</div>
            <div className="adm-quick-sub">Track every user action</div>
          </div>
          <div className="adm-quick-arrow">→</div>
        </div>
        <div className="adm-quick-card" onClick={() => setActiveSection("daily")}>
          <div className="adm-quick-icon">📊</div>
          <div className="adm-quick-text">
            <div className="adm-quick-title">Daily Report</div>
            <div className="adm-quick-sub">End-of-day summary</div>
          </div>
          <div className="adm-quick-arrow">→</div>
        </div>
        <div className="adm-quick-card" onClick={() => setActiveSection("sessions")}>
          <div className="adm-quick-icon">🔐</div>
          <div className="adm-quick-text">
            <div className="adm-quick-title">Sessions</div>
            <div className="adm-quick-sub">Login / logout history</div>
          </div>
          <div className="adm-quick-arrow">→</div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="adm-section-wrapper">
      <div className="adm-page-title-row">
        <div>
          <h2 className="adm-page-title">User Management</h2>
          <p className="adm-page-subtitle">
            {filteredUsers.length} {activeRoleFilter === "all" ? "total" : activeRoleFilter} user{filteredUsers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="adm-add-btn" onClick={openAddModal}>
          <span>+</span> Add User
        </button>
      </div>

      <div className="adm-filter-row">
        <div className="adm-filter-tabs">
          {["all", "uploader", "reviewer", "viewer"].map(r => (
            <button key={r} className={`adm-tab ${activeRoleFilter === r ? "active" : ""}`} onClick={() => setActiveRoleFilter(r)}>
              {r === "all" ? "All Users" : r.charAt(0).toUpperCase() + r.slice(1) + "s"}
            </button>
          ))}
        </div>
        <div className="adm-search-wrap">
          <span className="adm-search-icon">🔍</span>
          <input
            className="adm-search-input"
            type="text"
            placeholder="Search users…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {usersLoading ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Loading users…</span></div>
      ) : (
        <div className="adm-table-card">
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="4" className="adm-empty-cell">No users found</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="adm-table-row">
                  <td>
                    <div className="adm-user-cell">
                      <div className="adm-avatar" style={{ background: ROLE_COLORS[u.role] + "22", color: ROLE_COLORS[u.role] }}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="adm-username">{u.username}</div>
                        <div className="adm-user-id">ID #{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="adm-role-chip" style={{ background: ROLE_COLORS[u.role] + "18", color: ROLE_COLORS[u.role], borderColor: ROLE_COLORS[u.role] + "44" }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`adm-status-dot ${(u.status || "active").toLowerCase()}`}>
                      <span className="dot" />{u.status || "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="adm-action-btns">
                      <button className="adm-edit-btn" onClick={() => openEditModal(u)} title="Edit">✏️</button>
                      <button className="adm-del-btn" onClick={() => handleDelete(u.id)} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderActivity = () => (
    <div className="adm-section-wrapper">
      <div className="adm-page-title-row">
        <div>
          <h2 className="adm-page-title">Activity Log</h2>
          <p className="adm-page-subtitle">Every action, timestamped</p>
        </div>
        <div className="adm-date-filter">
          <span>📅</span>
          <input
            type="date"
            className="adm-date-input"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <button className="adm-refresh-btn" onClick={fetchMonitorData}>↻ Refresh</button>
        </div>
      </div>

      {monitorLoading ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Loading activity…</span></div>
      ) : activityLog.length === 0 ? (
        <div className="adm-empty-state">
          <div className="adm-empty-icon">📋</div>
          <div className="adm-empty-title">No activity for this date</div>
          <div className="adm-empty-sub">Try selecting a different date</div>
        </div>
      ) : (
        <div className="adm-timeline">
          {activityLog.map((entry, i) => {
            const meta = ACTION_META[entry.action] || { icon: "•", color: "#94a3b8", label: entry.action };
            return (
              <div className="adm-tl-item" key={i}>
                <div className="adm-tl-dot" style={{ background: meta.color + "22", border: `2px solid ${meta.color}` }}>
                  {meta.icon}
                </div>
                <div className="adm-tl-line" />
                <div className="adm-tl-content">
                  <div className="adm-tl-top">
                    <span className="adm-tl-action" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="adm-tl-user">
                      <span className="adm-tl-avatar" style={{ background: ROLE_COLORS[entry.role] + "22", color: ROLE_COLORS[entry.role] }}>
                        {entry.username.charAt(0).toUpperCase()}
                      </span>
                      {entry.username}
                    </span>
                    <span className="adm-role-chip sm" style={{ background: ROLE_COLORS[entry.role] + "18", color: ROLE_COLORS[entry.role], borderColor: ROLE_COLORS[entry.role] + "44" }}>
                      {entry.role}
                    </span>
                    <span className="adm-tl-time">{fmtTime(entry.timestamp)}</span>
                  </div>
                  {entry.details && <div className="adm-tl-details">{entry.details}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSessions = () => (
    <div className="adm-section-wrapper">
      <div className="adm-page-title-row">
        <div>
          <h2 className="adm-page-title">Session Monitor</h2>
          <p className="adm-page-subtitle">Login & logout history for all users</p>
        </div>
        <button className="adm-refresh-btn" onClick={fetchMonitorData}>↻ Refresh</button>
      </div>

      {monitorLoading ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Loading sessions…</span></div>
      ) : (
        <div className="adm-table-card">
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Login Time</th>
                <th>Logout Time</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessionsSummary.length === 0 ? (
                <tr><td colSpan="6" className="adm-empty-cell">No sessions recorded</td></tr>
              ) : sessionsSummary.slice(0, 100).map((s, i) => (
                <tr key={i} className="adm-table-row">
                  <td>
                    <div className="adm-user-cell">
                      <div className="adm-avatar" style={{ background: ROLE_COLORS[s.role] + "22", color: ROLE_COLORS[s.role] }}>
                        {s.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="adm-username">{s.username}</span>
                    </div>
                  </td>
                  <td>
                    <span className="adm-role-chip" style={{ background: ROLE_COLORS[s.role] + "18", color: ROLE_COLORS[s.role], borderColor: ROLE_COLORS[s.role] + "44" }}>
                      {s.role}
                    </span>
                  </td>
                  <td className="adm-mono">{fmt(s.login_time)}</td>
                  <td className="adm-mono">{fmt(s.logout_time)}</td>
                  <td>{s.logout_reason || (s.logout_time ? "—" : "Active")}</td>
                  <td>
                    {!s.logout_time ? (
                      <span className="adm-status-dot active"><span className="dot" />Online</span>
                    ) : s.expired ? (
                      <span className="adm-status-dot inactive"><span className="dot" />Expired</span>
                    ) : (
                      <span className="adm-status-dot inactive"><span className="dot" />Logged out</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDailyReport = () => (
    <div className="adm-section-wrapper">
      <div className="adm-page-title-row">
        <div>
          <h2 className="adm-page-title">Daily Report</h2>
          <p className="adm-page-subtitle">Summary for {dailyReport?.date || "today"}</p>
        </div>
        <button className="adm-refresh-btn" onClick={fetchMonitorData}>↻ Refresh</button>
      </div>

      {monitorLoading || !dailyReport ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Generating report…</span></div>
      ) : (
        <>
          <div className="adm-stats-grid four">
            {[
              { label: "Total Logins Today", value: dailyReport.total_logins, icon: "🔑", accent: "#00df81" },
              { label: "Active Sessions", value: dailyReport.active_sessions, icon: "🟢", accent: "#3b82f6" },
              { label: "Total Events", value: dailyReport.total_events, icon: "📋", accent: "#f59e0b" },
              { label: "Users Active", value: dailyReport.user_summaries?.length || 0, icon: "👥", accent: "#8b5cf6" },
            ].map(s => (
              <div className="adm-stat-card" key={s.label} style={{ "--accent": s.accent }}>
                <div className="adm-stat-icon">{s.icon}</div>
                <div className="adm-stat-val">{s.value}</div>
                <div className="adm-stat-label">{s.label}</div>
                <div className="adm-stat-bar" />
              </div>
            ))}
          </div>

          {dailyReport.user_summaries?.length > 0 && (
            <div className="adm-report-section">
              <h3 className="adm-report-subtitle">Per-User Breakdown</h3>
              <div className="adm-user-report-grid">
                {dailyReport.user_summaries.map((us, i) => (
                  <div className="adm-user-report-card" key={i}>
                    <div className="adm-ur-header">
                      <div className="adm-avatar lg" style={{ background: ROLE_COLORS[us.role] + "22", color: ROLE_COLORS[us.role] }}>
                        {us.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="adm-username">{us.username}</div>
                        <span className="adm-role-chip sm" style={{ background: ROLE_COLORS[us.role] + "18", color: ROLE_COLORS[us.role], borderColor: ROLE_COLORS[us.role] + "44" }}>
                          {us.role}
                        </span>
                      </div>
                      <div className="adm-ur-count">{us.actions.length} actions</div>
                    </div>
                    <div className="adm-ur-actions">
                      {us.actions.slice(0, 8).map((a, j) => {
                        const meta = ACTION_META[a.action] || { icon: "•", color: "#94a3b8" };
                        return (
                          <div className="adm-ur-action-row" key={j}>
                            <span>{meta.icon}</span>
                            <span className="adm-ur-action-name" style={{ color: meta.color }}>{a.action}</span>
                            <span className="adm-ur-action-time">{fmtTime(a.time)}</span>
                          </div>
                        );
                      })}
                      {us.actions.length > 8 && (
                        <div className="adm-ur-more">+{us.actions.length - 8} more actions</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dailyReport.user_summaries?.length === 0 && (
            <div className="adm-empty-state">
              <div className="adm-empty-icon">📊</div>
              <div className="adm-empty-title">No activity today yet</div>
              <div className="adm-empty-sub">Check back once users start their sessions</div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const sectionMap = {
    dashboard: renderDashboard,
    users: renderUsers,
    activity: renderActivity,
    sessions: renderSessions,
    daily: renderDailyReport,
  };

  return (
    <div className="adm-root">
      {/* ── SIDEBAR ── */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <img src={ajalabsblack} alt="Ajalabs" className="adm-sidebar-logo" />
          <div className="adm-sidebar-badge">Admin</div>
        </div>

        <div className="adm-sidebar-user">
          <div className="adm-avatar lg" style={{ background: "#00df8122", color: "#00df81" }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="adm-username">{user?.username}</div>
            <div className="adm-user-id">Super Administrator</div>
          </div>
        </div>

        <nav className="adm-sidebar-nav">
          <div className="adm-nav-group-label">Overview</div>
          {navItem("dashboard", "🏠", "Dashboard")}

          <div className="adm-nav-group-label">Users</div>
          <div className={`adm-nav-item ${["users"].includes(activeSection) ? "active" : ""}`} onClick={() => toggleSide("users")}>
            <span className="adm-nav-icon">👥</span>
            <span>Manage Users</span>
            <span className={`adm-chevron ${sideOpen.users ? "open" : ""}`}>▾</span>
          </div>
          {sideOpen.users && (
            <div className="adm-sub-nav">
              {navItem("users", "◦", "All Users")}
            </div>
          )}

          <div className="adm-nav-group-label">Monitoring</div>
          <div className={`adm-nav-item`} onClick={() => toggleSide("monitor")}>
            <span className="adm-nav-icon">📡</span>
            <span>Monitor</span>
            <span className={`adm-chevron ${sideOpen.monitor ? "open" : ""}`}>▾</span>
          </div>
          {sideOpen.monitor && (
            <div className="adm-sub-nav">
              {navItem("activity", "◦", "Activity Log")}
              {navItem("sessions", "◦", "Sessions")}
              {navItem("daily", "◦", "Daily Report")}
            </div>
          )}
        </nav>

        <div className="adm-sidebar-foot">
          <button className="adm-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="adm-main">
        <header className="adm-topbar">
          <div className="adm-topbar-title">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </div>
          <img src={logo} alt="JK Cement" className="adm-topbar-logo" />
        </header>

        <div className="adm-content">
          {(sectionMap[activeSection] || renderDashboard)()}
        </div>
      </main>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>{currentUser.id ? "Edit User" : "Add New User"}</h3>
              <button className="adm-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveUser} className="adm-modal-form">
              <div className="adm-form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={currentUser.username || ""}
                  onChange={e => setCurrentUser({ ...currentUser, username: e.target.value })}
                  required
                  placeholder="Enter username"
                />
              </div>
              {!currentUser.id && (
                <div className="adm-form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={currentUser.password || ""}
                    onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
                    required
                    placeholder="Set password"
                  />
                </div>
              )}
              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label>Role</label>
                  <select value={currentUser.role} onChange={e => setCurrentUser({ ...currentUser, role: e.target.value })}>
                    <option value="uploader">Uploader</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="adm-form-group">
                  <label>Status</label>
                  <select value={currentUser.status || "Active"} onChange={e => setCurrentUser({ ...currentUser, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="adm-modal-actions">
                <button type="button" className="adm-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="adm-save-btn">{currentUser.id ? "Save Changes" : "Create User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;