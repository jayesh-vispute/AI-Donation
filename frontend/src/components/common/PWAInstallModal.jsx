import React from 'react';
import { usePWA } from '../../contexts/PWAContext';
import { Monitor, Smartphone, Download, CheckCircle, X, Compass, Globe, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function PWAInstallModal() {
  const { isModalOpen, setIsModalOpen, installPWA, isInstalled, hasPrompt } = usePWA();

  if (!isModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={() => setIsModalOpen(false)}
    >
      <div
        style={{
          background: 'var(--surface, #FAF6F0)',
          borderRadius: '24px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid var(--border, #E6DEC6)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #C4622D 0%, #E87A3E 100%)',
            padding: '1.75rem 1.5rem',
            color: '#FFFFFF',
            position: 'relative'
          }}
        >
          <button
            onClick={() => setIsModalOpen(false)}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                color: '#C4622D'
              }}
            >
              <Monitor size={26} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                Download Donation AI Desktop App
              </h2>
              <p style={{ margin: '2px 0 0', opacity: 0.9, fontSize: '0.88rem' }}>
                Install Progressive Web App for Desktop & Mobile
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
          {isInstalled ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#E8F5E9',
                  color: '#2E7D32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}
              >
                <CheckCircle size={36} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main, #2D2522)', margin: '0 0 0.5rem' }}>
                Donation AI App is Installed!
              </h3>
              <p style={{ color: 'var(--text-secondary, #6B5E59)', fontSize: '0.92rem', margin: 0 }}>
                You are currently running the official Desktop Progressive Web App. You can access it directly from your applications menu or taskbar.
              </p>
            </div>
          ) : (
            <>
              {/* Main Action Trigger */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => {
                    installPWA();
                  }}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #C4622D 0%, #A54F21 100%)',
                    color: '#FFFFFF',
                    padding: '0.85rem 2rem',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(196, 98, 45, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Download size={20} />
                  {hasPrompt ? 'Install App Instantly' : 'Trigger Installation Prompt'}
                </button>
              </div>

              {/* PWA Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ background: '#FFFDF9', border: '1px solid #E6DEC6', padding: '0.85rem 0.6rem', borderRadius: '12px', textAlign: 'center' }}>
                  <Zap size={20} color="#C4622D" style={{ marginBottom: '4px' }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2D2522' }}>Fast Load</div>
                  <div style={{ fontSize: '0.72rem', color: '#8B8176' }}>Instant startup</div>
                </div>
                <div style={{ background: '#FFFDF9', border: '1px solid #E6DEC6', padding: '0.85rem 0.6rem', borderRadius: '12px', textAlign: 'center' }}>
                  <Sparkles size={20} color="#C4622D" style={{ marginBottom: '4px' }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2D2522' }}>AI Features</div>
                  <div style={{ fontSize: '0.72rem', color: '#8B8176' }}>Camera & AI model</div>
                </div>
                <div style={{ background: '#FFFDF9', border: '1px solid #E6DEC6', padding: '0.85rem 0.6rem', borderRadius: '12px', textAlign: 'center' }}>
                  <ShieldCheck size={20} color="#C4622D" style={{ marginBottom: '4px' }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2D2522' }}>Offline Mode</div>
                  <div style={{ fontSize: '0.72rem', color: '#8B8176' }}>Access anywhere</div>
                </div>
              </div>

              {/* Instructions per browser */}
              <div style={{ background: '#F5EFE6', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E2D9C5' }}>
                <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 700, color: '#2D2522', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={18} color="#C4622D" /> Manual Installation Steps by Browser:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#45382F' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <div style={{ background: '#C4622D', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>1</div>
                    <div>
                      <strong>Google Chrome / Microsoft Edge (Desktop):</strong> Look at the right side of your browser address bar and click the <strong>Install / App available (⊕ or 💻)</strong> icon, then select <em>Install</em>.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <div style={{ background: '#C4622D', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>2</div>
                    <div>
                      <strong>Chrome Menu (Alternative):</strong> Click the <strong>⋮ (3 dots) menu</strong> in top right &rarr; <em>Save and share</em> &rarr; <em>Install Donation AI...</em>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <div style={{ background: '#C4622D', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>3</div>
                    <div>
                      <strong>Safari / macOS & iOS:</strong> Click the <strong>Share button</strong> &rarr; Select <em>Add to Dock / Home Screen</em>.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', background: '#FAF6F0', borderTop: '1px solid var(--border, #E6DEC6)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setIsModalOpen(false)}
            style={{ borderRadius: '8px', padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
