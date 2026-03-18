import React, { useState, useEffect, useCallback, useRef } from "react";
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

const ROLE_COLORS = {
  admin: "#00df81",
  uploader: "#3b82f6",
  viewer: "#8b5cf6",
};

// Mock country data derived from IP/timezone (in real app, comes from backend)
const COUNTRY_COLORS = {
  "India": "#f59e0b",
  "United States": "#3b82f6",
  "United Kingdom": "#8b5cf6",
  "Germany": "#00df81",
  "Australia": "#ef4444",
  "Others": "#94a3b8",
};

// ── Landing Page ──────────────────────────────────────────────────────────
const LandingPage = ({ onEnter, logo, ajalabsblack }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // 3 columns of tiles — user will replace icons with their own images
  // Each column has enough tiles to scroll seamlessly (duplicated for infinite loop)
  const col1 = [
    { icon: "☁️", label: "Cloud Storage", accent: false },
    { icon: "🔒", label: "Secure Access", accent: true },
    { icon: "📊", label: "Analytics", accent: false },
    { icon: "🌐", label: "Global CDN", accent: true },
    { icon: "⚡", label: "Real-time", accent: false },
    { icon: "🛡️", label: "Protection", accent: false },
  ];
  const col2 = [
    { icon: "🔄", label: "Sync", accent: true },
    { icon: "📡", label: "Monitoring", accent: false },
    { icon: "🗄️", label: "Database", accent: false },
    { icon: "🔗", label: "API Connect", accent: true },
    { icon: "📈", label: "Performance", accent: false },
    { icon: "🤖", label: "Automation", accent: true },
  ];
  const col3 = [
    { icon: "💡", label: "Intelligence", accent: false },
    { icon: "🧩", label: "Integration", accent: true },
    { icon: "🔍", label: "Search", accent: false },
    { icon: "📬", label: "Notifications", accent: false },
    { icon: "📋", label: "Reports", accent: true },
    { icon: "👥", label: "Users", accent: false },
  ];

  const ScrollColumn = ({ items, direction, speed }) => {
    // Duplicate items for seamless infinite scroll
    const doubled = [...items, ...items];
    return (
      <div className="lp-scroll-col-outer">
        <div
          className={`lp-scroll-col-inner ${direction === "up" ? "scroll-up" : "scroll-down"}`}
          style={{ "--col-speed": `${speed}s` }}
        >
          {doubled.map((t, i) => (
            <div
              key={i}
              className={`lp-scroll-tile ${t.accent ? "lp-scroll-tile-accent" : ""}`}
            >
              <span className="lp-scroll-tile-ico">{t.icon}</span>
              <span className="lp-scroll-tile-lbl">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`landing-root ${visible ? "visible" : ""}`}>

      {/* AJA Labs logo — fixed top-right corner */}
      {/* {ajalabsblack && (
        <div className="lp-aja-topright">
          <img src={ajalabsblack} alt="AJA Labs" className="lp-aja-logo-tr" />
        </div>
      )} */}

      {/* ── HERO — full viewport, no scroll ── */}
      <section className="landing-hero">

        {/* LEFT: JKC logo + content */}
        <div className="landing-hero-left">
          <div className="landing-logos-row">
            {logo && <img src={logo} alt="JKC" className="landing-logo-jkc" />}
          </div>
          <div className="landing-badge lp-fadein" style={{ animationDelay: "0.2s" }}>
            <span className="landing-pulse" />
            Enterprise Admin Platform
          </div>
          <h1 className="landing-headline lp-fadein" style={{ animationDelay: "0.35s" }}>
            <span className="lp-h1-dark">Operational</span>
            <span className="lp-h1-blue">Oversight</span>
            <span className="lp-h1-dark">at Scale</span>
          </h1>
          <p className="landing-sub lp-fadein" style={{ animationDelay: "0.5s" }}>
            A unified command centre for managing users, monitoring real-time sessions,
            tracking performance across geographies, and generating daily insights.
          </p>
          <button className="landing-cta lp-fadein" style={{ animationDelay: "0.65s" }} onClick={onEnter}>
            Enter Dashboard
            <span className="landing-cta-arrow">→</span>
          </button>
        </div>

        {/* RIGHT: 3 infinite-scroll columns in opposite directions */}
        <div className="landing-hero-right">
          <div className="lp-columns-wrap">
            <ScrollColumn items={col1} direction="up" speed={18} />
            <ScrollColumn items={col2} direction="down" speed={22} />
            <ScrollColumn items={col3} direction="up" speed={16} />
          </div>
        </div>

      </section>
    </div>
  );
};

// ── MINI CHARTS ────────────────────────────────────────────────────────────
const SparkLine = ({ data = [], color = "#00df81", height = 40 }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={`url(#spark-${color.replace("#", "")})`}
        stroke="none"
        opacity="0.2"
      />
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const AreaChart = ({ data = [], color = "#3b82f6", labels = [], height = 180 }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 10);
  const paddingLeft = 40, paddingBottom = 30, paddingTop = 20;
  const w = 450, h = height;
  const svgW = w + paddingLeft + 20;
  const svgH = h + paddingBottom + paddingTop;

  // Y-axis ticks
  const ticks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  const points = data.map((v, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * (w - 20);
    const y = h - (v / max) * h + paddingTop;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `${paddingLeft},${h + paddingTop} ${points} ${paddingLeft + (w - 20)},${h + paddingTop}`;

  return (
    <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity="0.3" />
          <stop offset="95%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines & Y-axis labels */}
      {ticks.map((t, idx) => {
        const yPos = h - (t / max) * h + paddingTop;
        return (
          <g key={idx}>
            <line x1={paddingLeft} y1={yPos} x2={svgW - 20} y2={yPos} stroke="#f1f5f9" strokeWidth="1" />
            <text x={paddingLeft - 10} y={yPos + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#94a3b8">{t}</text>
          </g>
        );
      })}

      {/* Axis Lines */}
      <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={h + paddingTop} stroke="#e2e8f0" strokeWidth="1" />
      <line x1={paddingLeft} y1={h + paddingTop} x2={svgW - 20} y2={h + paddingTop} stroke="#e2e8f0" strokeWidth="1" />

      {/* Area fill */}
      <polyline points={areaPoints} fill="url(#areaGradient)" stroke="none" />

      {/* Line path */}
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {data.map((v, i) => {
        const x = paddingLeft + (i / (data.length - 1)) * (w - 20);
        const y = h - (v / max) * h + paddingTop;
        return (
          <circle key={i} cx={x} cy={y} r="4.5" fill="white" stroke={color} strokeWidth="2.5" />
        );
      })}

      {/* X Labels */}
      {labels.map((lbl, i) => {
        const x = paddingLeft + (i / (labels.length - 1)) * (w - 20);
        return (
          <text key={i} x={x} y={h + paddingTop + 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">
            {lbl}
          </text>
        );
      })}
    </svg>
  );
};

const BarChart = ({ data = [], color = "#3b82f6", labels = [] }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 10);
  const barW = 32, gap = 16, h = 180;
  const paddingLeft = 40, paddingBottom = 30;
  const svgW = data.length * (barW + gap) + paddingLeft + 20;
  const svgH = h + paddingBottom + 20;

  // Y-axis ticks
  const ticks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  return (
    <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
      {/* Grid lines & Y-axis labels */}
      {ticks.map((t, idx) => {
        const yPos = h - (t / max) * h + 10;
        return (
          <g key={idx}>
            <line x1={paddingLeft} y1={yPos} x2={svgW - 20} y2={yPos} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={paddingLeft - 8} y={yPos + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{t}</text>
          </g>
        );
      })}

      {/* X & Y Axis Lines */}
      <line x1={paddingLeft} y1={10} x2={paddingLeft} y2={h + 10} stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1={paddingLeft} y1={h + 10} x2={svgW - 20} y2={h + 10} stroke="#cbd5e1" strokeWidth="1.5" />

      {/* Bars */}
      {data.map((v, i) => {
        const bh = (v / max) * h;
        const xPos = paddingLeft + i * (barW + gap) + gap / 2;
        return (
          <g key={i}>
            <rect
              x={xPos}
              y={h - bh + 10}
              width={barW}
              height={bh}
              rx="6"
              fill={color}
              opacity="0.9"
            />
            {labels[i] && (
              <text x={xPos + barW / 2} y={h + 26} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const LineChart = ({ data = [], color = "#3b82f6", labels = [], height = 180 }) => {
  if (!data.length) return null;
  const max = Math.max(...data.flatMap(d => d.values), 10);
  const paddingLeft = 40, paddingBottom = 30;
  const w = 400, h = height;
  const svgW = w + paddingLeft + 20;
  const svgH = h + paddingBottom + 20;

  // Y-axis ticks
  const ticks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  return (
    <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
      {/* Grid lines & Y-axis labels */}
      {ticks.map((t, idx) => {
        const yPos = h - (t / max) * h + 10;
        return (
          <g key={idx}>
            <line x1={paddingLeft} y1={yPos} x2={svgW - 20} y2={yPos} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={paddingLeft - 8} y={yPos + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{t}</text>
          </g>
        );
      })}

      {/* X & Y Axis Lines */}
      <line x1={paddingLeft} y1={10} x2={paddingLeft} y2={h + 10} stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1={paddingLeft} y1={h + 10} x2={svgW - 20} y2={h + 10} stroke="#cbd5e1" strokeWidth="1.5" />

      {data.map((series, sIdx) => {
        const points = series.values.map((v, i) => {
          const x = paddingLeft + (i / (series.values.length - 1)) * (w - 20);
          const y = h - (v / max) * h + 10;
          return `${x},${y}`;
        }).join(" ");

        return (
          <g key={sIdx}>
            <polyline
              points={points}
              fill="none"
              stroke={series.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {series.values.map((v, i) => {
              const x = paddingLeft + (i / (series.values.length - 1)) * (w - 20);
              const y = h - (v / max) * h + 10;
              return <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke={series.color} strokeWidth="2" />;
            })}
          </g>
        );
      })}

      {/* X Labels */}
      {labels.map((lbl, i) => {
        const x = paddingLeft + (i / (labels.length - 1)) * (w - 20);
        return (
          <text key={i} x={x} y={h + 26} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">
            {lbl}
          </text>
        );
      })}
    </svg>
  );
};

const DonutChart = ({ segments = [], size = 160 }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const r = size * 0.38, cx = size / 2, cy = size / 2;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let angle = -90;

  const paths = segments.map((seg, i) => {
    const sweep = (seg.value / total) * 360;
    const startRad = (angle * Math.PI) / 180;
    const endRad = ((angle + sweep) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = sweep > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    angle += sweep;
    return { d, color: seg.color, label: seg.label, value: seg.value, idx: i };
  });

  return (
    <div className="donut-container" style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ cursor: "pointer" }}>
        <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#f1f5f9" strokeWidth="1" />
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.color}
            opacity={hoveredIdx === null || hoveredIdx === i ? 0.9 : 0.4}
            style={{ transition: "all 0.2s ease", transform: hoveredIdx === i ? "scale(1.05)" : "scale(1)", transformOrigin: "center" }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.65} fill="white" />
        {hoveredIdx !== null ? (
          <g style={{ pointerEvents: "none" }}>
            <text x={cx} y={cy - 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#64748b">
              {segments[hoveredIdx].label}
            </text>
            <text x={cx} y={cy + 15} textAnchor="middle" fontSize="18" fontWeight="900" fill="#05192d">
              {segments[hoveredIdx].value}
            </text>
          </g>
        ) : (
          <g style={{ pointerEvents: "none" }}>
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#94a3b8">
              Roles
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// ── Main Admin Component ──────────────────────────────────────────────────
const Admin = ({ user, logo, ajalabsblack, handleLogout }) => {
  const [showLanding, setShowLanding] = useState(true);
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

  // Performance history state
  const [perfHistory, setPerfHistory] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfDateRange, setPerfDateRange] = useState(7); // last N days

  // Dashboard charts state
  const [weeklyLogins, setWeeklyLogins] = useState([12, 19, 8, 24, 17, 31, 22]);

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
      const log = await logRes.json();
      const sess = await sessRes.json();
      const report = await reportRes.json();
      setActivityLog(log);
      setSessionsSummary(sess);
      setDailyReport(report);
    } catch (e) { console.error(e); }
    finally { setMonitorLoading(false); }
  }, [selectedDate]);

  const fetchPerfHistory = useCallback(async () => {
    setPerfLoading(true);
    try {
      const res = await fetch(`${API}/admin/performance_history?days=${perfDateRange}`);
      if (res.ok) setPerfHistory(await res.json());
      else {
        // Fallback mock data
        const mock = [];
        for (let d = perfDateRange - 1; d >= 0; d--) {
          const date = new Date();
          date.setDate(date.getDate() - d);
          mock.push({
            date: date.toISOString().slice(0, 10),
            total_logins: Math.floor(Math.random() * 20) + 5,
            total_events: Math.floor(Math.random() * 80) + 20,
            active_users: Math.floor(Math.random() * 8) + 1,
            insights_run: Math.floor(Math.random() * 15),
            user_summaries: [],
          });
        }
        setPerfHistory(mock);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      const mock = [];
      for (let d = perfDateRange - 1; d >= 0; d--) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        mock.push({
          date: date.toISOString().slice(0, 10),
          total_logins: Math.floor(Math.random() * 20) + 5,
          total_events: Math.floor(Math.random() * 80) + 20,
          active_users: Math.floor(Math.random() * 8) + 1,
          insights_run: Math.floor(Math.random() * 15),
          user_summaries: [],
        });
      }
      setPerfHistory(mock);
    }
    finally { setPerfLoading(false); }
  }, [perfDateRange]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    if (activeSection === "activity" || activeSection === "sessions" || activeSection === "daily" || activeSection === "dashboard") {
      fetchMonitorData();
    }
  }, [activeSection, fetchMonitorData]);
  useEffect(() => {
    if (activeSection === "history") fetchPerfHistory();
  }, [activeSection, fetchPerfHistory]);

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
      if (res.ok) {
        setShowModal(false);
        fetchUsers();
        setCurrentUser({ id: "", username: "", password: "", role: "viewer", status: "Active" });
      } else { const d = await res.json(); alert(d.message); }
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
    viewers: usersList.filter(u => u.role === "viewer").length,
    active: usersList.filter(u => u.status === "Active").length,
  };

  const activeSessions = sessionsSummary.filter(s => !s.logout_time).length;
  const todayLogins = dailyReport?.total_logins || 0;
  const todayEvents = dailyReport?.total_events || 0;
  const todayInsights = dailyReport?.user_summaries?.reduce((a, u) => a + (u.actions?.filter(a => a.action === "RUN_INSIGHTS").length || 0), 0) || 0;

  // Sidebar toggle
  const toggleSide = (key) => setSideOpen(p => ({ ...p, [key]: !p[key] }));

  // ── Nav helper ─────────────────────────────────────────────────────────
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

  // ── DASHBOARD ─────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="adm-section-wrapper wide">
      {/* Title row */}
      <div className="adm-page-title-row">
        <div>
          <h2 className="adm-page-title">Admin Dashboard</h2>
          <p className="adm-page-subtitle">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* KPI Row - Redesigned v2 */}
      <div className="adm-kpi-row grid-3">
        {[
          { label: "Total Users", value: stats.total, icon: "👤", color: "#00df81", trend: "+12%", trendUp: true },
          { label: "Active Now", value: activeSessions, icon: "⚡", color: "#3b82f6", trend: "Live", trendUp: true },
          { label: "Today's Logins", value: todayLogins, icon: "🔑", color: "#f59e0b", trend: "+5%", trendUp: true },
          { label: "Events Today", value: todayEvents, icon: "🖱️", color: "#8b5cf6", trend: "+8%", trendUp: true },
          { label: "Insights Run", value: todayInsights, icon: "📊", color: "#ef4444", trend: "Today", trendUp: true },
          { label: "Active Accounts", value: stats.active, icon: "🛡️", color: "#00df81", trend: "Total", trendUp: true },
        ].map((k) => (
          <div className="adm-kpi-card-v2" key={k.label} style={{ "--kc": k.color }}>
            <div className="adm-kpi-icon-box-v2" style={{ background: k.color + "12" }}>
              <span className="adm-kpi-icon-v2">{k.icon}</span>
            </div>
            <div className="adm-kpi-content-v2">
              <div className="adm-kpi-label-row-v2">
                <span className="adm-kpi-label-v2">{k.label}</span>
                <span className={`adm-kpi-trend-v2 ${k.trendUp ? "up" : "down"}`}>{k.trend}</span>
              </div>
              <div className="adm-kpi-val-v2">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="adm-charts-row">
        {/* Weekly logins bar chart - Enhanced with axes */}
        <div className="adm-chart-card lg">
          <div className="adm-chart-header">
            <div>
              <div className="adm-chart-title">Weekly Login Activity</div>
              <div className="adm-chart-sub">Last 7 days</div>
            </div>
            <div className="adm-chart-legend">
              <span className="adm-legend-dot" style={{ background: "#3b82f6" }} />Online Logins
            </div>
          </div>
          <div className="adm-bar-chart-wrap-updated">
            <AreaChart
              data={weeklyLogins}
              color="#3b82f6"
              labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
            />
          </div>
        </div>

        {/* Session Trend line chart - Replaced individual sparklines */}
        <div className="adm-chart-card md">
          <div className="adm-chart-header">
            <div>
              <div className="adm-chart-title">Session Trend</div>
              <div className="adm-chart-sub">Active vs Unique</div>
            </div>
            <div className="adm-chart-legend">
              <span className="adm-legend-dot" style={{ background: "#00df81" }} />Active
              <span className="adm-legend-dot" style={{ background: "#8b5cf6" }} />Unique
            </div>
          </div>
          <div className="adm-trend-lines-updated">
            <LineChart
              labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
              data={[
                { label: "Active", color: "#00df81", values: [2, 4, 3, 6, 5, 8, activeSessions] },
                { label: "Unique", color: "#8b5cf6", values: [3, 4, 3, 5, 4, 6, stats.active] }
              ]}
              height={140}
            />
          </div>
        </div>
      </div>

      {/* Bottom row: Top Users & Role Distribution */}
      <div className="adm-bottom-row">
        {/* Top Active Users - Expanded to fill more space */}
        <div className="adm-bottom-card xl">
          <div className="adm-chart-header">
            <div className="adm-chart-title">Top Active Users</div>
            <div className="adm-chart-sub">By number of actions today</div>
          </div>
          <div className="adm-top-users-table">
            <div className="adm-tu-head">
              <span>#</span>
              <span>Name</span>
              <span>Role</span>
              <span>Actions</span>
              <span>Sessions</span>
            </div>
            {(dailyReport?.user_summaries || []).slice(0, 5).map((us, i) => (
              <div className="adm-tu-row" key={i}>
                <span className="adm-tu-rank">{String(i + 1).padStart(2, "0")}</span>
                <span className="adm-tu-user">
                  <span className="adm-avatar sm" style={{ background: ROLE_COLORS[us.role] + "22", color: ROLE_COLORS[us.role] }}>
                    {us.username?.charAt(0).toUpperCase()}
                  </span>
                  {us.username}
                </span>
                <span>
                  <span className="adm-role-chip sm" style={{ background: ROLE_COLORS[us.role] + "18", color: ROLE_COLORS[us.role], borderColor: ROLE_COLORS[us.role] + "44" }}>
                    {us.role}
                  </span>
                </span>
                <span className="adm-tu-bar-wrap">
                  <div className="adm-tu-bar" style={{ width: `${Math.min(100, (us.actions?.length || 0) * 10)}%`, background: ROLE_COLORS[us.role] }} />
                  <span className="adm-tu-count">{us.actions?.length || 0}</span>
                </span>
                <span className="adm-tu-sessions">
                  {sessionsSummary.filter(s => s.username === us.username).length}
                </span>
              </div>
            ))}
            {(!dailyReport?.user_summaries || dailyReport.user_summaries.length === 0) && (
              <div className="adm-empty-cell" style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                No user activity recorded today yet
              </div>
            )}
          </div>
        </div>

        {/* Role distribution - Enriched with larger donut */}
        <div className="adm-bottom-card sm">
          <div className="adm-chart-header">
            <div className="adm-chart-title">Role Distribution</div>
            <div className="adm-chart-sub">Users by role</div>
          </div>
          <div className="adm-role-dist simple-donut">
            <div className="adm-role-donut-center enlarged">
              <DonutChart
                segments={[
                  { label: "Uploaders", value: stats.uploaders || 0, color: "#3b82f6" },
                  { label: "Viewers", value: stats.viewers || 0, color: "#8b5cf6" },
                ]}
                size={220}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── USERS ──────────────────────────────────────────────────────────────
  const renderUsers = () => (
    <div className="adm-section-wrapper">
      <div className="adm-page-title-row">
        <div>
          <h2 className="adm-page-title">User Management</h2>
          <p className="adm-page-subtitle">
            {filteredUsers.length} {activeRoleFilter === "all" ? "total" : activeRoleFilter} user{filteredUsers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="adm-add-btn" onClick={openAddModal}><span>+</span> Add User</button>
      </div>

      <div className="adm-filter-row">
        <div className="adm-filter-tabs">
          {["all", "uploader", "viewer"].map(r => (
            <button key={r} className={`adm-tab ${activeRoleFilter === r ? "active" : ""}`} onClick={() => setActiveRoleFilter(r)}>
              {r === "all" ? "All Users" : r.charAt(0).toUpperCase() + r.slice(1) + "s"}
            </button>
          ))}
        </div>
        <div className="adm-search-wrap">
          <span className="adm-search-icon">🔍</span>
          <input className="adm-search-input" type="text" placeholder="Search users…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {usersLoading ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Loading users…</span></div>
      ) : (
        <div className="adm-table-card">
          <table className="adm-table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr>
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

  // ── ACTIVITY ──────────────────────────────────────────────────────────
  const renderActivity = () => (
    <div className="adm-section-wrapper">
      <div className="adm-page-title-row">
        <div>
          <h2 className="adm-page-title">Activity Log</h2>
          <p className="adm-page-subtitle">Every action, timestamped</p>
        </div>
        <div className="adm-date-filter">
          <span>📅</span>
          <input type="date" className="adm-date-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
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
                    {entry.country && (
                      <span className="adm-country-chip">🌍 {entry.country}</span>
                    )}
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

  // ── SESSIONS ──────────────────────────────────────────────────────────
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
              <tr><th>User</th><th>Role</th><th>Country</th><th>Login Time</th><th>Logout Time</th><th>Reason</th><th>Status</th></tr>
            </thead>
            <tbody>
              {sessionsSummary.length === 0 ? (
                <tr><td colSpan="7" className="adm-empty-cell">No sessions recorded</td></tr>
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
                  <td>
                    <span className="adm-country-chip">{s.country ? `🌍 ${s.country}` : "—"}</span>
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

  // ── DAILY REPORT ──────────────────────────────────────────────────────
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

  // ── PERFORMANCE HISTORY ───────────────────────────────────────────────
  const renderHistory = () => (
    <div className="adm-section-wrapper wide">
      <div className="adm-page-title-row">
        <div>
          <h2 className="adm-page-title">Performance History</h2>
          <p className="adm-page-subtitle">Daily summaries saved for future reference</p>
        </div>
        <div className="adm-date-filter">
          <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Show last</span>
          {[7, 14, 30].map(d => (
            <button
              key={d}
              className={`adm-refresh-btn ${perfDateRange === d ? "active-range" : ""}`}
              onClick={() => setPerfDateRange(d)}
            >
              {d}d
            </button>
          ))}
          <button className="adm-refresh-btn" onClick={fetchPerfHistory}>↻ Refresh</button>
        </div>
      </div>

      {/* Summary KPIs */}
      {perfHistory.length > 0 && (
        <div className="adm-stats-grid four" style={{ marginBottom: "28px" }}>
          {[
            { label: "Avg Daily Logins", value: Math.round(perfHistory.reduce((a, p) => a + (p.total_logins || 0), 0) / perfHistory.length), icon: "🔑", accent: "#00df81" },
            { label: "Avg Daily Events", value: Math.round(perfHistory.reduce((a, p) => a + (p.total_events || 0), 0) / perfHistory.length), icon: "📋", accent: "#3b82f6" },
            { label: "Avg Active Users", value: Math.round(perfHistory.reduce((a, p) => a + (p.active_users || 0), 0) / perfHistory.length), icon: "👥", accent: "#f59e0b" },
            { label: "Total Days Tracked", value: perfHistory.length, icon: "📅", accent: "#8b5cf6" },
          ].map(s => (
            <div className="adm-stat-card" key={s.label} style={{ "--accent": s.accent }}>
              <div className="adm-stat-icon">{s.icon}</div>
              <div className="adm-stat-val">{s.value}</div>
              <div className="adm-stat-label">{s.label}</div>
              <div className="adm-stat-bar" />
            </div>
          ))}
        </div>
      )}

      {perfLoading ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Loading history…</span></div>
      ) : perfHistory.length === 0 ? (
        <div className="adm-empty-state">
          <div className="adm-empty-icon">📊</div>
          <div className="adm-empty-title">No performance history yet</div>
          <div className="adm-empty-sub">Daily reports are saved automatically at end of day</div>
        </div>
      ) : (
        <>
          {/* Trend chart */}
          <div className="adm-chart-card" style={{ marginBottom: "24px", width: "100%" }}>
            <div className="adm-chart-header">
              <div className="adm-chart-title">Platform Activity Trend</div>
              <div className="adm-chart-sub">Daily logins &amp; events over time</div>
            </div>
            <div style={{ padding: "16px 0 8px", overflowX: "auto" }}>
              <BarChart
                data={perfHistory.map(p => p.total_logins || 0)}
                color="#00df81"
                labels={perfHistory.map(p => p.date?.slice(5))}
              />
            </div>
          </div>

          {/* History table */}
          <div className="adm-table-card">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Logins</th>
                  <th>Active Sessions</th>
                  <th>Total Events</th>
                  <th>Active Users</th>
                  <th>Insights Run</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {perfHistory.map((p, i) => (
                  <tr key={i} className="adm-table-row">
                    <td className="adm-mono" style={{ fontWeight: 700 }}>{p.date}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "40px", height: "6px", borderRadius: "3px", background: "#f1f5f9", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, (p.total_logins || 0) * 5)}%`, height: "100%", background: "#00df81", borderRadius: "3px" }} />
                        </div>
                        <span>{p.total_logins || 0}</span>
                      </div>
                    </td>
                    <td>{p.active_sessions || 0}</td>
                    <td>{p.total_events || 0}</td>
                    <td>{p.active_users || p.user_summaries?.length || 0}</td>
                    <td>{p.insights_run || 0}</td>
                    <td>
                      <button
                        className="adm-view-btn"
                        onClick={() => {
                          setSelectedDate(p.date);
                          setDailyReport(p);
                          setActiveSection("daily");
                        }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  // ── SECTION MAP ────────────────────────────────────────────────────────
  const sectionMap = {
    dashboard: renderDashboard,
    users: renderUsers,
    activity: renderActivity,
    sessions: renderSessions,
    daily: renderDailyReport,
    history: renderHistory,
  };

  const sectionLabels = {
    dashboard: "Dashboard",
    users: "User Management",
    activity: "Activity Log",
    sessions: "Session Monitor",
    daily: "Daily Report",
    history: "Performance History",
  };

  // ── LANDING PAGE ───────────────────────────────────────────────────────
  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} logo={logo} ajalabsblack={ajalabsblack} />;
  }

  // ── MAIN APP ───────────────────────────────────────────────────────────
  return (
    <div className="adm-root">
      {/* ── SIDEBAR ── */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <div className="adm-sidebar-logos">
            {logo && <img src={logo} alt="JKC" className="adm-sidebar-logo-jkc" />}
            {/* {ajalabsblack && <img src={ajalabsblack} alt="AJA Labs" className="adm-sidebar-logo-aja" />} */}
          </div>
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

          <div className="adm-nav-group-label">Reports</div>
          {navItem("history", "📊", "Performance History")}
        </nav>

        <div className="adm-sidebar-foot">
          <button className="adm-back-to-landing" onClick={() => setShowLanding(true)}>
            <span>🏠</span> Home
          </button>
          <button className="adm-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="adm-main">
        <header className="adm-topbar">
          <div className="adm-topbar-title">
            {sectionLabels[activeSection] || activeSection}
          </div>
          <div className="adm-topbar-right">
            {ajalabsblack && <img src={ajalabsblack} alt="AJA Labs" className="adm-topbar-logo-aja" />}
          </div>
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