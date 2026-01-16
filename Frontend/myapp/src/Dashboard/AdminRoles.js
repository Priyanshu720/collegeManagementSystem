import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000";

function AdminRoles() {
  const token = localStorage.getItem("token");
  const headersAuth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Note: Roles are enums in backend; creation/deletion may not be supported without migrations.
  // We'll present them read-only with a note. The UI will allow mapping/renaming if future backend supports.

  const fetchRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/users/roles/list`, { headers: headersAuth });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to fetch roles");
      setRoles(json.roles || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Roles</h1>
        <span className="page-subtitle">List of available roles</span>
      </div>
      {loading ? (
        <div className="loading-spinner">Loading roles...</div>
      ) : error ? (
        <div className="card card--danger">{error}</div>
      ) : (
        <div className="card" style={{ marginTop: 16 }}>
          <ul>
            {roles.map((r) => (
              <li key={r} style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.toUpperCase()}</li>
            ))}
          </ul>
          <div style={{ marginTop: 12, color: '#6b7280' }}>
            Roles are defined as enums in the backend and cannot be created or deleted dynamically without migrations.
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRoles;
