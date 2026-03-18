import React, { useState, useEffect } from "react";
import "./Reviewer.css";

const API = "http://localhost:5000";

const STATUS_META = {
  pending: { label: "Pending Review", color: "#f59e0b", bg: "#fef9c3", icon: "⏳" },
  approved: { label: "Approved", color: "#10b981", bg: "#d1fae5", icon: "✅" },
  rejected: { label: "Rejected", color: "#ef4444", bg: "#fee2e2", icon: "❌" },
  changes: { label: "Changes Needed", color: "#3b82f6", bg: "#dbeafe", icon: "📝" },
};

const INSIGHT_LABELS = {
  PJPA10: "Junior/Senior Analysis", PJPA13: "Policy Validation",
  PJPA14: "Duplicate Claims", PJPA16: "Duplicate Employee",
  PJPA18: "Multiple Submits", PJPA19: "Multiple Travel Modes",
  PJPA20: "Odd Time Submission", PJPA21: "Overlapping Travel",
  PJPA22: "Cross-Employee Duplicate", PJPA23: "Submit Before Start",
  PJPA24: "Z-Score Insights", PJPA27: "Notice Period",
  PJPA28: "Benford's Law", PJPA29: "New Joiner",
  PJPA30: "Short Trip Abuse", PJPA31: "Structural Splitting",
  PJPA32: "Holiday/Weekend Travel", PJPA33: "Bulk Booker",
  PJPA34: "Low Value Claims", PJPA35: "Duplicate Report ID",
  PJPA36: "Missing Days", PJPA38: "Odd Travels",
  PJPA39: "Active with Sep Date", PJPA40: "Transaction Date Anomaly",
};

// Mock review queue — in production, fetch from backend
const MOCK_QUEUE = [
  { id: "rev-001", uploader: "uploader", insight: "PJPA10", submittedAt: new Date(Date.now() - 3600000).toISOString(), status: "pending", rows: 42 },
  { id: "rev-002", uploader: "uploader2", insight: "PJPA28", submittedAt: new Date(Date.now() - 7200000).toISOString(), status: "pending", rows: 18 },
  { id: "rev-003", uploader: "uploader", insight: "PJPA14", submittedAt: new Date(Date.now() - 86400000).toISOString(), status: "approved", rows: 7 },
  { id: "rev-004", uploader: "uploader2", insight: "PJPA33", submittedAt: new Date(Date.now() - 90000000).toISOString(), status: "rejected", rows: 23 },
  { id: "rev-005", uploader: "uploader", insight: "PJPA24", submittedAt: new Date(Date.now() - 172800000).toISOString(), status: "changes", rows: 55 },
];

const fmt = (iso) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const relTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "< 1 hour ago";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const Reviewer = ({ user, logo, ajalabsblack, handleLogout }) => {
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedItem, setSelectedItem] = useState(null);
  const [comment, setComment] = useState("");
  const [actionModal, setActionModal] = useState(null); // { item, type: 'approve'|'reject'|'changes' }
  const [showDetail, setShowDetail] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const filteredQueue = queue.filter(item => {
    const tabMatch = activeTab === "all" || item.status === activeTab;
    const searchMatch = !searchQ ||
      item.uploader.toLowerCase().includes(searchQ.toLowerCase()) ||
      item.insight.toLowerCase().includes(searchQ.toLowerCase()) ||
      (INSIGHT_LABELS[item.insight] || "").toLowerCase().includes(searchQ.toLowerCase());
    return tabMatch && searchMatch;
  });

  const handleAction = (type) => {
    if (!actionModal) return;
    setQueue(prev => prev.map(item =>
      item.id === actionModal.item.id
        ? { ...item, status: type === "approve" ? "approved" : type === "reject" ? "rejected" : "changes", comment }
        : item
    ));
    // Log activity
    fetch(`${API}/log_activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user?.username,
        role: user?.role,
        action: `REVIEW_${type.toUpperCase()}`,
        details: `${type} on ${actionModal.item.insight} (by ${actionModal.item.uploader})${comment ? ` — "${comment}"` : ""}`
      })
    }).catch(() => { });
    setActionModal(null);
    setComment("");
    if (selectedItem?.id === actionModal.item.id) setSelectedItem(null);
  };

  const stats = {
    pending: queue.filter(i => i.status === "pending").length,
    approved: queue.filter(i => i.status === "approved").length,
    rejected: queue.filter(i => i.status === "rejected").length,
    changes: queue.filter(i => i.status === "changes").length,
  };

  return (
    <div className="rev-root">
      {/* ── TOPBAR ── */}
      <nav className="rev-topbar">
        <img src={ajalabsblack} alt="Ajalabs" className="rev-logo-left" />

        <div className="rev-topbar-center">
          <div className="rev-topbar-title">Review Dashboard</div>
          {stats.pending > 0 && (
            <span className="rev-pending-pill">{stats.pending} pending</span>
          )}
        </div>

        <div className="rev-topbar-right">
          <div
            className="rev-profile-wrap"
            onMouseEnter={() => setProfileOpen(true)}
            onMouseLeave={() => setProfileOpen(false)}
          >
            <button className="rev-profile-btn">
              <div className="rev-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
              <span>{user?.username}</span>
              <span className={`rev-chevron ${profileOpen ? "open" : ""}`}>▾</span>
            </button>
            {profileOpen && (
              <div className="rev-dropdown">
                <div className="rev-dropdown-head">
                  <div className="rev-dropdown-name">{user?.username}</div>
                  <div className="rev-dropdown-role">Reviewer</div>
                </div>
                <div className="rev-dropdown-body">
                  <button className="rev-dropdown-item danger" onClick={handleLogout}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          <img src={logo} alt="JK Cement" className="rev-logo-right" />
        </div>
      </nav>

      {/* ── BODY ── */}
      <div className="rev-body">
        {/* ── STATS ── */}
        <div className="rev-stats-bar">
          {[
            { key: "pending", label: "Awaiting Review", icon: "⏳" },
            { key: "approved", label: "Approved", icon: "✅" },
            { key: "rejected", label: "Rejected", icon: "❌" },
            { key: "changes", label: "Changes Needed", icon: "📝" },
          ].map(s => (
            <div
              key={s.key}
              className={`rev-stat-card ${activeTab === s.key ? "active" : ""}`}
              style={{ "--acc": STATUS_META[s.key].color }}
              onClick={() => setActiveTab(s.key)}
            >
              <div className="rev-stat-icon">{s.icon}</div>
              <div className="rev-stat-val">{stats[s.key]}</div>
              <div className="rev-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── MAIN PANEL ── */}
        <div className="rev-main-panel">
          {/* Queue List */}
          <div className="rev-queue-panel">
            <div className="rev-queue-header">
              <div className="rev-queue-tabs">
                {["all", "pending", "approved", "rejected", "changes"].map(t => (
                  <button key={t} className={`rev-qtab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                    {t === "all" ? "All" : STATUS_META[t].label}
                  </button>
                ))}
              </div>
              <div className="rev-search-wrap">
                <span>🔍</span>
                <input
                  className="rev-search-input"
                  placeholder="Search insights or uploaders…"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                />
              </div>
            </div>

            <div className="rev-queue-list">
              {filteredQueue.length === 0 ? (
                <div className="rev-empty">
                  <div className="rev-empty-icon">🔍</div>
                  <div className="rev-empty-title">No items found</div>
                  <div className="rev-empty-sub">Try a different filter or search</div>
                </div>
              ) : filteredQueue.map(item => {
                const meta = STATUS_META[item.status];
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rev-queue-item ${isSelected ? "selected" : ""}`}
                    onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                  >
                    <div className="rev-qi-left">
                      <div className="rev-qi-insight">
                        <span className="rev-qi-code">{item.insight}</span>
                        <span className="rev-qi-name">{INSIGHT_LABELS[item.insight] || item.insight}</span>
                      </div>
                      <div className="rev-qi-meta">
                        <span className="rev-qi-uploader">⬆ {item.uploader}</span>
                        <span className="rev-qi-time">{relTime(item.submittedAt)}</span>
                        <span className="rev-qi-rows">{item.rows} rows</span>
                      </div>
                    </div>
                    <div className="rev-qi-right">
                      <span
                        className="rev-status-chip"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {meta.icon} {meta.label}
                      </span>
                      {item.status === "pending" && (
                        <div className="rev-qi-actions">
                          <button
                            className="rev-approve-btn"
                            onClick={e => { e.stopPropagation(); setActionModal({ item, type: "approve" }); }}
                            title="Approve"
                          >✓</button>
                          <button
                            className="rev-reject-btn"
                            onClick={e => { e.stopPropagation(); setActionModal({ item, type: "reject" }); }}
                            title="Reject"
                          >✕</button>
                          <button
                            className="rev-changes-btn"
                            onClick={e => { e.stopPropagation(); setActionModal({ item, type: "changes" }); }}
                            title="Request Changes"
                          >✎</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          {showDetail && selectedItem && (
            <div className="rev-detail-panel">
              <div className="rev-detail-header">
                <div>
                  <div className="rev-detail-code">{selectedItem.insight}</div>
                  <div className="rev-detail-name">{INSIGHT_LABELS[selectedItem.insight]}</div>
                </div>
                <button className="rev-detail-close" onClick={() => setShowDetail(false)}>✕</button>
              </div>

              <div className="rev-detail-body">
                <div className="rev-detail-grid">
                  {[
                    { label: "Submitted by", value: selectedItem.uploader },
                    { label: "Submitted at", value: fmt(selectedItem.submittedAt) },
                    { label: "Row count", value: `${selectedItem.rows} records` },
                    { label: "Status", value: STATUS_META[selectedItem.status].label },
                  ].map(r => (
                    <div className="rev-detail-row" key={r.label}>
                      <span className="rev-detail-label">{r.label}</span>
                      <span className="rev-detail-value">{r.value}</span>
                    </div>
                  ))}
                </div>

                {selectedItem.comment && (
                  <div className="rev-detail-comment">
                    <div className="rev-detail-comment-label">Reviewer Comment</div>
                    <div className="rev-detail-comment-text">{selectedItem.comment}</div>
                  </div>
                )}

                {selectedItem.status === "pending" && (
                  <div className="rev-detail-actions">
                    <div className="rev-detail-actions-title">Review Actions</div>
                    <div className="rev-detail-comment-group">
                      <label>Add a comment (optional)</label>
                      <textarea
                        className="rev-comment-input"
                        placeholder="Provide feedback or notes for the uploader…"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="rev-detail-btn-row">
                      <button
                        className="rev-btn approve"
                        onClick={() => { setActionModal({ item: selectedItem, type: "approve" }); }}
                      >
                        <span>✅</span> Approve
                      </button>
                      <button
                        className="rev-btn changes"
                        onClick={() => { setActionModal({ item: selectedItem, type: "changes" }); }}
                      >
                        <span>📝</span> Request Changes
                      </button>
                      <button
                        className="rev-btn reject"
                        onClick={() => { setActionModal({ item: selectedItem, type: "reject" }); }}
                      >
                        <span>❌</span> Reject
                      </button>
                    </div>
                  </div>
                )}

                <div className="rev-detail-readonly-notice">
                  <span>🔒</span> View-only — Reviewers cannot modify uploaded data
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ACTION CONFIRMATION MODAL ── */}
      {actionModal && (
        <div className="rev-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="rev-modal" onClick={e => e.stopPropagation()}>
            <div className="rev-modal-icon">
              {actionModal.type === "approve" ? "✅" : actionModal.type === "reject" ? "❌" : "📝"}
            </div>
            <h3 className="rev-modal-title">
              {actionModal.type === "approve" ? "Approve this insight?"
                : actionModal.type === "reject" ? "Reject this insight?"
                  : "Request changes?"}
            </h3>
            <p className="rev-modal-sub">
              {INSIGHT_LABELS[actionModal.item.insight]} · submitted by {actionModal.item.uploader}
            </p>
            <div className="rev-modal-comment-group">
              <label>Comment {actionModal.type !== "approve" ? "(required)" : "(optional)"}</label>
              <textarea
                className="rev-comment-input"
                placeholder={
                  actionModal.type === "approve" ? "Optional approval note…"
                    : actionModal.type === "reject" ? "Explain the reason for rejection…"
                      : "Describe the changes needed…"
                }
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
              />
            </div>
            <div className="rev-modal-btn-row">
              <button className="rev-modal-cancel" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`rev-modal-confirm ${actionModal.type}`}
                disabled={actionModal.type !== "approve" && !comment.trim()}
                onClick={() => handleAction(actionModal.type)}
              >
                {actionModal.type === "approve" ? "Confirm Approval"
                  : actionModal.type === "reject" ? "Confirm Rejection"
                    : "Send for Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviewer;