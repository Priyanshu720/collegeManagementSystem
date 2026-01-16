import React, { useEffect, useMemo, useState } from "react";
import MarkAttendance from "./MarkAttendance";

const API_BASE = "http://localhost:8000";

function TeacherAttendancePage() {
  const token = localStorage.getItem("token");
  const headersAuth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [students, setStudents] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch courses taught by this teacher (or TA will see all for marking assistance per scope)
  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/courses/teaching`, { headers: headersAuth });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to fetch courses");
      setCourses(json);
      if (json.length > 0) setCourseId(String(json[0].id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (cid) => {
    if (!cid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/courses/${cid}/students`, { headers: headersAuth });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to fetch students");
      setStudents(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (courseId) fetchStudents(courseId); /* eslint-disable-next-line */ }, [courseId]);

  const handleMark = async ({ course, attendance }) => {
    try {
      for (const s of attendance) {
        const payload = { student_id: s.id, course_id: Number(courseId), date: new Date().toISOString().slice(0,10), status: s.status };
        const res = await fetch(`${API_BASE}/attendance/mark`, {
          method: 'POST',
          headers: { ...headersAuth, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.detail || 'Failed to mark');
        }
      }
      alert('Attendance recorded');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div className="page-header">
        <h1 className="page-title">Mark Attendance</h1>
        <span className="page-subtitle">Select a course and record attendance</span>
      </div>

      {error && <div className="card card--danger">{error}</div>}

      <div className="course-filters" style={{ marginTop: 16 }}>
        <div className="filter-row">
          <div className="filter-controls">
            <select className="filter-select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <MarkAttendance students={students} course={courses.find(c => String(c.id) === String(courseId))?.name || ''} onMark={handleMark} />
      )}
    </div>
  );
}

export default TeacherAttendancePage;
