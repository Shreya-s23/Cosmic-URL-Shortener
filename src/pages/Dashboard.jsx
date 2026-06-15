import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UrlForm from '../components/UrlForm';
import AnalyticsModal from '../components/AnalyticsModal';
import { Copy, Check, BarChart2, Trash2, Edit3, CheckSquare, XSquare, ExternalLink, Search, RefreshCw, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { authFetch, user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isRestricted = user?.restricted === true;
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('routes'); // 'routes', 'mainframe', or 'users'

  // URL States
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrlId, setSelectedUrlId] = useState(null);
  const [showRestrictionWarning, setShowRestrictionWarning] = useState(false);
  const [isSuspended, setIsSuspended] = useState(isRestricted);
  
  // Edit URL states
  const [editingId, setEditingId] = useState(null);
  const [editInputValue, setEditInputValue] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Copy success indicator
  const [copiedId, setCopiedId] = useState(null);

  // Mainframe Access Log States
  const [accessLogs, setAccessLogs] = useState([]);
  const [logsStats, setLogsStats] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [logsSearchQuery, setLogsSearchQuery] = useState('');

  // Admin Registry Control States
  const [registryUsers, setRegistryUsers] = useState([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryError, setRegistryError] = useState('');
  const [registrySearchQuery, setRegistrySearchQuery] = useState('');

  const fetchUrls = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/urls');
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'CLEARANCE_SUSPENDED') {
          setIsSuspended(true);
          localStorage.setItem('space_shortener_restricted', 'true');
        }
        throw new Error(data.error || 'Failed to fetch coordinates');
      }
      setUrls(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessLogs = async () => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const res = await authFetch('/api/auth/access-logs');
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'CLEARANCE_SUSPENDED') {
          setIsSuspended(true);
          localStorage.setItem('space_shortener_restricted', 'true');
        }
        throw new Error(data.error || 'Failed to fetch access logs');
      }
      setAccessLogs(data.logs);
      setLogsStats(data.stats);
    } catch (err) {
      setLogsError(err.message);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchRegistryUsers = async () => {
    setRegistryLoading(true);
    setRegistryError('');
    try {
      const res = await authFetch('/api/auth/users');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch registry officers');
      }
      setRegistryUsers(data);
    } catch (err) {
      setRegistryError(err.message);
    } finally {
      setRegistryLoading(false);
    }
  };

  const handleToggleRestriction = async (userId, currentRestricted) => {
    try {
      const res = await authFetch(`/api/auth/users/${userId}/restrict`, {
        method: 'PUT',
        body: JSON.stringify({ restricted: !currentRestricted })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update clearance');
      }
      
      setRegistryUsers(registryUsers.map(u => u.id === userId ? { ...u, restricted: data.restricted } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenAnalytics = (urlId) => {
    if (isRestricted && !isAdmin) {
      setShowRestrictionWarning(true);
    } else {
      setSelectedUrlId(urlId);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  useEffect(() => {
    if (activeTab === 'mainframe') {
      fetchAccessLogs();
    } else if (activeTab === 'users' && isAdmin) {
      fetchRegistryUsers();
    }
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to terminate this URL path?')) return;
    try {
      const res = await authFetch(`/api/urls/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }
      setUrls(urls.filter(url => url.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Inline edit handlers
  const startEditing = (url) => {
    setEditingId(url.id);
    setEditInputValue(url.longUrl);
    setEditError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditInputValue('');
    setEditError('');
  };

  const handleEditSubmit = async (id) => {
    setEditError('');
    setEditLoading(true);
    let targetUrl = editInputValue.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'http://' + targetUrl;
    }

    try {
      new URL(targetUrl);
    } catch (_) {
      setEditError('Invalid URL structure');
      setEditLoading(false);
      return;
    }

    try {
      const res = await authFetch(`/api/urls/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ longUrl: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update endpoint');
      }
      
      setUrls(urls.map(u => (u.id === id ? { ...u, longUrl: targetUrl } : u)));
      setEditingId(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const getFullShortUrl = (code) => {
    return `${window.location.origin}/r/${code}`;
  };

  const handleCopyLink = (id, code) => {
    const link = getFullShortUrl(code);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(err => {
          console.error('Failed to copy via Clipboard API, trying fallback:', err);
          fallbackCopyText(link, id);
        });
    } else {
      fallbackCopyText(link, id);
    }
  };

  const fallbackCopyText = (text, id) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textArea);
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  };

  // Filters
  const filteredUrls = urls.filter(url => {
    const query = searchQuery.toLowerCase();
    return (
      url.shortCode.toLowerCase().includes(query) ||
      url.longUrl.toLowerCase().includes(query) ||
      (url.customAlias && url.customAlias.toLowerCase().includes(query)) ||
      (url.userEmail && url.userEmail.toLowerCase().includes(query))
    );
  });

  const filteredLogs = accessLogs.filter(log => {
    const query = logsSearchQuery.toLowerCase();
    return (
      log.email.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      (log.ip && log.ip.includes(query)) ||
      (log.device && log.device.toLowerCase().includes(query)) ||
      (log.browser && log.browser.toLowerCase().includes(query))
    );
  });

  const filteredRegistryUsers = registryUsers.filter(u => {
    const query = registrySearchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    );
  });

  if (isSuspended) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="analytics-denied-card glassmorphic animate-scale-up" style={{ maxWidth: '500px', border: '1px solid rgba(244, 63, 94, 0.5)' }}>
          <div className="warning-icon-wrapper text-error" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <AlertTriangle size={64} className="animate-pulse" />
          </div>
          <h1 className="text-error" style={{ textAlign: 'center', margin: '0 0 10px 0', letterSpacing: '3px', fontSize: '2rem' }}>CLEARANCE SUSPENDED</h1>
          <p className="denied-subtitle" style={{ textAlign: 'center', margin: '0 0 20px 0', fontWeight: 600, color: '#f43f5e', fontSize: '1rem', textTransform: 'uppercase' }}>Galactic Mainframe Access Revoked</p>
          <div className="denied-message-box" style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '20px', borderRadius: '8px', marginBottom: '24px', lineHeight: '1.6', fontSize: '0.95rem' }}>
            <p style={{ margin: 0, color: '#fda4af' }}>
              Your command clearance profile has been suspended by the Command Administration due to detection of sensitive or unauthorized data transmission.
            </p>
            <p style={{ marginTop: '12px', marginBottom: 0, color: '#f87171', fontWeight: 500 }}>
              All routing operations, click tracking, and console access are disabled.
            </p>
            <p className="text-muted font-mono" style={{ fontSize: '0.75rem', marginTop: '15px', margin: '15px 0 0 0', color: '#fca5a5' }}>STATUS: ACCESS_REVOKED_RULE_104</p>
          </div>
          <button className="btn btn-secondary btn-block" onClick={logout} style={{ marginTop: '10px' }}>
            Exit Mainframe (Logout)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      
      {/* Console Tab Selector */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          🛰️ Route Manager
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mainframe' ? 'active' : ''}`}
          onClick={() => setActiveTab('mainframe')}
        >
          🔐 Mainframe Access Logs
        </button>
        {isAdmin && (
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 User Registry Control
          </button>
        )}
      </div>

      {activeTab === 'routes' ? (
        /* Original URL Management View */
        <div className="dashboard-grid">
          {/* Left Side: Shorten Form */}
          <div className="dashboard-left">
            <UrlForm onUrlCreated={fetchUrls} authFetch={authFetch} />
          </div>

          {/* Right Side: URL Table View */}
          <div className="dashboard-right">
            <div className="dashboard-card glassmorphic">
              <div className="card-header-actions">
                <h2>Navigation Deck (Active Routes)</h2>
                <button className="btn btn-icon btn-secondary" onClick={fetchUrls} title="Refresh Routes">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Search Input */}
              <div className="search-bar">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="Search coordinates or destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {error && (
                <div className="alert alert-error">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="dashboard-loading">
                  <span className="cosmic-spinner"></span>
                  <p>Loading routing metrics...</p>
                </div>
              ) : filteredUrls.length === 0 ? (
                <div className="dashboard-empty">
                  <p>No active starways detected. Create one using the generator form.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="url-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        {isAdmin && <th>Creator</th>}
                        <th>Short Link</th>
                        <th>Destination Link</th>
                        <th>Clicks</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUrls.map((url) => {
                        const expired = isExpired(url.expiresAt);
                        return (
                          <tr key={url.id} className={expired ? 'row-expired' : ''}>
                            {/* Status Badge */}
                            <td>
                              {expired ? (
                                <span className="badge badge-expired">Expired</span>
                              ) : (
                                <span className="badge badge-active">Active</span>
                              )}
                            </td>

                            {/* Creator email if admin */}
                            {isAdmin && (
                              <td className="creator-cell" style={{ fontWeight: 500, color: '#38bdf8', fontSize: '0.85rem' }}>
                                {url.userEmail || 'System'}
                              </td>
                            )}

                            {/* Short URL with quick copy */}
                            <td>
                              <div className="short-url-cell">
                                <span className="short-code-text" title="Click to copy" onClick={() => handleCopyLink(url.id, url.shortCode)}>
                                  {url.shortCode}
                                </span>
                                <button
                                  className="copy-btn-cell"
                                  onClick={() => handleCopyLink(url.id, url.shortCode)}
                                  title="Copy Short Link"
                                >
                                  {copiedId === url.id ? (
                                    <Check size={13} className="text-success animate-scale-up" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Destination URL with inline Edit */}
                            <td>
                              {editingId === url.id ? (
                                <div className="edit-cell-container">
                                  <input
                                    type="text"
                                    className="edit-cell-input"
                                    value={editInputValue}
                                    onChange={(e) => setEditInputValue(e.target.value)}
                                    disabled={editLoading}
                                  />
                                  <div className="edit-cell-actions">
                                    <button
                                      onClick={() => handleEditSubmit(url.id)}
                                      disabled={editLoading}
                                      className="edit-confirm-btn"
                                      title="Save Target"
                                    >
                                      <CheckSquare size={16} className="text-success" />
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      disabled={editLoading}
                                      className="edit-cancel-btn"
                                      title="Cancel"
                                    >
                                      <XSquare size={16} className="text-error" />
                                    </button>
                                  </div>
                                  {editError && <div className="edit-error-tooltip">{editError}</div>}
                                </div>
                              ) : (
                                <div className="destination-cell">
                                  <span className="destination-text" title={url.longUrl}>
                                    {url.longUrl}
                                  </span>
                                  <button
                                    className="edit-btn-inline"
                                    onClick={() => startEditing(url)}
                                    title="Edit Destination Link"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <a
                                    href={getFullShortUrl(url.shortCode)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="visit-btn-inline"
                                    title="Launch URL"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              )}
                            </td>

                            {/* Click count */}
                            <td className="click-count-cell">
                              <span className="clicks-badge">{url.clickCount}</span>
                            </td>

                            {/* Date Created */}
                            <td className="date-cell">
                              {new Date(url.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>

                            {/* Table Row Actions */}
                            <td>
                              <div className="actions-cell">
                                <button
                                  className="action-btn action-analytics"
                                  onClick={() => handleOpenAnalytics(url.id)}
                                  title="Open Analytics Monitor"
                                >
                                  <BarChart2 size={15} />
                                </button>
                                <button
                                  className="action-btn action-delete"
                                  onClick={() => handleDelete(url.id)}
                                  title="Decommission URL"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'mainframe' && (
        /* Mainframe Audit logs View */
        <div className="mainframe-logs-container animate-fade-in">
          {/* Mainframe stats */}
          {logsStats && (
            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
              <div className="metric-card">
                <span className="metric-label">Registered Officers</span>
                <span className="metric-value text-glow">{logsStats.totalUsers}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Mainframe Access Sequences</span>
                <span className="metric-value text-glow">{logsStats.totalLogs}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Access / Terminations Ratio</span>
                <span className="metric-value" style={{ fontSize: '1.5rem', marginTop: 'auto', fontWeight: 600 }}>
                  <span className="text-success">{logsStats.totalLogins}</span> / <span className="text-error">{logsStats.totalLogouts}</span>
                </span>
              </div>
            </div>
          )}

          <div className="dashboard-card glassmorphic">
            <div className="card-header-actions">
              <h2>Clearance Audit Logs</h2>
              <button className="btn btn-icon btn-secondary" onClick={fetchAccessLogs} title="Sync Mainframe">
                <RefreshCw size={14} className={logsLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Logs Search filter */}
            <div className="search-bar">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Filter logs by officer email, action (LOGIN, LOGOUT, SIGNUP), IP..."
                value={logsSearchQuery}
                onChange={(e) => setLogsSearchQuery(e.target.value)}
              />
            </div>

            {logsError && (
              <div className="alert alert-error">
                <AlertTriangle size={16} />
                <span>{logsError}</span>
              </div>
            )}

            {logsLoading ? (
              <div className="dashboard-loading">
                <span className="cosmic-spinner"></span>
                <p>Syncing security Mainframe logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="dashboard-empty">
                <p>No security clearance logs found matching the filter query.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="url-table">
                  <thead>
                    <tr>
                      <th>Officer (Email)</th>
                      <th>Access Action</th>
                      <th>Access Time</th>
                      <th>Terminal IP</th>
                      <th>Device</th>
                      <th>Browser</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      let actionBadgeClass = '';
                      if (log.action === 'SIGNUP') actionBadgeClass = 'badge-active';
                      if (log.action === 'LOGIN') actionBadgeClass = 'badge-active-purple';
                      if (log.action === 'LOGOUT') actionBadgeClass = 'badge-expired';

                      return (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 500, color: '#fff' }}>{log.email}</td>
                          <td>
                            <span className={`badge ${actionBadgeClass}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="date-cell">
                            {new Date(log.timestamp).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="font-mono">{log.ip}</td>
                          <td>{log.device}</td>
                          <td>{log.browser}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && isAdmin && (
        /* Registry Users (Admin view) */
        <div className="users-registry-container animate-fade-in">
          <div className="dashboard-card glassmorphic">
            <div className="card-header-actions">
              <h2>Registry Officers Control</h2>
              <button className="btn btn-icon btn-secondary" onClick={fetchRegistryUsers} title="Refresh Registry">
                <RefreshCw size={14} className={registryLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Registry Search filter */}
            <div className="search-bar">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Search officers by email, role..."
                value={registrySearchQuery}
                onChange={(e) => setRegistrySearchQuery(e.target.value)}
              />
            </div>

            {registryError && (
              <div className="alert alert-error">
                <AlertTriangle size={16} />
                <span>{registryError}</span>
              </div>
            )}

            {registryLoading ? (
              <div className="dashboard-loading">
                <span className="cosmic-spinner"></span>
                <p>Retrieving registry database records...</p>
              </div>
            ) : filteredRegistryUsers.length === 0 ? (
              <div className="dashboard-empty">
                <p>No officers found matching the coordinates.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="url-table">
                  <thead>
                    <tr>
                      <th>Comms Email</th>
                      <th>Mainframe Role</th>
                      <th>Established Date</th>
                      <th>Total Vectors</th>
                      <th>Analytics Clearance</th>
                      <th>Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistryUsers.map((officer) => (
                      <tr key={officer.id}>
                        <td style={{ fontWeight: 500, color: '#fff' }}>{officer.email}</td>
                        <td>
                          <span className={`badge ${officer.role === 'ADMIN' ? 'badge-active-purple' : 'badge-active'}`}>
                            {officer.role}
                          </span>
                        </td>
                        <td className="date-cell">
                          {new Date(officer.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="click-count-cell">
                          <span className="clicks-badge">{officer.urlCount}</span>
                        </td>
                        <td>
                          {officer.restricted ? (
                            <span className="badge badge-expired">SUSPENDED</span>
                          ) : (
                            <span className="badge badge-active">APPROVED</span>
                          )}
                        </td>
                        <td>
                          {officer.role !== 'ADMIN' ? (
                            <button
                              className={`btn btn-sm ${officer.restricted ? 'btn-success' : 'btn-danger'}`}
                              onClick={() => handleToggleRestriction(officer.id, officer.restricted)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem', width: '110px' }}
                            >
                              {officer.restricted ? 'Grant Access' : 'Revoke Access'}
                            </button>
                          ) : (
                            <span className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>PROTECTED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Modal Drawer */}
      {selectedUrlId && (
        <AnalyticsModal
          urlId={selectedUrlId}
          onClose={() => setSelectedUrlId(null)}
          authFetch={authFetch}
        />
      )}

      {/* Analytics Restriction Warning Overlay */}
      {showRestrictionWarning && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowRestrictionWarning(false)}>
          <div className="analytics-denied-card glassmorphic animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="warning-icon-wrapper text-error" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <AlertTriangle size={48} className="animate-pulse" />
            </div>
            <h2 className="text-error" style={{ textAlign: 'center', margin: '0 0 10px 0', letterSpacing: '2px' }}>ACCESS DENIED</h2>
            <p className="denied-subtitle" style={{ textAlign: 'center', margin: '0 0 20px 0', fontWeight: 600, color: '#f43f5e', fontSize: '0.9rem', textTransform: 'uppercase' }}>Security Mainframe Clearance Suspended</p>
            <div className="denied-message-box" style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '15px', borderRadius: '6px', marginBottom: '24px', lineHeight: '1.5', fontSize: '0.9rem' }}>
              <p style={{ margin: 0, color: '#fda4af' }}>Your access authorization to telemetry metrics and orbital clicks has been suspended by the Command Administration.</p>
              <p className="text-muted font-mono" style={{ fontSize: '0.75rem', marginTop: '10px', margin: '10px 0 0 0', color: '#fca5a5' }}>CODE: ERROR_ANALYTICS_SUSPENDED</p>
            </div>
            <button className="btn btn-primary btn-block" onClick={() => setShowRestrictionWarning(false)}>
              Acknowledge & Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
