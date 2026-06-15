import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!acceptedPolicy) {
      return setError('You must accept the Mainframe Privacy Policy & Security Protocol to register.');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup sequence failed');
      }

      login(data.token, data.email, data.role, data.restricted);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glassmorphic">
        <div className="auth-header">
          <div className="auth-logo">
            <Rocket size={28} className="logo-spark" />
          </div>
          <h1>Create clearance profile</h1>
          <p>Register your security clearance on the galactic mainframe</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Comms Email</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={16} />
              <input
                type="email"
                id="email"
                required
                placeholder="yourname@galaxy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Security Passcode</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={16} />
              <input
                type="password"
                id="password"
                required
                placeholder="•••••••• (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Passcode</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={16} />
              <input
                type="password"
                id="confirmPassword"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Clearance Level</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              className="cosmic-select-dropdown"
            >
              <option value="USER">Officer (Standard User)</option>
              <option value="ADMIN">Command Admin (Administrator)</option>
            </select>
          </div>

          <div className="form-group privacy-policy-group">
            <div className="checkbox-wrapper" onClick={() => !loading && setAcceptedPolicy(!acceptedPolicy)}>
              <input
                type="checkbox"
                id="privacyPolicy"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                disabled={loading}
                required
                onClick={(e) => e.stopPropagation()}
              />
              <label htmlFor="privacyPolicy" className="checkbox-label">
                I agree to the Mainframe Privacy Policy & Security Protocol
              </label>
            </div>
            <div className="privacy-policy-text">
              <strong>Security Protocol Warning:</strong> System administrators monitor all transmission routes, logs, and shortcodes. Access to all system URLs is audited. The Command Administration reserves the right to immediately suspend clearance credentials and lock accounts if sensitive information leaks or illegal activity is detected.
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-warp" disabled={loading}>
            {loading ? (
              <>
                <Loader className="animate-spin" size={16} />
                <span>Registering clearance...</span>
              </>
            ) : (
              <span>Establish Profile</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have clearance? <Link to="/login" className="glow-link">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
