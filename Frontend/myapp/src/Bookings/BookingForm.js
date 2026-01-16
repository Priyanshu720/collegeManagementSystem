import React, { useState } from "react";
import "../index.css";

function BookingForm({ resources, onBook }) {
  const [selectedResource, setSelectedResource] = useState("");
  const [timeslot, setTimeslot] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedResource || !timeslot) {
      setMessage("Please select a resource and timeslot");
      return;
    }
    onBook({ resource: selectedResource, timeslot });
    setMessage("Booking submitted ✅");
    setSelectedResource("");
    setTimeslot("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Book a Resource</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
        <select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)}>
          <option value="">Select Resource</option>
          {resources.map((res) => (
            <option key={res.id} value={res.name}>{res.name} ({res.type})</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Timeslot (e.g., 10:00-11:00)"
          value={timeslot}
          onChange={(e) => setTimeslot(e.target.value)}
        />

        <button type="submit" className="button">Book</button>
      </form>
      {message && <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>}
    </div>
  );
}

export default BookingForm;
