import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000";

function AdminResources() {
  const token = localStorage.getItem("token");
  const headersAuth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      // Courses (public or role-gated?) — assume available
      const [rc, rr] = await Promise.all([
        fetch(`${API_BASE}/courses`).then(r => r.json()),
        fetch(`${API_BASE}/reports`, { headers: headersAuth }).then(async r => ({ ok: r.ok, data: await r.json() })),
      ]);
      setCourses(Array.isArray(rc) ? rc : []);
      if (rr.ok) setReports(rr.data); else setReports([]);
    } catch (e) {
      setError("Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">System Resources</h1>
        <span className="page-subtitle">Courses, reports and more</span>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading resources...</div>
      ) : error ? (
        <div className="card card--danger">{error}</div>
      ) : (
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <div className="card">
            <h3>Courses ({courses.length})</h3>
            <div className="activity-list">
              {courses.slice(0, 10).map(c => (
                <div key={c.id} className="activity-item">
                  <div className="activity-content">
                    <div className="activity-title">{c.name}</div>
                    <div className="activity-date">{c.semester || 'N/A'} — credits: {c.credits}</div>
                  </div>
                  <span className="status-badge">{c.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              ))}
              {courses.length === 0 && <div className="no-activity">No courses found</div>}
            </div>
          </div>

          <div className="card">
            <h3>Reports ({reports.length})</h3>
            <div className="activity-list">
              {reports.slice(0, 10).map(r => (
                <div key={r.id} className="activity-item">
                  <div className="activity-content">
                    <div className="activity-title">{r.title}</div>
                    <div className="activity-date">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {reports.length === 0 && <div className="no-activity">No reports found</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminResources;
