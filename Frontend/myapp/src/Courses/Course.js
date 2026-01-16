import React, { useState, useEffect, useCallback } from "react";
import CourseDetailsModal from "./CourseDetailsModal";
import "../index.css";

function Course() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [mode, setMode] = useState("my"); // "all" or "my"
  const token = localStorage.getItem("token");

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      let url;
      if (mode === "my") {
        url = "http://localhost:8000/courses/my"; // enrolled courses
      } else {
        url = "http://localhost:8000/courses"; // all courses
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        console.error("Failed to fetch courses:", response.status, response.statusText);
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [token, mode]);

  useEffect(() => {
    if (token) {
      fetchCourses();
    }
  }, [token, fetchCourses]);

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedCourse(null);
  };

  const filteredAndSortedCourses = courses
    .filter(course => {
      // Enhanced search functionality
      const searchLower = searchTerm.toLowerCase().trim();
      if (!searchLower) return true; // Show all if no search term
      
      const matchesSearch = 
        course.name?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        course.instructor?.username?.toLowerCase().includes(searchLower) ||
        course.semester?.toLowerCase().includes(searchLower) ||
        course.room?.toLowerCase().includes(searchLower) ||
        course.schedule?.toLowerCase().includes(searchLower);
      
      const matchesSemester = filterSemester === "all" || course.semester === filterSemester;
      return matchesSearch && matchesSemester;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name?.localeCompare(b.name || "") || 0;
        case "semester":
          return (a.semester || "").localeCompare(b.semester || "");
        case "credits":
          return (b.credits || 0) - (a.credits || 0);
        default:
          return 0;
      }
    });

  const getUniqueSemesters = () => {
    const semesters = courses.map(course => course.semester).filter(Boolean);
    return [...new Set(semesters)];
  };

  const getTotalCredits = () => {
    return courses.reduce((total, course) => total + (course.credits || 0), 0);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div className="loading-spinner">Loading your courses...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div className="page-header">
        <h1 className="page-title">My Courses 📚</h1>
        <span className="page-subtitle">Manage your enrolled courses and track your progress</span>
      </div>

      {/* Toggle buttons */}
      <div style={{ marginBottom: "20px" }}>
        <button
          className={`mode-btn ${mode === "my" ? "active" : ""}`}
          onClick={() => setMode("my")}
        >
          My Courses
        </button>
        <button
          className={`mode-btn ${mode === "all" ? "active" : ""}`}
          onClick={() => setMode("all")}
        >
          All Courses
        </button>
      </div>

      {/* Course Stats */}
      <div className="stats-grid" style={{ marginTop: "20px", marginBottom: "30px" }}>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-number">{courses.length}</div>
            <div className="stat-label">Enrolled Courses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <div className="stat-number">{getTotalCredits()}</div>
            <div className="stat-label">Total Credits</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <div className="stat-number">
              {new Set(courses.map(c => c.instructor?.id).filter(Boolean)).size}
            </div>
            <div className="stat-label">Instructors</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{getUniqueSemesters().length}</div>
            <div className="stat-label">Semesters</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="course-filters" style={{ marginBottom: "30px" }}>
        <div className="filter-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search courses, instructors, descriptions, rooms, or schedules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm ? (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                ✕
              </button>
            ) : (
              <span className="search-icon">🔍</span>
            )}
          </div>
          
          <div className="filter-controls">
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Semesters</option>
              {getUniqueSemesters().map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Sort by Name</option>
              <option value="semester">Sort by Semester</option>
              <option value="credits">Sort by Credits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {(searchTerm || filterSemester !== "all") && (
        <div className="search-results-info" style={{ marginBottom: "20px" }}>
          <span className="search-results-text">
            {filteredAndSortedCourses.length} of {courses.length} courses
            {searchTerm && ` matching "${searchTerm}"`}
            {filterSemester !== "all" && ` in ${filterSemester}`}
          </span>
        </div>
      )}

      {/* Course Grid */}
      <div className="course-grid">
        {filteredAndSortedCourses.length > 0 ? (
          filteredAndSortedCourses.map(course => (
            <EnhancedCourseCard
              key={course.id}
              course={course}
              mode={mode}
              onClick={() => handleCourseClick(course)}
              onEnroll={fetchCourses}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No Courses Found</h3>
            <p>
              {searchTerm || filterSemester !== "all" 
                ? "No courses match your current filters. Try adjusting your search criteria."
                : mode === "my" 
                  ? "You haven't enrolled in any courses yet. Contact your advisor to get started."
                  : "No courses are available at the moment."
              }
            </p>
          </div>
        )}
      </div>

      {/* Course Details Modal */}
      {showDetailsModal && selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

// Enhanced Course Card Component
function EnhancedCourseCard({ course, mode, onClick, onEnroll }) {
  const token = localStorage.getItem("token");

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

  const handleEnroll = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`http://localhost:8000/courses/enroll/${course.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.detail || "Successfully enrolled in course!");
        if (onEnroll) onEnroll(); // Refresh the course list
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to enroll in course");
      }
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("Enrollment failed. Please try again.");
    }
  };

  const status = getCourseStatus();

  return (
    <div className="enhanced-course-card" onClick={onClick}>
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
        {mode === "my" ? (
          <div className="course-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "75%" }}></div>
            </div>
            <span className="progress-text">75% Complete</span>
          </div>
        ) : (
          <div className="course-info">
            <span className="course-info-text">
              Max Students: {course.max_students || 30}
            </span>
          </div>
        )}
        
        <div className="course-actions">
          {mode === "my" ? (
            <button className="action-btn primary" onClick={(e) => { e.stopPropagation(); onClick(); }}>
              View Details
            </button>
          ) : (
            <button className="action-btn primary" onClick={handleEnroll}>
              Enroll Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Course;