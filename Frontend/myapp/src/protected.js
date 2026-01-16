import React, { useState } from "react";

const API_URL = "http://localhost:8000";

function Protected({ token }) {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  const getProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data);
      setMessage("Profile fetched successfully ✅");
    } catch (error) {
      setMessage("Error fetching profile ❌");
      console.error("Profile fetch error:", error);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "20px", margin: "20px", width: "300px" }}>
      <h2>Protected Page</h2>
      <button onClick={getProfile}>Get Profile</button>
      {message && <p>{message}</p>}
      {profile && <pre>{JSON.stringify(profile, null, 2)}</pre>}
    </div>
  );
}

export default Protected;
