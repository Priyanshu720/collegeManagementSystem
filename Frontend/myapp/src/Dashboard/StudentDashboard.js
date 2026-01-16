import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Student";

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Fetch courses
        const coursesResponse = await fetch("http://localhost:8000/courses/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData);
        }

        // Fetch assignments
        const assignmentsResponse = await fetch("http://localhost:8000/assignments/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          setAssignments(assignmentsData);
        }

        // Fetch attendance
        const attendanceResponse = await fetch("http://localhost:8000/attendance/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setAttendance(attendanceData);
        }

        // Fetch bookings
        const bookingsResponse = await fetch("http://localhost:8000/bookings/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(bookingsData);
        }

        // Fetch grades
        const gradesResponse = await fetch("http://localhost:8000/grades/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (gradesResponse.ok) {
          const gradesData = await gradesResponse.json();
          setGrades(gradesData);
        }

      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStudentData();
    }
  }, [token]);

  const handleClick = (path) => {
    navigate(path);
  };

  const getUpcomingAssignments = useCallback(() => {
    const now = new Date();
    return assignments.filter(assignment => {
      if (!assignment.due_date) return false;
      const dueDate = new Date(assignment.due_date);
      return dueDate > now;
    }).slice(0, 3);
  }, [assignments]);

  const getRecentAttendance = useCallback(() => {
    return attendance.slice(0, 5);
  }, [attendance]);

  const getPendingBookings = useCallback(() => {
    return bookings.filter(booking => booking.status === "pending");
  }, [bookings]);

  const getAverageGrade = useCallback(() => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((sum, grade) => sum + grade.points_earned, 0);
    return Math.round(total / grades.length);
  }, [grades]);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div className="loading-spinner">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {username}! 👋</h1>
        <span className="page-subtitle">Here's your academic overview</span>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginTop: "20px", marginBottom: "30px" }}>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-number">{courses.length}</div>
            <div className="stat-label">Enrolled Courses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-number">{getUpcomingAssignments().length}</div>
            <div className="stat-label">Upcoming Assignments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{getAverageGrade()}%</div>
            <div className="stat-label">Average Grade</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-number">{getPendingBookings().length}</div>
            <div className="stat-label">Pending Bookings</div>
          </div>
        </div>
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-2" style={{ marginTop: "20px" }}>
        <div className="card card--primary fade-in" onClick={() => handleClick("/courses")}>
          <div className="card-icon">📚</div>
          <div className="card-content">
            <h3>My Courses</h3>
            <p>{courses.length} enrolled courses</p>
            <div className="card-arrow">→</div>
          </div>
        </div>
        
        <div className="card card--info fade-in" onClick={() => handleClick("/assignments")}>
          <div className="card-icon">📝</div>
          <div className="card-content">
            <h3>Assignments</h3>
            <p>{getUpcomingAssignments().length} upcoming deadlines</p>
            <div className="card-arrow">→</div>
          </div>
        </div>
        
        <div className="card card--secondary fade-in" onClick={() => handleClick("/submit-assignment")}>
          <div className="card-icon">📤</div>
          <div className="card-content">
            <h3>Submit Assignment</h3>
            <p>Upload your work</p>
            <div className="card-arrow">→</div>
          </div>
        </div>
        
        <div className="card card--success fade-in" onClick={() => handleClick("/attendance")}>
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>Attendance</h3>
            <p>View your attendance records</p>
            <div className="card-arrow">→</div>
          </div>
        </div>
        
        <div className="card card--warning fade-in" onClick={() => handleClick("/bookings")}>
          <div className="card-icon">🏢</div>
          <div className="card-content">
            <h3>Bookings</h3>
            <p>{getPendingBookings().length} pending requests</p>
            <div className="card-arrow">→</div>
          </div>
        </div>
        
        <div className="card card--danger fade-in" onClick={() => handleClick("/grades")}>
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Grades</h3>
            <p>Average: {getAverageGrade()}%</p>
            <div className="card-arrow">→</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity" style={{ marginTop: "30px" }}>
        <h2>Recent Activity</h2>
        <div className="activity-grid">
          {getUpcomingAssignments().length > 0 && (
            <div className="activity-card">
              <h4>📝 Upcoming Assignments</h4>
              {getUpcomingAssignments().map(assignment => (
                <div key={assignment.id} className="activity-item">
                  <span className="activity-title">{assignment.title}</span>
                  <span className="activity-date">
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {getRecentAttendance().length > 0 && (
            <div className="activity-card">
              <h4>✅ Recent Attendance</h4>
              {getRecentAttendance().map((record, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-title">{record.date}</span>
                  <span className={`activity-status ${record.status.toLowerCase()}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;