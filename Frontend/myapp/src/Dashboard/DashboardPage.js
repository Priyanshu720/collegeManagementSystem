import React from "react";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import TADashboard from "./TADashboard";
import HODDashboard from "./HODDashboard";
import AdminDashboard from "./AdminDashboard";
import "../index.css";

function DashboardPage() {
  // role ko localStorage se le lo
  const role = localStorage.getItem("role") || "student";

  switch (role) {
    case "student":
      return <StudentDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "ta":
      return <TADashboard />;
    case "hod":
      return <HODDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <div>Unknown role</div>;
  }
}

export default DashboardPage;
