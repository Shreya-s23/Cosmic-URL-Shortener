import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertOctagon, Home } from 'lucide-react';

const Expired = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || 'route';
  const reason = searchParams.get('reason');
  const isSuspended = reason === 'suspended';

  return (
    <div className="auth-container">
      <div className="auth-card glassmorphic text-center" style={{ border: isSuspended ? '1px solid rgba(244, 63, 94, 0.3)' : undefined }}>
        <div className={`auth-logo ${isSuspended ? 'text-error animate-pulse' : 'text-warning'}`}>
          <AlertOctagon size={36} className="logo-spark" />
        </div>
        <h1>{isSuspended ? 'Transmission Deactivated' : 'Transmission Expired'}</h1>
        <p style={{ margin: '1.5rem 0', color: '#94a3b8' }}>
          {isSuspended ? (
            <>
              Access to shortcode <strong className="text-error font-mono">[{code}]</strong> has been deactivated because the creator's command clearance has been suspended for security policy violations.
            </>
          ) : (
            <>
              The orbital timeline for shortcode <strong className="text-warning font-mono">[{code}]</strong> has run out. This link's decay counter has reached zero and it is no longer active.
            </>
          )}
        </p>
        <Link to="/" className="btn btn-primary btn-warp">
          <Home size={16} />
          <span>Return to Headquarters</span>
        </Link>
      </div>
    </div>
  );
};

export default Expired;
