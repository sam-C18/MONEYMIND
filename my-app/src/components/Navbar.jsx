import React from 'react';
import { Link } from 'react-router-dom';
import { FaMoon, FaSun, FaBars, FaUserCircle } from 'react-icons/fa';
import "./Navbar.css";

const Navbar = ({ isDarkMode, toggleTheme, toggleSidebar, isSidebarOpen }) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button 
          className={`menu-button ${isSidebarOpen ? 'active' : ''}`} 
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <FaBars />
        </button>
        <Link to="/" className="logo">
          <img src="/logo.png" alt="Bank Logo" />
          <span>SecureBank</span>
        </Link>
      </div>

      <div className="navbar-right">
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>
        
        <div className="user-menu">
          <button className="user-button">
            <FaUserCircle />
            <span>Account</span>
          </button>
          <div className="user-dropdown">
            <Link to="/profile">Profile</Link>
            <Link to="/settings">Settings</Link>
            <button className="logout-button">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
