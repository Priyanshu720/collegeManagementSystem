import React from "react";
import "../index.css";

function CourseCard({ course, refreshCourses }) {
  const token = localStorage.getItem("token"); // JWT token

  const enroll = async () => {
    try {
      const res = await fetch(`http://localhost:8000/courses/enroll/${course.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await res.json();
      alert(data.detail); // enrollment success/failure message
      refreshCourses();   // My Courses list refresh
    } catch (err) {
      console.error("Error enrolling:", err);
      alert("Enrollment failed");
    }
  };

  const getCourseStatus = () => {
    if (!course.is_active) return "Inactive";
    if (course.semester) {
      const currentDate = new Date();
      const semesterYear = course.semester.split(' ')[1];
      const currentYear = currentDate.getFullYear().toString();
      if (semesterYear === currentYear) return "Current";
      return "Upcoming";
    }
    return "Active";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Current": return "#10b981";
      case "Upcoming": return "#3b82f6";
      case "Inactive": return "#6b7280";
      default: return "#10b981";
    }
  };

  const status = getCourseStatus();

  return (
    <div className="enhanced-course-card">
      <div className="course-header">
        <div className="course-title-section">
          <h3 className="course-title">{course.name}</h3>
          <div className="course-credits">{course.credits || 3} Credits</div>
        </div>
        <div 
          className="course-status"
          style={{ backgroundColor: getStatusColor(status) }}
        >
          {status}
        </div>
      </div>

      <div className="course-content">
        <p className="course-description">
          {course.description || "No description available"}
        </p>

        <div className="course-details">
          {course.instructor && (
            <div className="course-detail-item">
              <span className="detail-icon">👨‍🏫</span>
              <span className="detail-text">{course.instructor.username}</span>
            </div>
          )}
          
          {course.schedule && (
            <div className="course-detail-item">
              <span className="detail-icon">🕒</span>
              <span className="detail-text">{course.schedule}</span>
            </div>
          )}
          
          {course.room && (
            <div className="course-detail-item">
              <span className="detail-icon">🏢</span>
              <span className="detail-text">{course.room}</span>
            </div>
          )}
          
          {course.semester && (
            <div className="course-detail-item">
              <span className="detail-icon">📅</span>
              <span className="detail-text">{course.semester}</span>
            </div>
          )}
        </div>
      </div>

      <div className="course-footer">
        <div className="course-actions">
          <button className="action-btn primary" onClick={enroll}>
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;