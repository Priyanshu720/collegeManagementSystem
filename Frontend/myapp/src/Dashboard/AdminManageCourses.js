import React, { useEffect, useState, useMemo } from "react";

const API_BASE = "http://localhost:8000";

function AdminManageCourses() {
  const token = localStorage.getItem("token");
  const headersAuth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructor_id: "",
    schedule: "",
    credits: 3,
    semester: "",
    room: "",
    max_students: 30,
    is_active: true,
  });

  const [formErrors, setFormErrors] = useState({});

  // Fetch all courses
  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/courses`, { headers: headersAuth });
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single course for editing
  const fetchCourseForEdit = async (courseId) => {
    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}`, { headers: headersAuth });
      if (!res.ok) throw new Error("Failed to fetch course");
      const data = await res.json();
      setFormData({
        name: data.name || "",
        description: data.description || "",
        instructor_id: data.instructor_id || "",
        schedule: data.schedule || "",
        credits: data.credits || 3,
        semester: data.semester || "",
        room: data.room || "",
        max_students: data.max_students || 30,
        is_active: data.is_active !== undefined ? data.is_active : true,
      });
      setEditingId(courseId);
      setShowForm(true);
    } catch (e) {
      setError(e.message);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name || formData.name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters";
    }
    if (formData.name && formData.name.length > 100) {
      errors.name = "Name must be at most 100 characters";
    }
    if (formData.credits < 1 || formData.credits > 10) {
      errors.credits = "Credits must be between 1 and 10";
    }
    if (formData.max_students < 1 || formData.max_students > 1000) {
      errors.max_students = "Max students must be between 1 and 1000";
    }
    if (formData.schedule && formData.schedule.length > 100) {
      errors.schedule = "Schedule must be at most 100 characters";
    }
    if (formData.semester && formData.semester.length > 50) {
      errors.semester = "Semester must be at most 50 characters";
    }
    if (formData.room && formData.room.length > 50) {
      errors.room = "Room must be at most 50 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description || null,
        instructor_id: formData.instructor_id ? parseInt(formData.instructor_id) : null,
        schedule: formData.schedule || null,
        credits: parseInt(formData.credits),
        semester: formData.semester || null,
        room: formData.room || null,
        max_students: parseInt(formData.max_students),
        is_active: formData.is_active,
      };

      let res;
      if (editingId) {
        // Update
        res = await fetch(`${API_BASE}/courses/admin/${editingId}`, {
          method: "PUT",
          headers: { ...headersAuth, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        res = await fetch(`${API_BASE}/courses/admin`, {
          method: "POST",
          headers: { ...headersAuth, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save course");
      }

      setSuccess(editingId ? "Course updated successfully" : "Course created successfully");
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        instructor_id: "",
        schedule: "",
        credits: 3,
        semester: "",
        room: "",
        max_students: 30,
        is_active: true,
      });
      await fetchCourses();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      instructor_id: "",
      schedule: "",
      credits: 3,
      semester: "",
      room: "",
      max_students: 30,
      is_active: true,
    });
    setFormErrors({});
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Courses</h1>
        <span className="page-subtitle">Create and edit courses</span>
      </div>

      {success && (
        <div className="card card--success" style={{ marginBottom: 16 }}>
          {success}
        </div>
      )}

      {error && (
        <div className="card card--danger" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!showForm && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Create New Course
          </button>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? "Edit Course" : "Create New Course"}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Name */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Course Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., CS101 - Intro to CS"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: formErrors.name ? "2px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.name && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.name}</div>}
              </div>

              {/* Credits */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Credits (1-10) *
                </label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: formErrors.credits ? "2px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.credits && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.credits}</div>}
              </div>

              {/* Schedule */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Schedule
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  placeholder="e.g., Mon, Wed 10:00-11:30"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: formErrors.schedule ? "2px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.schedule && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.schedule}</div>}
              </div>

              {/* Semester */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Semester
                </label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  placeholder="e.g., Fall 2025"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: formErrors.semester ? "2px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.semester && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.semester}</div>}
              </div>

              {/* Room */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Room
                </label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="e.g., Room A-101"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: formErrors.room ? "2px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.room && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.room}</div>}
              </div>

              {/* Max Students */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Max Students (1-1000) *
                </label>
                <input
                  type="number"
                  name="max_students"
                  value={formData.max_students}
                  onChange={handleInputChange}
                  min="1"
                  max="1000"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: formErrors.max_students ? "2px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.max_students && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{formErrors.max_students}</div>}
              </div>

              {/* Instructor ID */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Instructor ID (optional)
                </label>
                <input
                  type="number"
                  name="instructor_id"
                  value={formData.instructor_id}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Must be a TEACHER or HOD</div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Course description..."
                rows="4"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Is Active */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontWeight: 600 }}>Active</span>
              </label>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Saving..." : editingId ? "Update Course" : "Create Course"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      {!showForm && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Courses ({courses.length})</h2>
          {loading ? (
            <div className="loading-spinner">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="no-activity">No courses found</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Name</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Semester</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Schedule</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Credits</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Max Students</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Status</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: 12 }}>{course.name}</td>
                      <td style={{ padding: 12 }}>{course.semester || "N/A"}</td>
                      <td style={{ padding: 12 }}>{course.schedule || "N/A"}</td>
                      <td style={{ padding: 12 }}>{course.credits}</td>
                      <td style={{ padding: 12 }}>{course.max_students}</td>
                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: course.is_active ? "#d1fae5" : "#fee2e2",
                            color: course.is_active ? "#065f46" : "#991b1b",
                          }}
                        >
                          {course.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <button
                          onClick={() => fetchCourseForEdit(course.id)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminManageCourses;
