import React, { useState, useEffect } from "react";
import BookingForm from "./BookingForm";

function BookingsDashboard({ role = "student" }) {
  const [bookings, setBookings] = useState([]);
  const [showApprovals, setShowApprovals] = useState(false);
  const token = localStorage.getItem("token");

  // Fetch bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("http://localhost:8000/bookings/", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };
    
    if (token) {
      fetchBookings();
    }
  }, [token]);

  const handleBooking = (booking) => {
    console.log("Booking submitted:", booking);
    // Optional: update state or send fetch request to backend
  };

  const handleBookingStatusUpdate = async (bookingId, status) => {
    try {
      const response = await fetch(`http://localhost:8000/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        alert(`Booking ${status} successfully!`);
        // Update local state
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId ? { ...booking, status } : booking
        ));
      } else {
        alert(`Failed to ${status} booking`);
      }
    } catch (error) {
      console.error(`Error ${status} booking:`, error);
      alert(`Error ${status} booking`);
    }
  };

  if (role === "teacher" && showApprovals) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Approve Bookings</h2>
        <button 
          onClick={() => setShowApprovals(false)}
          style={{ marginBottom: "20px" }}
        >
          ← Back to Resources
        </button>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {bookings.map(booking => (
            <BookingApprovalCard 
              key={booking.id} 
              booking={booking} 
              onStatusUpdate={handleBookingStatusUpdate}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Resource Bookings</h1>
      
      {role === "teacher" && (
        <div style={{ marginBottom: "20px" }}>
          <button 
            onClick={() => setShowApprovals(true)}
            style={{ padding: "10px 20px", marginRight: "10px" }}
          >
            🏢 Approve Bookings ({bookings.filter(b => b.status === "pending").length} pending)
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px" }}>
        <p>Resource management functionality will be available soon.</p>
      </div>

      {role === "student" && (
        <BookingForm resources={[]} onBook={handleBooking} />
      )}
    </div>
  );
}

// Booking Approval Card Component
function BookingApprovalCard({ booking, onStatusUpdate }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#ffa500";
      case "approved": return "#28a745";
      case "rejected": return "#dc3545";
      default: return "#6c757d";
    }
  };

  return (
    <div style={{ 
      border: "1px solid #ddd", 
      padding: "15px", 
      borderRadius: "8px",
      backgroundColor: "#f8f9fa"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3>{booking.resource_name}</h3>
          <p><strong>Requested by:</strong> {booking.user?.username || `User ${booking.user_id}`}</p>
          <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Status:</strong> 
            <span style={{ 
              color: getStatusColor(booking.status),
              fontWeight: "bold",
              marginLeft: "5px"
            }}>
              {booking.status.toUpperCase()}
            </span>
          </p>
        </div>
        
        {booking.status === "pending" && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => onStatusUpdate(booking.id, "approved")}
              style={{ 
                padding: "8px 16px", 
                backgroundColor: "#28a745", 
                color: "white", 
                border: "none", 
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              ✅ Approve
            </button>
            <button 
              onClick={() => onStatusUpdate(booking.id, "rejected")}
              style={{ 
                padding: "8px 16px", 
                backgroundColor: "#dc3545", 
                color: "white", 
                border: "none", 
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              ❌ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingsDashboard;
