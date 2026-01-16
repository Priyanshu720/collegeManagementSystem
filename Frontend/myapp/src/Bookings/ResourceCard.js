import React from "react";
import "../index.css";

function ResourceCard({ resource }) {
  return (
    <div className="card fade-in">
      <h3>{resource.name}</h3>
      <p>{resource.type}</p>
      <p>Available: {resource.available ? "Yes" : "No"}</p>
    </div>
  );
}

export default ResourceCard;
