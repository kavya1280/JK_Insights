import React, { useState, useEffect } from "react";
import "./admin.css";

const Admin = ({ user, logo, ajalabsblack, handleLogout }) => {
  const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState({ id: "", username: "", role: "viewer", status: "Active" });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/get_users");
      const data = await response.json();
      setUsersList(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`http://localhost:5000/delete_user/${userId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchUsers(); // ✅ Re-fetch instead of local filter to keep IDs accurate
        }
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const isEditing = !!currentUser.id;
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing
      ? `http://localhost:5000/update_user/${currentUser.id}`
      : "http://localhost:5000/add_user";

    const { id, ...payload } = currentUser;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchUsers();
        setCurrentUser({ id: "", username: "", role: "viewer", status: "Active" });
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      alert("Backend unreachable");
    }
  };

  const openEditModal = (userToEdit) => {
    setCurrentUser(userToEdit);
    setShowModal(true);
  };

  const filteredUsers = activeTab === "all" ? usersList : usersList.filter(u => u.role === activeTab);

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src={ajalabsblack} alt="Ajalabs" className="sidebar-logo" />
        </div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
            <span className="icon">📊</span> Dashboard
          </div>
          <div className="nav-item-wrapper">
            <div className="nav-item dropdown-toggle" onClick={() => setIsUsersDropdownOpen(!isUsersDropdownOpen)}>
              <span className="icon">👥</span> Manage Users
              <span className={`arrow ${isUsersDropdownOpen ? "open" : ""}`}>▼</span>
            </div>
            {isUsersDropdownOpen && (
              <div className="sidebar-dropdown">
                {["uploader", "reviewer", "viewer"].map(role => (
                  <div key={role} className={`drop-item ${activeTab === role ? "sel" : ""}`} onClick={() => setActiveTab(role)}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}s
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn-sidebar" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="search-bar"><input type="text" placeholder="Search user activity..." /></div>
          <div className="header-right">
            <div className="user-profile"><span>Admin: {user?.username}</span></div>
            <img src={logo} alt="JK Cement" className="admin-logo-animate" />
          </div>
        </header>

        <section className="admin-content">
          <div className="content-top">
            <h2 className="page-title">User Management ({activeTab.toUpperCase()})</h2>
            <button className="add-btn" onClick={() => {
              setCurrentUser({ id: "", username: "", role: "viewer", status: "Active" });
              setShowModal(true);
            }}>
              + Add New User
            </button>
          </div>

          <div className="table-container">
            {loading ? <p style={{ padding: "20px" }}>Loading users...</p> : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No users found</td></tr>
                  ) : filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="user-cell">
                        <div className="user-avatar">{u.username?.charAt(0).toUpperCase()}</div>
                        {u.username}
                      </td>
                      <td><span className={`role-tag ${u.role}`}>{u.role}</span></td>
                      {/* ✅ FIX: Fallback to "Active" if status is missing */}
                      <td><span className={`status-badge ${(u.status || "active").toLowerCase()}`}>{u.status || "Active"}</span></td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => openEditModal(u)} className="edit-icon">✏️</button>
                          <button onClick={() => handleDelete(u.id)} className="delete-icon">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* CRUD MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{currentUser.id ? "Edit User" : "Add New User"}</h3>
            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={currentUser.username || ""}
                  onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                  required
                />
              </div>
              {/* ✅ Show password field only when adding a new user */}
              {!currentUser.id && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={currentUser.password || ""}
                    onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Role</label>
                <select value={currentUser.role} onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}>
                  <option value="uploader">Uploader</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={currentUser.status || "Active"} onChange={(e) => setCurrentUser({ ...currentUser, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;