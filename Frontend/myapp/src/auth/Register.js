import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

const API_URL = "http://localhost:8000/users";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    role: "student"
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setMessage("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username || formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Registration successful ✅");
        // Redirect to login page after successful registration
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage(data.detail || JSON.stringify(data) || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Registration failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <select 
          name="role" 
          value={formData.role} 
          onChange={handleChange}
        >
          <option value="student">Student</option>
          <option value="ta">TA</option>
          <option value="teacher">Teacher</option>
          <option value="hod">HOD</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Register"}
        </button>
      </form>

      <p className="note">Your account will be pending until an admin approves it.</p>
      {message && <p className="message">{message}</p>}
      
      <p className="auth-link">
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default Register;