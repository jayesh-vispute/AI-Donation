import React from 'react';
import { AlertCircle, FileBox } from 'lucide-react';
import DonorButton from './DonorButton';
import '../../pages/donor/donor-theme.css';

export function DonorEmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6) var(--space-4)',
      textAlign: 'center',
      backgroundColor: 'var(--neutral-0)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-warm)',
      border: '1px solid #EAE5DE'
    }}>
      <div style={{
        width: 64, height: 64, 
        backgroundColor: 'var(--neutral-100)', 
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 'var(--space-4)',
        color: 'var(--primary-600)'
      }}>
        <FileBox size={32} strokeWidth={1.5} />
      </div>
      <h3 style={{ marginBottom: 'var(--space-2)' }}>{title}</h3>
      <p style={{ color: 'var(--neutral-600)', marginBottom: 'var(--space-4)', maxWidth: 400 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <DonorButton variant="primary" onClick={onAction}>
          {actionLabel}
        </DonorButton>
      )}
    </div>
  );
}

export function DonorErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-5)',
      backgroundColor: '#FEF2F2',
      borderRadius: 'var(--radius-card)',
      border: '1px solid #FCA5A5'
    }}>
      <AlertCircle size={32} color="var(--error-600)" style={{ marginBottom: 'var(--space-3)' }} />
      <p style={{ color: 'var(--error-600)', fontWeight: '500', marginBottom: 'var(--space-4)' }}>
        {message}
      </p>
      {onRetry && (
        <DonorButton variant="outline" onClick={onRetry} style={{ borderColor: 'var(--error-600)', color: 'var(--error-600)' }}>
          Try Again
        </DonorButton>
      )}
    </div>
  );
}

export function DonorSkeleton({ type = 'card' }) {
  // A simple skeleton pulsing animation
  const skeletonBase = {
    backgroundColor: '#EAE5DE',
    borderRadius: 'var(--radius-card)',
    animation: 'pulse 1.5s infinite ease-in-out',
  };

  if (type === 'timeline') {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', ...skeletonBase }}></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ width: '40%', height: 20, ...skeletonBase }}></div>
          <div style={{ width: '60%', height: 16, ...skeletonBase }}></div>
        </div>
      </div>
    );
  }

  // Default card skeleton
  return (
    <div style={{ 
      padding: 'var(--space-4)', 
      backgroundColor: 'var(--neutral-0)', 
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-warm)',
      border: '1px solid #EAE5DE',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }}>
      <div style={{ width: '30%', height: 24, ...skeletonBase }}></div>
      <div style={{ width: '100%', height: 16, ...skeletonBase }}></div>
      <div style={{ width: '80%', height: 16, ...skeletonBase }}></div>
      <div style={{ width: '100px', height: 40, borderRadius: 'var(--radius-btn)', ...skeletonBase, marginTop: 'var(--space-2)' }}></div>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
