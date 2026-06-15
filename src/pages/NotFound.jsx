import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="auth-container">
      <div className="auth-card glassmorphic text-center">
        <div className="auth-logo text-error">
          <Compass size={36} className="logo-spark" />
        </div>
        <h1>Coordinate Lost</h1>
        <p style={{ margin: '1.5rem 0', color: '#94a3b8' }}>
          The short URL beacon you are attempting to trace does not exist or has drifted out of planetary range.
        </p>
        <Link to="/" className="btn btn-primary btn-warp">
          <Home size={16} />
          <span>Return to Headquarters</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
