import React, { useState } from "react";
import "../index.css";

function MarkAttendance({ students, course, onMark }) {
  const [attendanceData, setAttendanceData] = useState(
    students.map(student => ({ id: student.id, name: student.username, status: "Present" }))
  );

  const handleChange = (id, value) => {
    setAttendanceData(prev => prev.map(s => s.id === id ? { ...s, status: value } : s));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onMark({ course, attendance: attendanceData });
    alert("Attendance submitted ✅");
  };

  return (
    <div style={{ padding: "20px", marginTop: "20px" }}>
      <h2>Mark Attendance for {course}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {attendanceData.map(student => (
          <div key={student.id} className="fade-in" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span>{student.name}</span>
            <select value={student.status} onChange={(e) => handleChange(student.id, e.target.value)}>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        ))}
        <button type="submit" className="button">Submit Attendance</button>
      </form>
    </div>
  );
}

export default MarkAttendance;
