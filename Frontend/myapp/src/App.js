import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Login from "./auth/Login";
import Register from "./auth/Register";
import DashboardPage from "./Dashboard/DashboardPage";
import Courses from "./Courses/Course";
import AssignmentsDashboard from "./Assignments/AssignmentsDashboard";
import TeacherAttendancePage from "./Attendance/TeacherAttendancePage";
import BookingsDashboard from "./Bookings/BookingsDashboard";
import StudentAttendance from "./Attendance/StudentAttendance";
import StudentGrades from "./Grades/StudentGrades";
import AdminUsers from "./Dashboard/AdminUsers";
import AdminRoles from "./Dashboard/AdminRoles";
import AdminResources from "./Dashboard/AdminResources";
import AdminPendingUsers from "./Dashboard/AdminPendingUsers";
import "./index.css";

function App() {
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load token & role if already saved
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    if (savedToken) setToken(savedToken);
    if (savedRole) setRole(savedRole);
  }, []);

  const handleLogin = (tok) => {
    setToken(tok);
    const savedRole = localStorage.getItem("role");
    if (savedRole) setRole(savedRole);
    localStorage.setItem("token", tok);
  };

  const handleLogout = () => {
    setToken("");
    setRole("");
    localStorage.clear();
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      {token && (
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
          role={role}
        />
      )}

      {/* Main content */}
      <div className={`main-content ${sidebarOpen ? "blur" : ""}`}>
        {token && (
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
        )}

        <Routes>
          {/* Auth Routes */}
          <Route
            path="/"
            element={!token ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/login"
            element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/register"
            element={!token ? <Register /> : <Navigate to="/dashboard" replace />}
          />

          {/* Common Dashboard */}
          <Route
            path="/dashboard"
            element={token ? <DashboardPage /> : <Navigate to="/" replace />}
          />

          {/* Student Routes */}
          <Route
            path="/courses"
            element={token && role === "student" ? <Courses /> : <Navigate to="/" replace />}
          />
          <Route
            path="/assignments"
            element={token && role === "student" ? <AssignmentsDashboard role="student" /> : <Navigate to="/" replace />}
          />
          <Route
            path="/attendance"
            element={token && role === "student" ? <StudentAttendance /> : <Navigate to="/" replace />}
          />
          <Route
            path="/bookings"
            element={token && role === "student" ? <BookingsDashboard role="student" /> : <Navigate to="/" replace />}
          />
          <Route
            path="/grades"
            element={token && role === "student" ? <StudentGrades /> : <Navigate to="/" replace />}
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher/courses"
            element={token && role === "teacher" ? <Courses /> : <Navigate to="/" replace />}
          />
          <Route
            path="/teacher/attendance"
            element={token && role === "teacher" ? <TeacherAttendancePage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/teacher/assignments"
            element={token && role === "teacher" ? <AssignmentsDashboard role="teacher" /> : <Navigate to="/" replace />}
          />
          <Route
            path="/teacher/bookings"
            element={token && role === "teacher" ? <div>Approve Bookings Page</div> : <Navigate to="/" replace />}
          />

          {/* TA Routes */}
          <Route
            path="/ta/assignments"
            element={token && role === "ta" ? <AssignmentsDashboard role="ta" /> : <Navigate to="/" replace />}
          />
          <Route
            path="/ta/attendance"
            element={token && role === "ta" ? <TeacherAttendancePage /> : <Navigate to="/" replace />}
          />

          {/* HOD Routes */}
          <Route
            path="/hod/reports"
            element={token && role === "hod" ? <div>Department Reports</div> : <Navigate to="/" replace />}
          />
          <Route
            path="/hod/bookings"
            element={token && role === "hod" ? <div>Approve Bookings (HOD)</div> : <Navigate to="/" replace />}
          />

          {/* Admin Routes */}
          <Route
            path="/admin/users"
            element={token && role === "admin" ? <AdminUsers /> : <Navigate to="/" replace />}
          />
          <Route
            path="/admin/roles"
            element={token && role === "admin" ? <AdminRoles /> : <Navigate to="/" replace />}
          />
          <Route
            path="/admin/resources"
            element={token && role === "admin" ? <AdminResources /> : <Navigate to="/" replace />}
          />
          <Route
            path="/admin/registrations"
            element={token && role === "admin" ? <AdminPendingUsers /> : <Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({ sidebarOpen, setSidebarOpen, handleLogout, role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = {
    student: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "My Courses", path: "/courses" },
      { label: "Assignments", path: "/assignments" },
      { label: "Attendance", path: "/attendance" },
      { label: "Bookings", path: "/bookings" },
      { label: "Grades", path: "/grades" },
    ],
    teacher: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Manage Courses", path: "/teacher/courses" },
      { label: "Mark Attendance", path: "/teacher/attendance" },
      { label: "Grade Assignments", path: "/teacher/assignments" },
      { label: "Approve Bookings", path: "/teacher/bookings" },
    ],
    ta: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Assist Assignments", path: "/ta/assignments" },
    ],
    hod: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Department Reports", path: "/hod/reports" },
      { label: "Approve Bookings", path: "/hod/bookings" },
    ],
    admin: [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Manage Users", path: "/admin/users" },
      { label: "Manage Roles", path: "/admin/roles" },
      { label: "System Resources", path: "/admin/resources" },
      { label: "New Registrations", path: "/admin/registrations" },
    ],
  };

  return (
    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={() => setSidebarOpen(false)}>×</button>
      <h2>{role.toUpperCase()} Menu</h2>
      <ul>
        {menuItems[role]?.map((item, idx) => (
          <li key={idx} onClick={() => { setSidebarOpen(false); navigate(item.path); }}
              style={{
                background: location.pathname === item.path ? 'rgba(255,255,255,0.18)' : 'transparent',
                border: location.pathname === item.path ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent'
              }}
          >
            {item.label}
          </li>
        ))}
        <li onClick={handleLogout}>Logout</li>
      </ul>
    </div>
  );
}

export default App;