import React, { useState, useEffect, useCallback, useMemo } from "react";
import "../index.css";

function CourseDetailsModal({ course, onClose }) {
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch assignments for this course
        const assignmentsResponse = await fetch("http://localhost:8000/assignments/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (assignmentsResponse.ok) {
          const allAssignments = await assignmentsResponse.json();
          const courseAssignments = allAssignments.filter(a => a.course_id === course.id);
          setAssignments(courseAssignments);
        }

        // Fetch attendance for this course
        const attendanceResponse = await fetch("http://localhost:8000/attendance/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (attendanceResponse.ok) {
          const allAttendance = await attendanceResponse.json();
          const courseAttendance = allAttendance.filter(a => a.course_id === course.id);
          setAttendance(courseAttendance);
        }

        // Fetch grades for this course
        const gradesResponse = await fetch("http://localhost:8000/grades/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (gradesResponse.ok) {
          const allGrades = await gradesResponse.json();
          setGrades(allGrades); // Store all grades initially
        }

      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (course) {
      fetchCourseDetails();
    }
  }, [course, token]);

  // Filter grades for this course based on assignments
  const courseGrades = useMemo(() => {
    if (assignments.length === 0 || grades.length === 0) return [];
    return grades.filter(grade => 
      grade.submission?.assignment_id && 
      assignments.some(assignment => assignment.id === grade.submission.assignment_id)
    );
  }, [assignments, grades]);

  const getAttendanceStats = useCallback(() => {
    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(a => a.status === "Present").length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
    
    return {
      total: totalClasses,
      present: presentClasses,
      absent: totalClasses - presentClasses,
      percentage: attendancePercentage
    };
  }, [attendance]);

  const getGradeStats = useCallback(() => {
    if (courseGrades.length === 0) return { average: 0, total: 0 };
    const total = courseGrades.reduce((sum, grade) => sum + grade.points_earned, 0);
    const average = Math.round(total / courseGrades.length);
    return { average, total: courseGrades.length };
  }, [courseGrades]);

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

  const attendanceStats = getAttendanceStats();
  const gradeStats = getGradeStats();

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner">Loading course details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content course-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{course.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Course Overview */}
          <div className="course-overview">
            <div className="course-info-grid">
              <div className="info-item">
                <span className="info-label">Instructor</span>
                <span className="info-value">{course.instructor?.username || "TBA"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Credits</span>
                <span className="info-value">{course.credits}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Semester</span>
                <span className="info-value">{course.semester || "TBA"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Schedule</span>
                <span className="info-value">{course.schedule || "TBA"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Room</span>
                <span className="info-value">{course.room || "TBA"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Max Students</span>
                <span className="info-value">{course.max_students}</span>
              </div>
            </div>
            
            <div className="course-description-section">
              <h3>Description</h3>
              <p>{course.description || "No description available for this course."}</p>
            </div>
          </div>

          {/* Course Stats */}
          <div className="course-stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <div className="stat-number">{assignments.length}</div>
                <div className="stat-label">Assignments</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{attendanceStats.percentage}%</div>
                <div className="stat-label">Attendance</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">{gradeStats.average}%</div>
                <div className="stat-label">Average Grade</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-number">{getUpcomingAssignments().length}</div>
                <div className="stat-label">Upcoming</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="course-activity">
            <div className="activity-section">
              <h3>📝 Upcoming Assignments</h3>
              {getUpcomingAssignments().length > 0 ? (
                <div className="activity-list">
                  {getUpcomingAssignments().map(assignment => (
                    <div key={assignment.id} className="activity-item">
                      <div className="activity-content">
                        <span className="activity-title">{assignment.title}</span>
                        <span className="activity-date">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="activity-status">
                        <span className="status-badge pending">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-activity">No upcoming assignments</p>
              )}
            </div>

            <div className="activity-section">
              <h3>✅ Recent Attendance</h3>
              {getRecentAttendance().length > 0 ? (
                <div className="activity-list">
                  {getRecentAttendance().map((record, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-content">
                        <span className="activity-title">{record.date}</span>
                      </div>
                      <div className="activity-status">
                        <span className={`status-badge ${record.status.toLowerCase()}`}>
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-activity">No attendance records</p>
              )}
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="detailed-stats">
            <div className="stats-section">
              <h3>📊 Attendance Breakdown</h3>
              <div className="stats-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Total Classes</span>
                  <span className="breakdown-value">{attendanceStats.total}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Present</span>
                  <span className="breakdown-value present">{attendanceStats.present}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Absent</span>
                  <span className="breakdown-value absent">{attendanceStats.absent}</span>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h3>📈 Grade Summary</h3>
              <div className="stats-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Total Grades</span>
                  <span className="breakdown-value">{gradeStats.total}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Average</span>
                  <span className="breakdown-value">{gradeStats.average}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailsModal;

