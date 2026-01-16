import React, { useEffect, useState, useCallback } from "react";
import CourseCard from "./CourseCard";

function CourseList({ role = "student" }) {
  const [courses, setCourses] = useState([]);
  const [mode, setMode] = useState("all"); // "all" or "my"
  const token = localStorage.getItem("token"); // JWT token

  const fetchCourses = useCallback(() => {
    let url;
    if (role === "teacher") {
      url = mode === "my" 
        ? "http://localhost:8000/courses/teaching" // courses taught by teacher
        : "http://localhost:8000/courses"; // all courses
    } else {
      url = mode === "my"
        ? "http://localhost:8000/courses/my" // enrolled courses
        : "http://localhost:8000/courses"; // all courses
    }

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.error("Error fetching courses:", err));
  }, [token, mode, role]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div>
      {/* Toggle buttons */}
      <div style={{ marginBottom: "15px" }}>
        <button
          className={`mode-btn ${mode === "all" ? "active" : ""}`}
          onClick={() => setMode("all")}
        >
          All Courses
        </button>
        <button
          className={`mode-btn ${mode === "my" ? "active" : ""}`}
          onClick={() => setMode("my")}
        >
          My Courses
        </button>
      </div>

      {/* Courses list */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {courses.length > 0 ? (
          courses.map(c => (
            <CourseCard key={c.id} course={c} refreshCourses={fetchCourses} />
          ))
        ) : (
          <p>{mode === "my" ? "No courses enrolled yet." : "No courses available."}</p>
        )}
      </div>
    </div>
  );
}

export default CourseList;