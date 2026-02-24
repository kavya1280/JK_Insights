import React, { useState } from "react";
import "./Welcome.css";
import logo from "./assets/images/jkc.png";
import ajalabs from "./assets/images/ajalabs-white.png";

const Welcome = ({ user, insights, onLogout, refreshInsights }) => {
  const [view, setView] = useState("menu");
  const [selectedInsight, setSelectedInsight] = useState("");
  const [uploading, setUploading] = useState(false);

  // --- UPDATED: Handle Multiple File Upload ---
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    // Loop through all selected files and add to formData
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch("http://localhost:5000/upload_excel", {
        method: "POST",
        body: formData, // Sending multiple files
      });

      if (response.ok) {
        alert(`${files.length} file(s) uploaded successfully!`);
        refreshInsights(); 
        setView("menu");
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="welcome-page-container">
      <div className="blue-blob blob-1"></div>
      <div className="blue-blob blob-2"></div>

      <nav className="top-nav">
        <div className="nav-left">
          <img src={logo} alt="JKC" className="logo-jk" />
        </div>
        <div className="nav-right">
          <button className="signout-btn" onClick={onLogout}>Sign out</button>
          <img src={ajalabs} alt="Ajalabs" className="logo-aja" />
        </div>
      </nav>

      <div className="welcome-card">
        <div className="welcome-header">
          <h1>Welcome, {user.username}</h1>
          <p>Role: <span className="role-tag">{user.role}</span></p>
        </div>

        {view === "menu" && (
          <div className="action-buttons">
            <button className="btn-primary" onClick={() => setView("upload")}>
              📁 Upload Excel Files
            </button>
            <button className="btn-secondary" onClick={() => setView("insights")}>
              📊 Select Insights
            </button>
          </div>
        )}

        {view === "upload" && (
          <div className="sub-view">
            <h3>Upload Data</h3>
            <div className="upload-box">
              {/* Added 'multiple' attribute here */}
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                id="file-upload" 
                onChange={handleFileUpload} 
                multiple 
                hidden 
              />
              <label htmlFor="file-upload" className="upload-label">
                {uploading ? "Processing..." : "Select one or more Excel Files"}
              </label>
            </div>
            <button className="back-btn" onClick={() => setView("menu")}>Back to Menu</button>
          </div>
        )}

        {view === "insights" && (
          <div className="sub-view">
            <h3>Insights Explorer</h3>
            <select 
              className="insight-select" 
              onChange={(e) => setSelectedInsight(e.target.value)}
            >
              <option value="">-- Choose from List --</option>
              {insights.map((item, index) => (
                <option key={index} value={item.Insights}>
                  {item.ID} - {item.Insights}
                </option>
              ))}
            </select>

            {selectedInsight && (
              <div className="insight-result">
                <strong>Detail:</strong> {selectedInsight}
              </div>
            )}
            <button className="back-btn" onClick={() => setView("menu")}>Back to Menu</button>
          </div>
        )}
      </div>

      <footer className="welcome-footer">
        <p>Copyright @ajalabs 2024 | Privacy Policy</p>
      </footer>
    </div>
  );
};

export default Welcome;