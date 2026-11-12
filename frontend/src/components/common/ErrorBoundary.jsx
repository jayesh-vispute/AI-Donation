import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, sans-serif',
          color: '#2B1D14',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            background: '#FFFFFF',
            border: '1px solid #EAE5DE',
            borderRadius: '16px',
            padding: '32px 24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', margin: '0 0 10px 0', color: '#991B1B' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#6B5E59', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              An unexpected error occurred while loading this page. Please try refreshing or return to the dashboard.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#C4622D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  backgroundColor: '#FAF6F0',
                  color: '#2B1D14',
                  border: '1px solid #EAE5DE',
                  borderRadius: '100px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
