import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = "http://localhost:8000/users";

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setMessage("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const formBody = new URLSearchParams();
      formBody.append("username", formData.email);
      formBody.append("password", formData.password);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      const data = await response.json();
      if (response.ok && data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", data.username || formData.email);
        onLogin(data.access_token);
        navigate("/dashboard");
      } else {
        setMessage(data.detail || "Login failed ❌");
        if (data.detail && data.detail.toLowerCase().includes("pending")) {
          setMessage("Your account is pending approval by an admin.");
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </button>
      </form>

      {message && <p className="message">{message}</p>}
      
      <p className="auth-link">
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default Login;