import React, { useState } from "react";
import "../index.css";

function SubmissionForm({ assignmentId, onSubmit, onSuccess }) {
  const [content, setContent] = useState("");
  const [filePath, setFilePath] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setMessage("Please provide submission content");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`http://localhost:8000/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim(),
          file_path: filePath || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage("✅ Assignment submitted successfully!");
        setContent("");
        setFilePath("");
        if (onSuccess) onSuccess(data);
        if (onSubmit) onSubmit(data);
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.detail || "Failed to submit"}`);
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      setMessage("❌ Error submitting assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", marginTop: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h2>Submit Assignment</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "500px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>
            Submission Content *
          </label>
          <textarea
            placeholder="Enter your submission content or notes..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="5"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "14px"
            }}
            required
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>
            File Path (optional)
          </label>
          <input
            type="text"
            placeholder="e.g., /uploads/assignment.pdf"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600"
          }}
        >
          {loading ? "Submitting..." : "Submit Assignment"}
        </button>
      </form>
      {message && (
        <p style={{
          marginTop: "10px",
          fontWeight: "bold",
          color: message.includes("✅") ? "green" : "red"
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default SubmissionForm;
