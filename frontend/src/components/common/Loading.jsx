import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <Loader2
        size={48}
        color="var(--primary)"
        style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}
      />
      <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
        {message}
      </p>
    </div>
  );
}
