import React from "react";
import "./Reviewer.css";

const Reviewer = ({ logo, ajalabsblack, handleLogout }) => (
  <div className="reviewer-dashboard">
    <nav className="reviewer-nav">
      <img src={ajalabsblack} alt="Ajalabs" className="reviewer-logo-left" />
      <div className="reviewer-nav-right">
        <button onClick={handleLogout} className="reviewer-logout">Sign Out</button>
        <img src={logo} alt="JK Cement" className="reviewer-logo-right-animate" />
      </div>
    </nav>
    <div className="reviewer-content">
      <h2>Pending Approvals</h2>
      <table className="review-table">
        <thead>
          <tr><th>Order ID</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td>#1002</td><td>Pending</td><td><button>Approve</button></td></tr>
        </tbody>
      </table>
    </div>
  </div>
);
export default Reviewer;