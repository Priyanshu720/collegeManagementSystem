import React, { useState, useEffect } from "react";
import CourseList from "../Courses/CourseList";
import MarkAttendance from "../Attendance/MarkAttendance";
import AssignmentsDashboard from "../Assignments/AssignmentsDashboard";
import TeacherAssignmentReview from "../Assignments/TeacherAssignmentReview";
import BookingsDashboard from "../Bookings/BookingsDashboard";
import "../index.css";

function TeacherDashboard({ user }) {
  const username = (user && user.username) || localStorage.getItem("username") || "Teacher";
  const [activeTab, setActiveTab] = useState("courses");
  
  const renderActiveTab = () => {
    switch (activeTab) {
      case "courses":
        return <CourseList role="teacher" />;
      case "attendance":
        return <AttendanceTab />;
      case "assignments":
        return <AssignmentsDashboard role="teacher" />;
      case "review":
        return <TeacherAssignmentReview />;
      case "bookings":
        return <BookingsDashboard role="teacher" />;
      default:
        return <CourseList role="teacher" />;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className="page-header">
        <h1 className="page-title">Welcome, {username}</h1>
        <span className="page-subtitle">Teaching tools and insights</span>
      </div>
      
      {/* Navigation Tabs */}
      <div className="tab-navigation" style={{ marginTop: "20px", marginBottom: "20px" }}>
        <button 
          className={`tab-btn ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          📚 Manage Courses
        </button>
        <button 
          className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          📝 Mark Attendance
        </button>
        <button 
          className={`tab-btn ${activeTab === "assignments" ? "active" : ""}`}
          onClick={() => setActiveTab("assignments")}
        >
          📊 Grade Assignments
        </button>
        <button 
          className={`tab-btn ${activeTab === "review" ? "active" : ""}`}
          onClick={() => setActiveTab("review")}
        >
          📥 Review Submissions
        </button>
        <button 
          className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          🏢 Approve Bookings
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderActiveTab()}
      </div>
    </div>
  );
}

// Attendance Tab Component
function AttendanceTab() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const token = localStorage.getItem("token");

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("http://localhost:8000/courses/teaching", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCourses(data);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    
    if (token) {
      fetchCourses();
    }
  }, [token]);

  // Fetch students when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      const fetchStudents = async () => {
        try {
          const response = await fetch(`http://localhost:8000/courses/${selectedCourseId}/students`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setStudents(data);
          }
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      };
      
      fetchStudents();
    }
  }, [selectedCourseId, token]);

  const handleCourseChange = (e) => {
    const courseName = e.target.value;
    setSelectedCourse(courseName);
    
    // Find the course ID
    const course = courses.find(c => c.name === courseName);
    if (course) {
      setSelectedCourseId(course.id);
    } else {
      setSelectedCourseId(null);
    }
  };

  const handleMarkAttendance = async (attendanceData) => {
    try {
      // Mark attendance for each student
      const promises = attendanceData.attendance.map(att => 
        fetch("http://localhost:8000/attendance/mark", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            student_id: att.id,
            course_id: selectedCourseId,
            date: new Date().toISOString().split('T')[0], // Today's date
            status: att.status
          })
        })
      );

      const responses = await Promise.all(promises);
      const allSuccessful = responses.every(response => response.ok);
      
      if (allSuccessful) {
        alert("Attendance marked successfully!");
      } else {
        alert("Some attendance records failed to save");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Error marking attendance");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Mark Attendance</h2>
      
      <div style={{ marginBottom: "20px" }}>
        <label>Select Course:</label>
        <select 
          value={selectedCourse} 
          onChange={handleCourseChange}
          style={{ marginLeft: "10px", padding: "5px" }}
        >
          <option value="">Select a course</option>
          {courses.map(course => (
            <option key={course.id} value={course.name}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && students.length > 0 && (
        <MarkAttendance 
          students={students}
          course={selectedCourse}
          onMark={handleMarkAttendance}
        />
      )}
      
      {selectedCourse && students.length === 0 && (
        <p>No students enrolled in this course.</p>
      )}
    </div>
  );
}

export default TeacherDashboard;
