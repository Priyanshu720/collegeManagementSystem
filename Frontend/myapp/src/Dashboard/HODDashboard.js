import React from "react";
import "../index.css";

function HODDashboard({ user }) {
  const username = (user && user.username) || localStorage.getItem("username") || "HOD";
  
  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome, {username} (HOD)</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px" }}>
        <div className="card fade-in">Finalize Assignments</div>
        <div className="card fade-in">Department Analytics</div>
        <div className="card fade-in">Manage Escalations</div>
      </div>
    </div>
  );
}

export default HODDashboard;
