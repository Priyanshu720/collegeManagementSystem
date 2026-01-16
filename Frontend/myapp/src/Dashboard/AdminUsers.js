import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000";

function AdminUsers() {
  const token = localStorage.getItem("token");
  const [roles, setRoles] = useState([]);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // view | edit
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const headersAuth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/roles/list`, { headers: headersAuth });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to fetch roles");
      setRoles(json.roles || []);
    } catch (e) {
      console.error(e);
      setRoles(["student", "ta", "teacher", "hod", "admin"]);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (role) params.set("role", role);
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      const res = await fetch(`${API_BASE}/users?${params.toString()}`, {
        headers: headersAuth,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to fetch users");
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, role, status, page, pageSize]);

  const openView = (user) => {
    setSelected(user);
    setModalMode("view");
    setModalOpen(true);
  };
  const openEdit = (user) => {
    setSelected({ ...user });
    setModalMode("edit");
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setSelected(null); };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users/${selected.id}`, {
        method: "PATCH",
        headers: { ...headersAuth, "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selected.username,
          email: selected.email,
          role: typeof selected.role === 'string' ? selected.role : selected.role?.value,
          status: selected.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Update failed");
      closeModal();
      fetchUsers();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Delete user ${user.username}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}`, {
        method: "DELETE",
        headers: headersAuth,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || "Delete failed");
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / pageSize));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Users</h1>
        <span className="page-subtitle">View, edit, and remove users</span>
      </div>

      <div className="course-filters" style={{ marginTop: 16 }}>
        <div className="filter-row">
          <div className="search-box">
            <input className="search-input" placeholder="Search by email or username" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
            <span className="search-icon">🔎</span>
          </div>
          <div className="filter-controls">
            <select className="filter-select" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}>
              <option value="">All roles</option>
              {roles.map((r) => (<option key={r} value={r}>{r.toUpperCase()}</option>))}
            </select>
            <select className="filter-select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <select className="filter-select" value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
              {[10, 20, 50].map(n => (<option key={n} value={n}>{n} / page</option>))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading users...</div>
      ) : error ? (
        <div className="card card--danger">{error}</div>
      ) : (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 12 }}>ID</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Username</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Role</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Created</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.items || []).map((u) => (
                  <tr key={u.id} className="attendance-row">
                    <td style={{ padding: 12 }}>{u.id}</td>
                    <td style={{ padding: 12 }}>{u.username}</td>
                    <td style={{ padding: 12 }}>{u.email}</td>
                    <td style={{ padding: 12 }}>{typeof u.role === 'string' ? u.role : u.role?.value}</td>
                    <td style={{ padding: 12 }}>
                      <span className={`status-badge ${u.status}`}>{u.status}</span>
                    </td>
                    <td style={{ padding: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                    <td style={{ padding: 12 }}>
                      <button className="btn-small" onClick={() => openView(u)}>View</button>
                      <button className="btn-small" style={{ marginLeft: 8 }} onClick={() => openEdit(u)}>Edit</button>
                      <button className="btn-small" style={{ marginLeft: 8, background: '#ef4444' }} onClick={() => removeUser(u)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div>Showing page {data.page} of {totalPages} ({data.total} total)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={page <= 1} className="btn-small" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
              <button disabled={page >= totalPages} className="btn-small" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modalMode === 'view' ? 'User Details' : 'Edit User'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {modalMode === 'view' ? (
                <div className="course-info-grid">
                  <div className="info-item"><span className="info-label">ID</span><span className="info-value">{selected.id}</span></div>
                  <div className="info-item"><span className="info-label">Username</span><span className="info-value">{selected.username}</span></div>
                  <div className="info-item"><span className="info-label">Email</span><span className="info-value">{selected.email}</span></div>
                  <div className="info-item"><span className="info-label">Role</span><span className="info-value">{typeof selected.role === 'string' ? selected.role : selected.role?.value}</span></div>
                  <div className="info-item"><span className="info-label">Status</span><span className="info-value">{selected.status}</span></div>
                  <div className="info-item"><span className="info-label">Created</span><span className="info-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : '-'}</span></div>
                </div>
              ) : (
                <form className="course-info-grid" onSubmit={(e) => { e.preventDefault(); saveEdit(); }}>
                  <div className="info-item">
                    <label className="info-label">Username</label>
                    <input className="search-input" value={selected.username} onChange={(e) => setSelected({ ...selected, username: e.target.value })} />
                  </div>
                  <div className="info-item">
                    <label className="info-label">Email</label>
                    <input className="search-input" value={selected.email} onChange={(e) => setSelected({ ...selected, email: e.target.value })} />
                  </div>
                  <div className="info-item">
                    <label className="info-label">Role</label>
                    <select className="filter-select" value={typeof selected.role === 'string' ? selected.role : selected.role?.value} onChange={(e) => setSelected({ ...selected, role: e.target.value })}>
                      {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Status</label>
                    <select className="filter-select" value={selected.status} onChange={(e) => setSelected({ ...selected, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </form>
              )}
            </div>
            <div className="modal-footer">
              {modalMode === 'edit' ? (
                <button className="button" onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              ) : (
                <button className="btn-secondary" onClick={() => setModalMode('edit')}>Edit</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
