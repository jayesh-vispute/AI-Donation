import React from 'react';
import { usePWA } from '../../contexts/PWAContext';
import { MonitorDown, Download, CheckCircle, Laptop } from 'lucide-react';

export default function DownloadAppButton({ variant = 'topbar', className = '', style = {} }) {
  const { installPWA, isInstalled } = usePWA();

  if (isInstalled) {
    return (
      <div
        title="Donation AI Desktop App Installed"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: variant === 'topbar' ? '5px 10px' : '8px 12px',
          borderRadius: '20px',
          background: 'rgba(46, 125, 50, 0.1)',
          color: '#2E7D32',
          fontSize: '0.8rem',
          fontWeight: 600,
          border: '1px solid rgba(46, 125, 50, 0.2)',
          ...style
        }}
      >
        <CheckCircle size={14} />
        <span>Desktop App Installed</span>
      </div>
    );
  }

  if (variant === 'topbar') {
    return (
      <button
        onClick={installPWA}
        className={`btn ${className}`}
        title="Download / Install Donation AI Desktop App"
        aria-label="Download Desktop App"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #C4622D 0%, #A54F21 100%)',
          color: '#FFFFFF',
          fontSize: '0.82rem',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(196, 98, 45, 0.25)',
          transition: 'transform 0.15s ease, boxShadow 0.15s ease',
          whiteSpace: 'nowrap',
          ...style
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(196, 98, 45, 0.35)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(196, 98, 45, 0.25)';
        }}
      >
        <MonitorDown size={16} />
        <span>Download Desktop App</span>
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={installPWA}
        className={`sidebar-link ${className}`}
        title="Install Desktop App"
        aria-label="Install Desktop App"
        style={{
          color: '#C4622D',
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
          ...style
        }}
      >
        <Laptop size={20} className="icon" />
        <span>Download Desktop App</span>
      </button>
    );
  }

  if (variant === 'navbar') {
    return (
      <button
        onClick={installPWA}
        className={`btn btn-outline btn-sm ${className}`}
        title="Download Desktop App"
        aria-label="Download Desktop App"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          borderColor: '#C4622D',
          color: '#C4622D',
          fontSize: '0.85rem',
          fontWeight: 600,
          borderRadius: '8px',
          ...style
        }}
      >
        <Download size={16} />
        <span>Download App</span>
      </button>
    );
  }

  // Card / Settings variant
  return (
    <button
      onClick={installPWA}
      className={`btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #C4622D 0%, #A54F21 100%)',
        color: '#FFFFFF',
        fontWeight: 600,
        fontSize: '0.9rem',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(196, 98, 45, 0.3)',
        ...style
      }}
    >
      <MonitorDown size={18} />
      <span>Download & Install Desktop App</span>
    </button>
  );
}
