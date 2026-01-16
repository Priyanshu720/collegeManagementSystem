import React, { useState, useEffect } from "react";

function StudentAssignmentUpload() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [file, setFile] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success or error
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch enrolled courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("http://localhost:8000/submissions/my-courses", {
          headers: { Authorization: `Bearer ${token}` }
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

  // Fetch student's submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch("http://localhost:8000/submissions/my-submissions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
        const submissionsData = await response.json();
        setSubmissions(submissionsData);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };

    if (token) {
      fetchSubmissions();
    }
  }, [token]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage("❌ Only PDF and Image files (JPEG, PNG) are allowed");
        setMessageType("error");
        setFile(null);
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setMessage("❌ File size must be less than 10MB");
        setMessageType("error");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCourse) {
      setMessage("❌ Please select a course");
      setMessageType("error");
      return;
    }

    if (!file) {
      setMessage("❌ Please select a file to upload");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("course_id", selectedCourse);
      formData.append("file", file);
      if (content) {
        formData.append("content", content);
      }

      const response = await fetch("http://localhost:8000/submissions/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setMessage("✅ Assignment submitted successfully!");
        setMessageType("success");
        setFile(null);
        setContent("");
        setSelectedCourse("");

        // Refresh submissions
        const submissionsResponse = await fetch("http://localhost:8000/submissions/my-submissions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setSubmissions(submissionsData);
        }
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.detail || "Failed to submit assignment"}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error uploading assignment:", error);
      setMessage("❌ Error uploading assignment");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === parseInt(courseId));
    return course ? course.name : "Unknown Course";
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: "#fff3cd", color: "#856404", text: "⏳ Pending" },
      checked: { bg: "#d4edda", color: "#155724", text: "✅ Checked" },
      graded: { bg: "#cfe2ff", color: "#084298", text: "📊 Graded" }
    };
    const style = statusStyles[status] || statusStyles.pending;
    return (
      <span style={{
        padding: "4px 8px",
        borderRadius: "4px",
        backgroundColor: style.bg,
        color: style.color,
        fontWeight: "600",
        fontSize: "12px"
      }}>
        {style.text}
      </span>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className="page-header">
        <h1 className="page-title">📤 Submit Assignment</h1>
        <span className="page-subtitle">Upload your assignment for a course</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
        {/* Upload Form */}
        <div className="card" style={{ padding: "20px" }}>
          <h2 style={{ marginTop: 0 }}>Upload Assignment</h2>

          {message && (
            <div style={{
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "16px",
              backgroundColor: messageType === "success" ? "#d4edda" : "#f8d7da",
              color: messageType === "success" ? "#155724" : "#721c24",
              border: `1px solid ${messageType === "success" ? "#c3e6cb" : "#f5c6cb"}`
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Course Selection */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>
                Select Course *
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
                required
              >
                <option value="">-- Select a course --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>
                Upload File (PDF or Image) *
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px dashed #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
                required
              />
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                Supported: PDF, JPEG, PNG (Max 10MB)
              </p>
              {file && (
                <p style={{ fontSize: "12px", color: "#10b981", marginTop: "4px" }}>
                  ✓ Selected: {file.name}
                </p>
              )}
            </div>

            {/* Additional Notes */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>
                Additional Notes (optional)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add any notes or comments about your submission..."
                rows="3"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: loading ? "#ccc" : "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              {loading ? "Uploading..." : "📤 Submit Assignment"}
            </button>
          </form>
        </div>

        {/* Submissions History */}
        <div className="card" style={{ padding: "20px" }}>
          <h2 style={{ marginTop: 0 }}>📋 Your Submissions</h2>
          <button
            onClick={() => setShowSubmissions(!showSubmissions)}
            style={{
              marginBottom: "12px",
              padding: "8px 12px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            {showSubmissions ? "Hide" : "Show"} Submissions ({submissions.length})
          </button>

          {showSubmissions && (
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {submissions.length === 0 ? (
                <p style={{ color: "#999" }}>No submissions yet</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {submissions.map(submission => (
                    <div
                      key={submission.id}
                      style={{
                        padding: "12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        backgroundColor: "#f9fafb"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                        <div>
                          <p style={{ margin: "0 0 4px 0", fontWeight: "600", fontSize: "14px" }}>
                            {getCourseName(submission.course_id)}
                          </p>
                          <p style={{ margin: "0", fontSize: "12px", color: "#6b7280" }}>
                            {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>

                      {submission.file_name && (
                        <p style={{ margin: "8px 0", fontSize: "12px", color: "#4f46e5" }}>
                          📎 {submission.file_name}
                        </p>
                      )}

                      {submission.teacher_notes && (
                        <div style={{
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "#fff",
                          borderLeft: "3px solid #f59e0b",
                          fontSize: "12px"
                        }}>
                          <strong>Teacher Notes:</strong>
                          <p style={{ margin: "4px 0 0 0" }}>{submission.teacher_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentAssignmentUpload;
