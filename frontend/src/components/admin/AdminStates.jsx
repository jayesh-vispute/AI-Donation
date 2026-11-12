import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminButton from './AdminButton';

export function AdminEmptyState({ message, icon: Icon, action }) {
  const { t } = useTranslation();
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-6) var(--space-4)', backgroundColor: 'var(--neutral-0)',
      borderRadius: 'var(--radius-card)', border: '1px solid var(--neutral-300)',
      textAlign: 'center'
    }}>
      {Icon && <Icon size={40} color="var(--neutral-300)" style={{ marginBottom: 'var(--space-3)' }} />}
      <p style={{ color: 'var(--neutral-600)', fontSize: '15px', margin: '0 0 var(--space-4) 0' }}>
        {message || t('empty.noDataAvailable', 'No data available.')}
      </p>
      {action}
    </div>
  );
}

export function AdminErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-5) var(--space-4)', backgroundColor: '#FDF7F7',
      borderRadius: 'var(--radius-card)', border: '1px solid var(--error-600)',
      textAlign: 'center'
    }}>
      <AlertCircle size={32} color="var(--error-600)" style={{ marginBottom: 'var(--space-2)' }} />
      <p style={{ color: 'var(--error-600)', fontSize: '15px', fontWeight: 500, margin: '0 0 var(--space-3) 0' }}>
        {message || t('errors.somethingWentWrong', 'Something went wrong.')}
      </p>
      {onRetry && (
        <AdminButton variant="destructive" onClick={onRetry}>
          <RotateCw size={16} /> {t('common.retry', 'Retry')}
        </AdminButton>
      )}
    </div>
  );
}

export function AdminTableSkeleton({ columns = 5, rows = 5 }) {
  return (
    <div style={{ backgroundColor: 'var(--neutral-0)', borderRadius: 'var(--radius-card)', border: '1px solid var(--neutral-300)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--neutral-300)', backgroundColor: 'var(--neutral-100)', padding: '12px 16px' }}>
        {Array(columns).fill(0).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 16, backgroundColor: 'var(--neutral-300)', borderRadius: 4, marginRight: i === columns - 1 ? 0 : 16 }}></div>
        ))}
      </div>
      {Array(rows).fill(0).map((_, r) => (
        <div key={r} style={{ display: 'flex', borderBottom: '1px solid var(--neutral-300)', padding: '16px', opacity: 1 - (r * 0.15) }}>
          {Array(columns).fill(0).map((_, i) => (
            <div key={i} style={{ 
              flex: 1, height: 14, 
              backgroundColor: 'var(--neutral-300)', 
              borderRadius: 4, 
              marginRight: i === columns - 1 ? 0 : 16,
              maxWidth: i === 0 ? '40%' : '100%' 
            }}></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminCardSkeleton() {
  return (
    <div style={{ backgroundColor: 'var(--neutral-0)', padding: 'var(--space-4)', borderRadius: 'var(--radius-card)', border: '1px solid var(--neutral-300)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'var(--neutral-300)', marginBottom: 'var(--space-3)' }}></div>
      <div style={{ height: 24, width: '60%', backgroundColor: 'var(--neutral-300)', borderRadius: 4, marginBottom: '8px' }}></div>
      <div style={{ height: 14, width: '40%', backgroundColor: 'var(--neutral-300)', borderRadius: 4 }}></div>
    </div>
  );
}
