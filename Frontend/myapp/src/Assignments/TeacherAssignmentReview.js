import React, { useState, useEffect, useCallback } from "react";

function TeacherAssignmentReview() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [teacherNotes, setTeacherNotes] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem("token");

  // Fetch teacher's courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("http://localhost:8000/courses/teaching", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCourses(data);
          if (data.length > 0) {
            setSelectedCourse(data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    if (token) {
      fetchCourses();
    }
  }, [token]);

  const fetchSubmissions = useCallback(async (courseId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`http://localhost:8000/submissions/course/${courseId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        setError("Failed to fetch submissions");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setError("Error fetching submissions");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch submissions for selected course
  useEffect(() => {
    if (selectedCourse) {
      fetchSubmissions(selectedCourse);
    }
  }, [selectedCourse, fetchSubmissions]);

  const handleMarkChecked = async (submissionId) => {
    setUpdatingId(submissionId);
    try {
      const response = await fetch(
        `http://localhost:8000/submissions/submission/${submissionId}/mark-checked`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            teacher_notes: teacherNotes || null
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubmissions(submissions.map(s => s.id === submissionId ? data : s));
        setSelectedSubmission(null);
        setTeacherNotes("");
        alert("✅ Submission marked as checked!");
      } else {
        alert("❌ Failed to mark submission");
      }
    } catch (error) {
      console.error("Error marking submission:", error);
      alert("❌ Error marking submission");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkPending = async (submissionId) => {
    setUpdatingId(submissionId);
    try {
      const response = await fetch(
        `http://localhost:8000/submissions/submission/${submissionId}/mark-pending`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubmissions(submissions.map(s => s.id === submissionId ? data : s));
        setSelectedSubmission(null);
        alert("✅ Submission marked as pending!");
      } else {
        alert("❌ Failed to mark submission");
      }
    } catch (error) {
      console.error("Error marking submission:", error);
      alert("❌ Error marking submission");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownload = async (submissionId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/submissions/submission/${submissionId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = submissions.find(s => s.id === submissionId)?.file_name || "submission";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("❌ Failed to download file");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("❌ Error downloading file");
    }
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

  const pendingCount = submissions.filter(s => s.status === "pending").length;

  return (
    <div style={{ padding: "20px" }}>
      <div className="page-header">
        <h1 className="page-title">📥 Review Student Assignments</h1>
        <span className="page-subtitle">Check and mark student submissions</span>
      </div>

      {/* Course Selection */}
      <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
          Select Course:
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          style={{
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            minWidth: "300px"
          }}
        >
          <option value="">-- Select a course --</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Submissions List */}
      {selectedCourse && (
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0 }}>
              Submissions ({submissions.length})
              {pendingCount > 0 && (
                <span style={{
                  marginLeft: "12px",
                  padding: "4px 8px",
                  backgroundColor: "#fca5a5",
                  color: "#7f1d1d",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}>
                  {pendingCount} Pending
                </span>
              )}
            </h2>
          </div>

          {loading && <p>Loading submissions...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {submissions.length === 0 ? (
            <p style={{ color: "#999" }}>No submissions for this course yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {submissions.map(submission => (
                <div
                  key={submission.id}
                  style={{
                    padding: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: submission.status === "pending" ? "#fef3c7" : "#f9fafb"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>
                        👤 {submission.student?.username || `Student ${submission.student_id}`}
                      </h3>
                      <p style={{ margin: "0", fontSize: "12px", color: "#6b7280" }}>
                        {submission.student?.email || "N/A"}
                      </p>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>

                  <div style={{ marginBottom: "12px", fontSize: "12px", color: "#6b7280" }}>
                    <p style={{ margin: "0 0 4px 0" }}>
                      📅 Submitted: {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                    {submission.checked_at && (
                      <p style={{ margin: "0" }}>
                        ✓ Checked: {new Date(submission.checked_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {submission.file_name && (
                    <div style={{ marginBottom: "12px" }}>
                      <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600" }}>
                        📎 File: {submission.file_name}
                      </p>
                      <button
                        onClick={() => handleDownload(submission.id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  )}

                  {submission.teacher_notes && (
                    <div style={{
                      marginBottom: "12px",
                      padding: "8px",
                      backgroundColor: "#fff",
                      borderLeft: "3px solid #f59e0b",
                      fontSize: "12px"
                    }}>
                      <strong>Your Notes:</strong>
                      <p style={{ margin: "4px 0 0 0" }}>{submission.teacher_notes}</p>
                    </div>
                  )}

                  {submission.status === "pending" && (
                    <div style={{ marginTop: "12px" }}>
                      <button
                        onClick={() => setSelectedSubmission(submission.id)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        ✓ Mark as Checked
                      </button>
                    </div>
                  )}

                  {submission.status === "checked" && (
                    <div style={{ marginTop: "12px" }}>
                      <button
                        onClick={() => handleMarkPending(submission.id)}
                        disabled={updatingId === submission.id}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: updatingId === submission.id ? "#ccc" : "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: updatingId === submission.id ? "not-allowed" : "pointer",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        ↩️ Mark as Pending
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mark as Checked Modal */}
      {selectedSubmission && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="card" style={{ padding: "20px", maxWidth: "500px", width: "90%" }}>
            <h2 style={{ marginTop: 0 }}>✓ Mark Submission as Checked</h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                Add Notes (optional):
              </label>
              <textarea
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="Add any feedback or notes for the student..."
                rows="4"
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

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleMarkChecked(selectedSubmission)}
                disabled={updatingId === selectedSubmission}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: updatingId === selectedSubmission ? "#ccc" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: updatingId === selectedSubmission ? "not-allowed" : "pointer",
                  fontWeight: "600"
                }}
              >
                {updatingId === selectedSubmission ? "Updating..." : "✓ Mark as Checked"}
              </button>
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setTeacherNotes("");
                }}
                disabled={updatingId === selectedSubmission}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: updatingId === selectedSubmission ? "not-allowed" : "pointer",
                  fontWeight: "600"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherAssignmentReview;
