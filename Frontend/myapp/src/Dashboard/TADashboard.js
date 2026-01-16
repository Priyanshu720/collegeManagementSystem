import React from "react";
import "../index.css";

function TADashboard({ user }) {
  const username = (user && user.username) || localStorage.getItem("username") || "TA";
  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome, {username} (TA)</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px" }}>
        <div className="card fade-in">Review Assignments</div>
        <div className="card fade-in">Assist Attendance</div>
        <div className="card fade-in">Provide Feedback</div>
      </div>
    </div>
  );
}

export default TADashboard;
