import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket, ShieldAlert, BarChart2, Edit3, Files, ShieldCheck, ArrowRight, Play, Cpu, Compass } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge animate-pulse">
          <Cpu size={14} className="text-secondary" />
          <span>V1.2 OPERATIONAL: EXPOSED ON LOCAL NETWORKS</span>
        </div>
        
        <h1 className="hero-title">
          Warp Your Links Into <br />
          <span className="gradient-text">Deep Space</span>
        </h1>
        
        <p className="hero-subtitle">
          The ultimate cosmic URL shortener and telemetry deck. Compress bloated URLs, generate vector QR codes, monitor live traffic trends, and audit terminal session logs.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-warp btn-lg">
              <span>Enter Navigation Deck</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-warp btn-lg">
                <span>Begin Free Voyage</span>
                <Play size={16} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                <span>Access console</span>
              </Link>
            </>
          )}
        </div>

        {/* Floating preview cards */}
        <div className="hero-preview-grid">
          <div className="preview-card glassmorphic">
            <span className="preview-card-dot purple"></span>
            <h3>🛰️ Link Compression</h3>
            <p>Shorten long target URLs instantly. Add custom aliases and security decay timers.</p>
          </div>
          <div className="preview-card glassmorphic">
            <span className="preview-card-dot blue"></span>
            <h3>📊 Live Telemetry</h3>
            <p>Inspect visitor browsers, device class, IP address, and click graphs in real-time.</p>
          </div>
          <div className="preview-card glassmorphic">
            <span className="preview-card-dot green"></span>
            <h3>🔐 Mainframe Audits</h3>
            <p>Track signup, login, and explicit logout timestamps for all terminal officers.</p>
          </div>
        </div>
      </section>

      {/* How it Works / Instructions Section */}
      <section className="instructions-section">
        <div className="section-header">
          <span className="section-tag">GUIDE</span>
          <h2>How to Operate the Deck</h2>
          <p>Follow these orbital steps to register and warp your URLs</p>
        </div>

        <div className="steps-deck">
          {/* Step 1 */}
          <div className="step-card glassmorphic">
            <div className="step-number">01</div>
            <h3>Request Clearance</h3>
            <p>
              Navigate to the <Link to="/signup" className="glow-link">clearance portal</Link> and establish your security email and passcode.
            </p>
          </div>

          {/* Step 2 */}
          <div className="step-card glassmorphic">
            <div className="step-number">02</div>
            <h3>Compress Vector</h3>
            <p>
              Paste your long destination address. Optionally add a custom warp alias or schedule a future link decay timestamp.
            </p>
          </div>

          {/* Step 3 */}
          <div className="step-card glassmorphic">
            <div className="step-number">03</div>
            <h3>Download Beacon</h3>
            <p>
              Copy your shortcode vector or download the auto-generated QR code (pre-bound to host LAN IPs for mobile Android scanning).
            </p>
          </div>

          {/* Step 4 */}
          <div className="step-card glassmorphic">
            <div className="step-number">04</div>
            <h3>Monitor Signals</h3>
            <p>
              Click the analytics icon in your registry table to trace traffic curves, device distributions, and referral nodes.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid Matrix */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-tag">CAPABILITIES</span>
          <h2>Deck Features & Instruments</h2>
        </div>

        <div className="features-matrix">
          <div className="feature-grid-item glassmorphic">
            <BarChart2 className="feature-icon text-secondary" size={28} />
            <h3>Click Telemetry</h3>
            <p>Responsive Area charts mapping hourly clicks alongside vertical Bar charts dividing user browser engines and device formats.</p>
          </div>

          <div className="feature-grid-item glassmorphic">
            <Edit3 className="feature-icon text-primary" size={28} />
            <h3>Target Modifier</h3>
            <p>Redirect target destinations on active shortcodes on the fly without breaking the shortcode itself. Ideal for shifting space coordinates.</p>
          </div>

          <div className="feature-grid-item glassmorphic">
            <Files className="feature-icon text-accent" size={28} />
            <h3>Fleet Warp (CSV)</h3>
            <p>Drag and drop CSV sheets containing multiple links to generate hundreds of redirects in a single batch transmission.</p>
          </div>

          <div className="feature-grid-item glassmorphic">
            <ShieldCheck className="feature-icon text-success" size={28} />
            <h3>Terminal Audit Logs</h3>
            <p>Verify who is accessing the dashboard with real-time logs displaying terminal IP addresses, browsers, and session start/end timers.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section glassmorphic">
        <h2>Ready to warp?</h2>
        <p>Establish your command cleared profile and manage your vectors today.</p>
        <div className="cta-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-warp btn-lg">
              <span>Go to Command Deck</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-warp btn-lg">
                <span>Warp Now</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                <span>Enter Console</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Space Footer */}
      <footer className="space-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Rocket size={18} className="text-secondary animate-pulse" />
            <span>Cosmic Shortener Deck</span>
          </div>
          <p className="text-muted">© 2026 Space Mainframe Control. All vectors active.</p>
          <div className="footer-status">
            <span className="status-dot"></span>
            <span>All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
