import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Rocket, LayoutDashboard, Terminal } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand-link" style={{ textDecoration: 'none' }}>
        <div className="navbar-brand">
          <Rocket className="navbar-logo-icon" size={22} />
          <span className="navbar-title">Cosmic Shortener</span>
        </div>
      </Link>
      
      <div className="navbar-actions-area">
        {isAuthenticated ? (
          <div className="navbar-user">
            <Link to="/dashboard" className="nav-tab-link">
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </Link>
            <div className="user-badge">
              <span className="user-dot"></span>
              <span className="user-email">{user?.email}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Abort Session & Logout">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="navbar-guest-actions">
            <Link to="/login" className="nav-tab-link">
              <Terminal size={14} />
              <span>Login</span>
            </Link>
            <Link to="/signup" className="btn btn-secondary btn-xs glow-link-nav">
              Initialize Clearance
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
