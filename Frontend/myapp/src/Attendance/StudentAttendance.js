import React, { useState, useEffect } from "react";
import "../index.css";

function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch attendance records
        const attendanceResponse = await fetch("http://localhost:8000/attendance/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setAttendance(attendanceData);
        }

        // Fetch courses to get course names
        const coursesResponse = await fetch("http://localhost:8000/courses/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData);
        }

      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : `Course ${courseId}`;
  };

  const filteredAttendance = selectedCourse === "all" 
    ? attendance 
    : attendance.filter(record => record.course_id === parseInt(selectedCourse));

  const getAttendanceStats = () => {
    const totalRecords = filteredAttendance.length;
    const presentRecords = filteredAttendance.filter(record => record.status === "Present").length;
    const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
    
    return {
      total: totalRecords,
      present: presentRecords,
      absent: totalRecords - presentRecords,
      percentage: attendancePercentage
    };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div className="loading-spinner">Loading attendance records...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div className="page-header">
        <h1 className="page-title">My Attendance 📊</h1>
        <span className="page-subtitle">Track your attendance across all courses</span>
      </div>

      {/* Attendance Stats */}
      <div className="stats-grid" style={{ marginTop: "20px", marginBottom: "30px" }}>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Classes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.present}</div>
            <div className="stat-label">Present</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{stats.absent}</div>
            <div className="stat-label">Absent</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">{stats.percentage}%</div>
            <div className="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Course Filter */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px", fontWeight: "500" }}>Filter by Course:</label>
        <select 
          value={selectedCourse} 
          onChange={(e) => setSelectedCourse(e.target.value)}
          style={{ 
            padding: "8px 12px", 
            borderRadius: "6px", 
            border: "1px solid #ddd",
            fontSize: "14px"
          }}
        >
          <option value="all">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Records */}
      {filteredAttendance.length > 0 ? (
        <div className="attendance-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record, index) => (
                <tr key={index} className="attendance-row">
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{getCourseName(record.course_id)}</td>
                  <td>
                    <span className={`status-badge ${record.status.toLowerCase()}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-small"
                      onClick={() => {
                        // Could add functionality to view details or dispute
                        alert(`Attendance record for ${getCourseName(record.course_id)} on ${new Date(record.date).toLocaleDateString()}`);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Attendance Records</h3>
          <p>No attendance records found for the selected course.</p>
        </div>
      )}
    </div>
  );
}

export default StudentAttendance;
