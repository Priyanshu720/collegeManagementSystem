import React, { useMemo, useState } from "react";
import "../index.css";
import AdminPendingUsers from "./AdminPendingUsers";
import AdminUsers from "./AdminUsers";
import AdminRoles from "./AdminRoles";
import AdminResources from "./AdminResources";
import AdminManageCourses from "./AdminManageCourses";

function NavItem({ label, active, onClick }) {
  return (
    <li onClick={onClick} style={{
      padding: '12px 10px',
      borderRadius: 8,
      cursor: 'pointer',
      background: active ? 'rgba(79,70,229,0.15)' : 'transparent',
      color: active ? '#1e3a8a' : 'inherit',
      fontWeight: active ? 700 : 500,
      border: active ? '1px solid rgba(79,70,229,0.25)' : '1px solid transparent'
    }}>{label}</li>
  );
}

function AdminDashboard({ user }) {
  const username = (user && user.username) || localStorage.getItem("username") || "Admin";
  const [tab, setTab] = useState("overview");

  const sections = useMemo(() => ([
    { key: 'users', label: 'Manage Users', component: <AdminUsers /> },
    { key: 'roles', label: 'Manage Roles', component: <AdminRoles /> },
    { key: 'resources', label: 'System Resources', component: <AdminResources /> },
    { key: 'courses', label: 'Manage Courses', component: <AdminManageCourses /> },
    { key: 'registrations', label: 'New Registrations', component: <AdminPendingUsers /> },
  ]), []);

  const current = sections.find(s => s.key === tab);

  return (
    <div className="grid" style={{ gridTemplateColumns: '260px 1fr', gap: 20, padding: 20 }}>
      <aside className="card" style={{ padding: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
          <div className="page-title" style={{ fontSize: 22 }}>Admin</div>
          <div className="page-subtitle">Welcome, {username}</div>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 12 }}>
          {sections.map(s => (
            <NavItem key={s.key} label={s.label} active={tab === s.key} onClick={() => setTab(s.key)} />
          ))}
        </ul>
      </aside>

      <main>
        {current ? current.component : (
          <div>
            <div className="page-header">
              <h1 className="page-title">Administrative overview</h1>
              <span className="page-subtitle">Select a section from the sidebar</span>
            </div>
            <div className="grid grid-3" style={{ marginTop: 20 }}>
              {sections.map(s => (
                <div key={s.key} className="card fade-in" onClick={() => setTab(s.key)}>
                  <div className="card-content">
                    <h3>{s.label}</h3>
                    <p>Go to {s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
