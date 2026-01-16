import React, { useState } from "react";
import "./login.css";

const API_URL = "http://localhost:8000/users";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ===== Register =====
  const register = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username: username || email,
          password,
          role,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Registration successful ✅");
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

  // ===== Login =====
  const login = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = await response.json();
      if (response.ok && data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", data.username || email);
        onLogin(data.access_token);
        window.location.href = "/dashboard";
      } else {
        setMessage(data.detail || "Login failed ❌");
      }
    } catch (err) {
      console.error(err);
      setMessage("Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login / Register</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="student">Student</option>
        <option value="ta">TA</option>
        <option value="teacher">Teacher</option>
        <option value="hod">HOD</option>
        <option value="admin">Admin</option>
      </select>

      <div>
        <button 
          type="button" 
          onClick={(e) => {
            e.preventDefault();
            console.log("Register button clicked");
            register();
          }} 
          disabled={loading}
          style={{marginRight: '10px'}}
        >
          {loading ? "Please wait..." : "Register"}
        </button>
        <button 
          type="button" 
          onClick={(e) => {
            e.preventDefault();
            console.log("Login button clicked");
            login();
          }} 
          disabled={loading}
        >
          {loading ? "Please wait..." : "Login"}
        </button>
      </div>

      <p>{message}</p>
    </div>
  );
}

export default Login;