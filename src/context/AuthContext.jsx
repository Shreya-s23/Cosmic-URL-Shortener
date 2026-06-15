import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('space_shortener_token');
    const storedEmail = localStorage.getItem('space_shortener_email');
    const storedRole = localStorage.getItem('space_shortener_role') || 'USER';
    const storedRestricted = localStorage.getItem('space_shortener_restricted') === 'true';
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUser({ email: storedEmail, role: storedRole, restricted: storedRestricted });
    }
    setLoading(false);
  }, []);

  const login = (jwtToken, email, role = 'USER', restricted = false) => {
    localStorage.setItem('space_shortener_token', jwtToken);
    localStorage.setItem('space_shortener_email', email);
    localStorage.setItem('space_shortener_role', role);
    localStorage.setItem('space_shortener_restricted', String(restricted));
    setToken(jwtToken);
    setUser({ email, role, restricted });
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('Failed to log session end on server:', err);
    } finally {
      localStorage.removeItem('space_shortener_token');
      localStorage.removeItem('space_shortener_email');
      localStorage.removeItem('space_shortener_role');
      localStorage.removeItem('space_shortener_restricted');
      setToken(null);
      setUser(null);
    }
  };

  // Pre-configured fetch helper that includes JWT auth token
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    return res;
  };

  const value = {
    token,
    user,
    loading,
    login,
    logout,
    authFetch,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
