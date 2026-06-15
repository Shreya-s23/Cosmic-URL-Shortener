import React, { useState, useEffect } from 'react';
import { X, Calendar, Globe, Monitor, History, ArrowRight, Loader } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const COLORS = ['#6366f1', '#a78bfa', '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b'];

const AnalyticsModal = ({ urlId, onClose, authFetch }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authFetch(`/api/urls/${urlId}/analytics`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch analytics');
        }
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (urlId) {
      fetchAnalytics();
    }
  }, [urlId]);

  if (!urlId) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glassmorphic" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Transmission Analytics</h2>
            {data && <p className="modal-subtitle">Tracking: {data.url.shortCode}</p>}
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div className="modal-loading">
            <Loader className="animate-spin text-primary" size={36} />
            <p>Scanning galactic logs...</p>
          </div>
        )}

        {error && (
          <div className="modal-error">
            <p className="text-error">{error}</p>
            <button className="btn btn-secondary" onClick={onClose}>Close Console</button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="modal-body scrollable">
            {/* Quick Metrics Grid */}
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-label">Total Warp Clicks</span>
                <span className="metric-value text-glow">{data.metrics.totalClicks}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Last Transmission</span>
                <span className="metric-value-date">{formatDate(data.metrics.lastVisited)}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Created Date</span>
                <span className="metric-value-date">{new Date(data.url.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Destination URL Display */}
            <div className="destination-banner">
              <span className="dest-label">Destination Node:</span>
              <span className="dest-url" title={data.url.longUrl}>{data.url.longUrl}</span>
            </div>

            {/* Charts Section */}
            <div className="charts-container">
              {/* Daily Clicks Trend Chart */}
              <div className="chart-card">
                <h3><Calendar size={16} /> Daily Clicks Trend (Last 7 Days)</h3>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <AreaChart
                      data={data.metrics.dailyTrends}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8" 
                        fontSize={10}
                        tickFormatter={(str) => {
                          const parts = str.split('-');
                          return `${parts[1]}/${parts[2]}`; // MM/DD
                        }}
                      />
                      <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="#818cf8"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorClicks)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="charts-row">
                {/* Browser Breakdown */}
                <div className="chart-card flex-1">
                  <h3><Globe size={16} /> Browser Breakdown</h3>
                  {data.metrics.browserData.length > 0 ? (
                    <div style={{ width: '100%', height: 160 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={data.metrics.browserData}
                          layout="vertical"
                          margin={{ top: 5, right: 15, left: -15, bottom: 5 }}
                        >
                          <XAxis type="number" stroke="#94a3b8" fontSize={9} allowDecimals={false} />
                          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={65} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              fontSize: '11px',
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {data.metrics.browserData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="no-data-msg">No browser logs recorded yet</p>
                  )}
                </div>

                {/* Device Breakdown */}
                <div className="chart-card flex-1">
                  <h3><Monitor size={16} /> Device Breakdown</h3>
                  {data.metrics.deviceData.length > 0 ? (
                    <div style={{ width: '100%', height: 160 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={data.metrics.deviceData}
                          layout="vertical"
                          margin={{ top: 5, right: 15, left: -15, bottom: 5 }}
                        >
                          <XAxis type="number" stroke="#94a3b8" fontSize={9} allowDecimals={false} />
                          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={65} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              fontSize: '11px',
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {data.metrics.deviceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="no-data-msg">No device logs recorded yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Visits Table */}
            <div className="history-section">
              <h3><History size={16} /> Recent Transmission Logs</h3>
              {data.metrics.recentClicks.length > 0 ? (
                <div className="table-responsive logs-table-container">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Terminal IP</th>
                        <th>Device</th>
                        <th>Browser</th>
                        <th>Referrer Node</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.metrics.recentClicks.map((click) => (
                        <tr key={click.id}>
                          <td>{formatDate(click.timestamp)}</td>
                          <td className="font-mono">{click.ip}</td>
                          <td>{click.device}</td>
                          <td>{click.browser}</td>
                          <td className="dest-url" title={click.referrer}>{click.referrer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data-msg">No warp traffic detected on this terminal route</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsModal;
