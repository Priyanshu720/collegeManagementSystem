import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000/users";

function TabButton({ active, onClick, children }) {
  return (
    <button
      className={`tab-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function UserCard({ user, onApprove, onReject }) {
  const initial = (user.username || user.email || '?').charAt(0).toUpperCase();
  const role = typeof user.role === 'string' ? user.role : user.role?.value;
  return (
    <div className="card fade-in" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 999,
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 18
      }}>{initial}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: '#1f2937' }}>{user.username}</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>{user.email}</div>
        <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`status-badge ${user.status}`}>{user.status}</span>
          <span className="status-badge" style={{ background: '#e5e7eb', color: '#374151' }}>{(role || '').toUpperCase()}</span>
          <span style={{ color: '#6b7280', fontSize: 12 }}>Registered: {user.created_at ? new Date(user.created_at).toLocaleString() : '-'}</span>
        </div>
      </div>
      <div>
        {!!onApprove && (
          <button className="btn-small" style={{ background: '#10b981' }} onClick={() => onApprove(user)}>
            Approve
          </button>
        )}
        {!!onReject && (
          <button className="btn-small" style={{ marginLeft: 8, background: '#ef4444' }} onClick={() => onReject(user)}>
            Reject
          </button>
        )}
      </div>
    </div>
  );
}

function AdminPendingUsers() {
  const token = localStorage.getItem("token");
  const headersAuth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [tab, setTab] = useState('pending'); // 'pending' | 'approved'
  const [roles, setRoles] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");

  // Pending
  const [pending, setPending] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [errorPending, setErrorPending] = useState("");

  // Approved (paginated)
  const [approved, setApproved] = useState({ items: [], total: 0, page: 1, page_size: 10 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [errorApproved, setErrorApproved] = useState("");

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/roles/list`, { headers: headersAuth });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || 'Failed to fetch roles');
      setRoles(json.roles || []);
    } catch (_) {
      setRoles(["student", "ta", "teacher", "hod", "admin"]);
    }
  };

  const fetchPending = async () => {
    setLoadingPending(true);
    setErrorPending("");
    try {
      const res = await fetch(`${API_BASE}/pending`, { headers: headersAuth });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || 'Failed to fetch pending users');
      setPending(json);
    } catch (e) {
      setErrorPending(e.message);
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchApproved = async () => {
    setLoadingApproved(true);
    setErrorApproved("");
    try {
      const params = new URLSearchParams();
      params.set('status', 'active');
      if (q) params.set('q', q);
      if (role) params.set('role', role);
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      const res = await fetch(`${API_BASE}?${params.toString()}`, { headers: headersAuth });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || 'Failed to fetch approved users');
      setApproved(json);
    } catch (e) {
      setErrorApproved(e.message);
    } finally {
      setLoadingApproved(false);
    }
  };

  useEffect(() => { fetchRoles(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetchPending(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetchApproved(); /* eslint-disable-next-line */ }, [q, role, page, pageSize]);

  const onApprove = async (u) => {
    try {
      const res = await fetch(`${API_BASE}/${u.id}/approve`, { method: 'PATCH', headers: headersAuth });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || 'Approve failed');
      setPending(list => list.filter(x => x.id !== u.id));
      // refresh approved list to include this new active user in case of filters
      fetchApproved();
    } catch (e) {
      alert(e.message);
    }
  };

  const onReject = async (u) => {
    try {
      const res = await fetch(`${API_BASE}/${u.id}/reject`, { method: 'PATCH', headers: headersAuth });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || 'Reject failed');
      setPending(list => list.filter(x => x.id !== u.id));
    } catch (e) {
      alert(e.message);
    }
  };

  // client-side filter for pending by q/role
  const filteredPending = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return pending.filter(u => {
      const matchQ = !qq || (u.username?.toLowerCase().includes(qq) || u.email?.toLowerCase().includes(qq));
      const r = typeof u.role === 'string' ? u.role : u.role?.value;
      const matchRole = !role || r === role;
      return matchQ && matchRole;
    });
  }, [pending, q, role]);

  const totalPages = Math.max(1, Math.ceil((approved.total || 0) / pageSize));

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="modal-header" style={{ borderRadius: '16px 16px 0 0' }}>
        <h3 className="modal-title">User Onboarding</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>New Registrations</TabButton>
          <TabButton active={tab === 'approved'} onClick={() => setTab('approved')}>Approved Users</TabButton>
        </div>
      </div>

      <div className="modal-body" style={{ paddingTop: 16 }}>
        {/* Filters shared */}
        <div className="course-filters">
          <div className="filter-row">
            <div className="search-box">
              <input className="search-input" placeholder="Search by email or username" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
              <span className="search-icon">🔎</span>
            </div>
            <div className="filter-controls">
              <select className="filter-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
                <option value="">All roles</option>
                {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
              </select>
              {tab === 'approved' && (
                <>
                  <select className="filter-select" value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
                    {[10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
                  </select>
                </>
              )}
            </div>
          </div>
        </div>

        {tab === 'pending' ? (
          loadingPending ? (
            <div className="loading-spinner">Loading pending users...</div>
          ) : errorPending ? (
            <div className="card card--danger">{errorPending}</div>
          ) : filteredPending.length === 0 ? (
            <div className="no-activity">No pending registrations found.</div>
          ) : (
            <div className="grid grid-2" style={{ marginTop: 16 }}>
              {filteredPending.map(u => (
                <UserCard key={u.id} user={u} onApprove={onApprove} onReject={onReject} />
              ))}
            </div>
          )
        ) : (
          loadingApproved ? (
            <div className="loading-spinner">Loading approved users...</div>
          ) : errorApproved ? (
            <div className="card card--danger">{errorApproved}</div>
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
                      <th style={{ textAlign: 'left', padding: 12 }}>Approved At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(approved.items || []).map(u => (
                      <tr key={u.id} className="attendance-row">
                        <td style={{ padding: 12 }}>{u.id}</td>
                        <td style={{ padding: 12 }}>{u.username}</td>
                        <td style={{ padding: 12 }}>{u.email}</td>
                        <td style={{ padding: 12 }}>{typeof u.role === 'string' ? u.role : u.role?.value}</td>
                        <td style={{ padding: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <div>Showing page {approved.page} of {Math.max(1, Math.ceil((approved.total || 0) / (approved.page_size || pageSize)))} ({approved.total} total)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button disabled={page <= 1} className="btn-small" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                  <button disabled={page >= Math.max(1, Math.ceil((approved.total || 0) / pageSize))} className="btn-small" onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default AdminPendingUsers;
