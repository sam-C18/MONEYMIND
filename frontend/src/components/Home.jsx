import { useState } from 'react';
import Logo from './Logo';
import FloatingChat from './FloatingChat';

const Home = () => {
  return (
    <div className="home-container">
      <div className="logo-section">
        <Logo />
      </div>
      <div className="welcome-section">
        <h1>Welcome to Bank Assistant</h1>
        <p>Your trusted banking companion</p>
        <div className="features">
          <div className="feature-card">
            <h3>Open Account</h3>
            <p>Start your banking journey with us</p>
          </div>
          <div className="feature-card">
            <h3>Document Management</h3>
            <p>Upload and manage your documents securely</p>
          </div>
          <div className="feature-card">
            <h3>24/7 Support</h3>
            <p>Get help whenever you need it</p>
          </div>
        </div>
      </div>
      <FloatingChat />

      <style jsx>{`
        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .logo-section {
          margin-bottom: 40px;
        }

        .welcome-section {
          text-align: center;
          padding: 40px 20px;
        }

        .welcome-section h1 {
          color: #007bff;
          font-size: 2.5rem;
          margin-bottom: 10px;
        }

        .welcome-section p {
          color: #6c757d;
          font-size: 1.2rem;
          margin-bottom: 40px;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-top: 40px;
        }

        .feature-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
        }

        .feature-card h3 {
          color: #007bff;
          margin-bottom: 15px;
        }

        .feature-card p {
          color: #6c757d;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default Home; 