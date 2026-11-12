import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ErrorMessage({ message, onRetry }) {
  const { t } = useTranslation();
  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'var(--error-light)',
        border: '1px solid var(--error)',
        color: 'var(--error-dark)',
        padding: '1rem',
        borderRadius: 'var(--radius)',
        margin: '1rem 0',
      }}
    >
      <AlertTriangle size={24} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{t('common.error', 'Error')}</h4>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>{message}</p>
      </div>
      {onRetry && (
        <button className="btn btn-sm btn-secondary" onClick={onRetry}>
          {t('common.retry', 'Retry')}
        </button>
      )}
    </div>
  );
}
