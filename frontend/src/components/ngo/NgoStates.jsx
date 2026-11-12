import React from 'react';
import { useTranslation } from 'react-i18next';
import { PackageX, AlertTriangle } from 'lucide-react';
import NgoButton from './NgoButton';

export function NgoEmptyState({ 
  icon: Icon = PackageX, 
  title,
  message,
  actionLabel,
  onAction
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('empty.noItemsFound');
  const resolvedMessage = message ?? t('empty.nothingToDisplay');

  return (
    <div style={{
      backgroundColor: 'var(--neutral-0)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-6) var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      border: '1px solid #EAE5DE',
      boxShadow: 'var(--shadow-warm)'
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--neutral-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)',
        color: 'var(--neutral-600)'
      }}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: '20px', margin: '0 0 var(--space-2) 0' }}>{resolvedTitle}</h3>
      <p style={{ color: 'var(--neutral-600)', margin: '0 0 var(--space-4) 0', maxWidth: '400px' }}>{resolvedMessage}</p>
      
      {actionLabel && onAction && (
        <NgoButton variant="primary" onClick={onAction}>
          {actionLabel}
        </NgoButton>
      )}
    </div>
  );
}

export function NgoErrorState({ 
  title,
  message,
  onRetry
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('errors.somethingWentWrong');
  const resolvedMessage = message ?? t('errors.loadDataFailed');

  return (
    <div style={{
      backgroundColor: 'var(--neutral-0)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      border: '1px solid #FCA5A5'
    }}>
      <AlertTriangle size={32} color="var(--error-600)" style={{ marginBottom: 'var(--space-3)' }} />
      <h3 style={{ fontSize: '18px', margin: '0 0 var(--space-2) 0', color: 'var(--neutral-900)' }}>{resolvedTitle}</h3>
      <p style={{ color: 'var(--error-600)', margin: '0 0 var(--space-4) 0', fontSize: '14px' }}>{resolvedMessage}</p>
      
      {onRetry && (
        <NgoButton variant="outline" onClick={onRetry}>
          {t('actions.retry')}
        </NgoButton>
      )}
    </div>
  );
}

export function NgoSkeletonRow() {
  return (
    <div style={{ 
      display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', 
      borderBottom: '1px solid #EAE5DE', alignItems: 'center' 
    }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--neutral-100)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 16, width: '40%', backgroundColor: 'var(--neutral-100)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 12, width: '25%', backgroundColor: 'var(--neutral-100)', borderRadius: 4 }} />
      </div>
      <div style={{ height: 24, width: 80, backgroundColor: 'var(--neutral-100)', borderRadius: 12 }} />
    </div>
  );
}

export function NgoTableSkeleton({ rows = 5 }) {
  return (
    <div style={{ 
      backgroundColor: 'var(--neutral-0)', borderRadius: 'var(--radius-card)', 
      border: '1px solid #EAE5DE', overflow: 'hidden' 
    }}>
      {Array.from({ length: rows }).map((_, i) => (
        <NgoSkeletonRow key={i} />
      ))}
    </div>
  );
}
