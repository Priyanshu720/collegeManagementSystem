import React from "react";
import "../index.css";

function AttendanceTable({ attendance }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Attendance Records</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
        <thead>
          <tr style={{ background: "#6c63ff", color: "white" }}>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Course</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((record, index) => (
            <tr key={index} className="fade-in">
              <td style={tdStyle}>{record.date}</td>
              <td style={tdStyle}>{record.course}</td>
              <td style={{ ...tdStyle, color: record.status === "Present" ? "green" : "red" }}>
                {record.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: "10px", textAlign: "left" };
const tdStyle = { padding: "10px", borderBottom: "1px solid #ddd" };

export default AttendanceTable;
