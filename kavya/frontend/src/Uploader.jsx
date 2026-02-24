import React, { useState, useRef, useCallback } from "react";
import "./uploader.css";
import uploaderImg from "./assets/images/upload.png";

const INSIGHT_OPTIONS = [
  { id: "PJPA13", label: "PJPA13 - Policy Validation - Bike" },
  { id: "PJPA13", label: "PJPA13 - Policy Validation - Car" },
  { id: "PJPA13", label: "PJPA13 - Policy Validation - Lodging" },
  { id: "PJPA13", label: "PJPA13 - Policy Validation - Daily Allowance" },
  { id: "PJPA14", label: "PJPA14 - Duplicate Claim" },
  { id: "PJPA15", label: "PJPA15 - Split Expenses" },
  { id: "PJPA16", label: "PJPA16 - Duplicate Employee" },
  { id: "PJPA17", label: "PJPA17 - Junior employees more than Senior" },
  { id: "PJPA18", label: "PJPA18 - Multiple Submits for Same Travel" },
  { id: "PJPA19", label: "PJPA19 - Multiple Travel Modes" },
  { id: "PJPA20", label: "PJPA20 - Odd Time Submission" },
  { id: "PJPA21", label: "PJPA21 - Overlapping Travel" },
  { id: "PJPA22", label: "PJPA22 - Same claim, multiple employees" },
  { id: "PJPA23", label: "PJPA23 - Submit Date before Report Start date" },
  { id: "PJPA24", label: "PJPA24 - ZSCore - Analysis" },
  { id: "PJPA25", label: "PJPA25 - Modified ZSCore Analysis" },
  { id: "PJPA26", label: "PJPA26 - Variance Analysis" },
  { id: "PJPA27", label: "PJPA27 - Notice Period Spending Spree" },
  { id: "PJPA28", label: "PJPA28 - Benford's Law Analysis" },
  { id: "PJPA29", label: "PJPA29 - New Joiner Early Claims" },
  { id: "PJPA30", label: "PJPA30 - Short Trip Frequency Abuse" },
  { id: "PJPA31", label: "PJPA31 - Structural Splitting (Structuring)" },
  { id: "PJPA32", label: "PJPA32 - Weekend or Holiday Travel" },
  { id: "PJPA33", label: "PJPA33 - Bulk Booker Receipt Error" },
  { id: "PJPA34", label: "PJPA34 - High-Frequency Low Value Claims" },
  { id: "PJPA35", label: "PJPA35 - Duplicate Report ID" },
  { id: "PJPA36", label: "PJPA36 - EDA Check - Missing Submit Date" },
  { id: "PJPA37", label: "PJPA37 - ML - On the Report Name" },
  { id: "PJPA38", label: "PJPA38 - Odd Travel Modes (5%)" },
  { id: "PJPA39", label: "PJPA39 - Separation Date Status Validation" },
];

const Uploader = ({ logo, ajalabsblack, handleLogout }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  const ACCEPTED = ".xlsx,.xls,.csv,.tsv";

  const processFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter((f) =>
      /\.(xlsx|xls|csv|tsv)$/i.test(f.name)
    );
    if (validFiles.length !== newFiles.length) {
      alert("Only Excel, CSV, and TSV files are allowed.");
    }
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...validFiles.filter((f) => !existing.has(f.name + f.size))];
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  return (
    <div className="up-container">
      {/* Navigation matching requested order */}
      <nav className="up-navbar">
        <div className="nav-left">
          {/* Removed Interface 2 text as requested */}
        </div>
        <div className="nav-right">
          <img src={ajalabsblack} alt="AJA Labs" className="nav-logo-aja" />
          <img src={logo} alt="JK Cement" className="nav-logo-jk" />
          <button className="nav-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="up-hero-section">
        <div className="up-content-left">
          <h1 className="up-main-title">
            Interface <br />
            <span className="title-bold">Dashboard</span>
            <span className="title-version">2</span>
          </h1>

          <p className="up-subtitle">
            A modern and minimal style for your <br /> next Data Dashboard Project.
          </p>

          <div className="up-insight-dropdown">
            <select
              value={selectedInsight}
              onChange={(e) => setSelectedInsight(e.target.value)}
              className="up-custom-select"
            >
              <option value="">Select Insight Analysis...</option>
              {INSIGHT_OPTIONS.map((opt, idx) => (
                <option key={idx} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Upload Section - Styled like the newsletter box in image */}
          <div
            className={`up-upload-box ${isDragging ? "dragging" : ""}`}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED}
              onChange={(e) => processFiles(e.target.files)}
              style={{ display: "none" }}
            />
            <div className="up-input-wrapper">
              <span className="upload-icon">📁</span>
              <input
                type="text"
                readOnly
                placeholder="Select multiple files to upload"
                onClick={() => inputRef.current.click()}
              />
              <button className="up-upload-btn" onClick={() => inputRef.current.click()}>
                Upload Files
              </button>
            </div>
          </div>

          {/* List of uploaded files */}
          {files.length > 0 && (
            <div className="up-file-preview-list">
              <p className="file-count">Selected Files ({files.length}):</p>
              <div className="files-scroll-area">
                {files.map((f, i) => (
                  <div key={i} className="file-pill">
                    <span>{f.name}</span>
                    <button onClick={() => removeFile(f.name)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Action Buttons */}
          <div className="up-action-group">
            <button className="btn-secondary" disabled={files.length === 0}>View as Table</button>
            <button className="btn-primary" disabled={files.length === 0}>View as Dashboard</button>
          </div>
        </div>

        {/* Illustration Section */}
        <div className="up-content-right">
          <div className="illustration-placeholder">
            {/* Add your Illustration image or component here */}
            <img src={uploaderImg} alt="Illustration" className="main-illustration" />
            <div className="bg-circle"></div>
          </div>
        </div>
      </main>


      <div className="side-text">See more features —</div>
    </div>
  );
};

export default Uploader;