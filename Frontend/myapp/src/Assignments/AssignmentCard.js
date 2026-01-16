import React from "react";
import "../index.css";

function AssignmentCard({ assignment, role }) {
  return (
    <div className="card fade-in" style={{ padding: "15px", width: "300px", marginBottom: "15px" }}>
      <h3>{assignment.title}</h3>
      <p>Course: {assignment.course}</p>
      <p>Deadline: {assignment.deadline}</p>
      <p>Status: <span style={{ color: assignment.status === "Pending" ? "orange" : "green" }}>{assignment.status}</span></p>

      {role === "student" && <p>Uploaded: {assignment.uploaded ? "Yes" : "No"}</p>}
      {role === "ta" && <p>Reviewed: {assignment.reviewed ? "Yes" : "No"}</p>}
      {role === "teacher" && <p>Graded: {assignment.graded ? "Yes" : "No"}</p>}
      {role === "hod" && <p>Final Approval: {assignment.approved ? "Approved" : "Pending"}</p>}
    </div>
  );
}

export default AssignmentCard;
