import React, { useState, useEffect } from "react";
import "./admin.css";

const Admin = ({ user, logo, ajalabsblack, handleLogout }) => {
  const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for Edit/Add Modal
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState({ id: "", name: "", role: "viewer", status: "Active" });

  // 1. Fetch Users from Backend (user.json)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/get_users"); // Adjust to your actual endpoint
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

  // 2. Delete User
  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`http://localhost:5000/delete_user/${userId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setUsersList(usersList.filter((u) => u.id !== userId));
        }
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  // 3. Save User (Update or Create)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    const method = currentUser.id ? "PUT" : "POST";
    const endpoint = currentUser.id
      ? `http://localhost:5000/update_user/${currentUser.id}`
      : "http://localhost:5000/add_user";

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentUser),
      });

      if (response.ok) {
        setShowModal(false);
        fetchUsers(); // Refresh the list
        setCurrentUser({ id: "", name: "", role: "viewer", status: "Active" });
      }
    } catch (err) {
      alert("Action failed");
    }
  };

  const openEditModal = (userToEdit) => {
    setCurrentUser(userToEdit);
    setShowModal(true);
  };

  const filteredUsers = activeTab === "all" ? usersList : usersList.filter(u => u.role === activeTab);

  return (
    <div className="admin-container">
      {/* SIDEBAR (Same as before) */}
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
                  <div key={role} className={`drop-item ${activeTab === role ? 'sel' : ''}`} onClick={() => setActiveTab(role)}>
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
            <button className="add-btn" onClick={() => { setCurrentUser({ id: "", name: "", role: "viewer", status: "Active" }); setShowModal(true); }}>
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
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="user-cell"><div className="user-avatar">{u.username?.charAt(0)}</div>{u.username}</td>
                      <td><span className={`role-tag ${u.role}`}>{u.role}</span></td>
                      <td><span className={`status-badge ${u.status?.toLowerCase()}`}>{u.status}</span></td>
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
                  value={currentUser.username}
                  onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                  required
                />
              </div>
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
                <select value={currentUser.status} onChange={(e) => setCurrentUser({ ...currentUser, status: e.target.value })}>
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