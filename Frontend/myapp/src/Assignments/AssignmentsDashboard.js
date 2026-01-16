import React, { useState, useEffect } from "react";
import AssignmentCard from "./AssignmentCard";
import SubmissionForm from "./SubmissionForm";

function AssignmentsDashboard({ role }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedAssignmentObj, setSelectedAssignmentObj] = useState(null);
  const [showGrading, setShowGrading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  // Fetch assignments from backend
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch("http://localhost:8000/assignments/", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAssignments(data);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };
    
    if (token) {
      fetchAssignments();
    }
  }, [token]);

  const handleSubmit = (submission) => {
    console.log("Assignment submitted:", submission);
  };

  const handleGradeSubmission = async (submissionId, points, feedback) => {
    try {
      const response = await fetch("http://localhost:8000/grades/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          submission_id: submissionId,
          points_earned: points,
          feedback: feedback
        })
      });

      if (response.ok) {
        alert("Grade assigned successfully!");
        // Refresh submissions
        if (selectedAssignment) {
          fetchSubmissions(selectedAssignment);
        }
      } else {
        alert("Failed to assign grade");
      }
    } catch (error) {
      console.error("Error assigning grade:", error);
      alert("Error assigning grade");
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`http://localhost:8000/assignments/${assignmentId}/submissions`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
        setSelectedAssignment(assignmentId);
        const assignmentObj = assignments.find(a => a.id === assignmentId);
        setSelectedAssignmentObj(assignmentObj);
        setShowGrading(true);
      } else {
        setError("Failed to fetch submissions");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setError("Error fetching submissions");
    } finally {
      setLoading(false);
    }
  };

  if (showGrading && selectedAssignment) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Grade Submissions for Assignment {selectedAssignment}</h2>
        <p style={{ color: "#666" }}>
          {selectedAssignmentObj?.title || "Assignment"}
        </p>
        <button 
          onClick={() => { setShowGrading(false); setSelectedAssignment(null); setSubmissions([]); }}
          style={{ marginBottom: "20px", padding: "8px 16px", cursor: "pointer" }}
        >
          ← Back to Assignments
        </button>
        
        {loading && <p>Loading submissions...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        
        {submissions.length === 0 && !loading && (
          <p style={{ color: "#999" }}>No submissions yet</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {submissions.map(submission => (
            <GradingCard 
              key={submission.id} 
              submission={submission} 
              onGrade={handleGradeSubmission}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Assignments</h1>
      {role === "student" && assignments.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3>Submit Your Assignments</h3>
          {assignments.map(a => (
            <div key={a.id} style={{ marginBottom: "20px" }}>
              <SubmissionForm 
                assignmentId={a.id} 
                onSubmit={handleSubmit}
                onSuccess={() => console.log("Submission successful")}
              />
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <h2>All Assignments</h2>
        {assignments.length === 0 ? (
          <p style={{ color: "#999" }}>No assignments available</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {assignments.map(a => (
              <div key={a.id} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px" }}>
                <AssignmentCard assignment={a} role={role} />
                {role === "teacher" && (
                  <button 
                    onClick={() => fetchSubmissions(a.id)}
                    style={{
                      marginTop: "10px",
                      padding: "8px 16px",
                      backgroundColor: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    View Submissions ({submissions.filter(s => s.assignment_id === a.id).length})
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Grading Card Component
function GradingCard({ submission, onGrade }) {
  const [points, setPoints] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!points || !feedback) {
      alert("Please fill in both points and feedback");
      return;
    }
    setLoading(true);
    await onGrade(submission.id, parseInt(points), feedback);
    setLoading(false);
    setPoints("");
    setFeedback("");
  };

  const studentName = submission.student?.username || `Student ${submission.student_id}`;
  const studentEmail = submission.student?.email || "N/A";

  return (
    <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
      <div style={{ marginBottom: "10px" }}>
        <h3 style={{ margin: "0 0 5px 0" }}>📝 {studentName}</h3>
        <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>Email: {studentEmail}</p>
      </div>
      
      <div style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
        <strong>Submission Content:</strong>
        <p style={{ margin: "5px 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {submission.content}
        </p>
      </div>

      <div style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
        <strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}
        {submission.is_late && <span style={{ color: "red", marginLeft: "10px" }}>⚠️ LATE</span>}
      </div>
      
      <form onSubmit={handleSubmit} style={{ marginTop: "15px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>
            Points (0-100):
          </label>
          <input 
            type="number" 
            value={points} 
            onChange={(e) => setPoints(e.target.value)}
            placeholder="Enter points"
            min="0"
            max="100"
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>
            Feedback:
          </label>
          <textarea 
            value={feedback} 
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Enter feedback for the student"
            rows="3"
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "inherit" }}
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: "8px 16px",
            backgroundColor: loading ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600"
          }}
        >
          {loading ? "Assigning..." : "Assign Grade"}
        </button>
      </form>
    </div>
  );
}

export default AssignmentsDashboard;
