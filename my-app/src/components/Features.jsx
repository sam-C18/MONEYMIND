import React from "react";
import "./Features.css";

function Features() {
  return (
    <div className="features">
      <h2>Our Features</h2>
      <div className="features-grid">
        <div className="feature-card">
          <h3>Easy Account Opening</h3>
          <p>Open your bank account in minutes with our streamlined process.</p>
        </div>
        <div className="feature-card">
          <h3>Secure Banking</h3>
          <p>Your security is our top priority with advanced encryption.</p>
        </div>
        <div className="feature-card">
          <h3>24/7 Support</h3>
          <p>Get help whenever you need it with our round-the-clock support.</p>
        </div>
      </div>
    </div>
  );
}

export default Features;
