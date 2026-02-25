import React from "react";
import "./Viewer.css";

const Viewer = ({ logo, ajalabsblack, handleLogout }) => (
  <div className="viewer-dashboard">
    <nav className="viewer-nav">
      <img src={ajalabsblack} alt="Ajalabs" className="viewer-logo-left" />
      <div className="viewer-nav-right">
        <button onClick={handleLogout} className="viewer-logout">Logout</button>
        <img src={logo} alt="JK Cement" className="viewer-logo-right-animate" />
      </div>
    </nav>
    <div className="viewer-reports">
      <h2>Live Reports</h2>
      <div className="chart-placeholder">Chart Data Visualization</div>
    </div>
  </div>
);
export default Viewer;