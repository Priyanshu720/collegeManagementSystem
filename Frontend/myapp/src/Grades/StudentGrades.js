import React, { useState, useEffect } from "react";
import "../index.css";

function StudentGrades() {
  const [grades, setGrades] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch grades
        const gradesResponse = await fetch("http://localhost:8000/grades/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (gradesResponse.ok) {
          const gradesData = await gradesResponse.json();
          setGrades(gradesData);
        }

        // Fetch assignments to get assignment details
        const assignmentsResponse = await fetch("http://localhost:8000/assignments/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          setAssignments(assignmentsData);
        }

      } catch (error) {
        console.error("Error fetching grades data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const getAssignmentDetails = (assignmentId) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    return assignment || { title: "Unknown Assignment", course_id: null };
  };

  const getGradeStats = () => {
    const totalGrades = grades.length;
    const totalPoints = grades.reduce((sum, grade) => sum + grade.points_earned, 0);
    const averageGrade = totalGrades > 0 ? Math.round(totalPoints / totalGrades) : 0;
    
    const gradeDistribution = {
      A: grades.filter(g => g.points_earned >= 90).length,
      B: grades.filter(g => g.points_earned >= 80 && g.points_earned < 90).length,
      C: grades.filter(g => g.points_earned >= 70 && g.points_earned < 80).length,
      D: grades.filter(g => g.points_earned >= 60 && g.points_earned < 70).length,
      F: grades.filter(g => g.points_earned < 60).length
    };

    return {
      total: totalGrades,
      average: averageGrade,
      distribution: gradeDistribution
    };
  };

  const getGradeLetter = (points) => {
    if (points >= 90) return "A";
    if (points >= 80) return "B";
    if (points >= 70) return "C";
    if (points >= 60) return "D";
    return "F";
  };

  const getGradeColor = (points) => {
    if (points >= 90) return "#28a745";
    if (points >= 80) return "#17a2b8";
    if (points >= 70) return "#ffc107";
    if (points >= 60) return "#fd7e14";
    return "#dc3545";
  };

  const stats = getGradeStats();

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div className="loading-spinner">Loading your grades...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div className="page-header">
        <h1 className="page-title">My Grades 📊</h1>
        <span className="page-subtitle">Track your academic performance</span>
      </div>

      {/* Grade Stats */}
      <div className="stats-grid" style={{ marginTop: "20px", marginBottom: "30px" }}>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Grades</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">{stats.average}%</div>
            <div className="stat-label">Average Grade</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-number">{stats.distribution.A}</div>
            <div className="stat-label">A Grades</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{getGradeLetter(stats.average)}</div>
            <div className="stat-label">Overall Grade</div>
          </div>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      <div className="grade-distribution" style={{ marginBottom: "30px" }}>
        <h3>Grade Distribution</h3>
        <div className="distribution-bars">
          {Object.entries(stats.distribution).map(([grade, count]) => (
            <div key={grade} className="distribution-item">
              <div className="grade-label">{grade}</div>
              <div className="grade-bar">
                <div 
                  className="grade-fill" 
                  style={{ 
                    width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                    backgroundColor: getGradeColor(grade === 'A' ? 95 : grade === 'B' ? 85 : grade === 'C' ? 75 : grade === 'D' ? 65 : 55)
                  }}
                ></div>
              </div>
              <div className="grade-count">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grades List */}
      <div className="grades-container">
        <h3>All Grades</h3>
        {grades.length > 0 ? (
          <div className="grades-list">
            {grades.map((grade, index) => {
              const assignment = getAssignmentDetails(grade.submission?.assignment_id);
              return (
                <div key={index} className="grade-card">
                  <div className="grade-header">
                    <div className="grade-info">
                      <h4>{assignment.title}</h4>
                      <p className="grade-date">
                        Graded on: {new Date(grade.graded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="grade-score">
                      <div 
                        className="grade-circle"
                        style={{ 
                          backgroundColor: getGradeColor(grade.points_earned),
                          color: "white"
                        }}
                      >
                        {grade.points_earned}%
                      </div>
                      <div className="grade-letter">{getGradeLetter(grade.points_earned)}</div>
                    </div>
                  </div>
                  
                  {grade.feedback && (
                    <div className="grade-feedback">
                      <h5>Feedback:</h5>
                      <p>{grade.feedback}</p>
                    </div>
                  )}
                  
                  <div className="grade-status">
                    <span className={`status-badge ${grade.is_final ? 'final' : 'draft'}`}>
                      {grade.is_final ? 'Final Grade' : 'Draft Grade'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Grades Yet</h3>
            <p>Your grades will appear here once assignments are graded.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentGrades;
