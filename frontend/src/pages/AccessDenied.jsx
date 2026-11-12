import { Link } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AccessDenied() {
  const { t } = useTranslation();
  return (
    <div className="auth-page">
      <div style={{ textAlign: 'center' }}>
        <ShieldOff size={80} color="var(--error)" style={{ opacity: 0.5, marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--error)', marginBottom: '0.5rem' }}>{t('error.accessDenied', 'Access Denied')}</h1>
        <h2 style={{ marginBottom: '0.5rem' }}>{t('error.noPermission', 'You don\'t have permission to view this page')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
          {t('error.contactAdmin', 'Please contact an administrator if you believe this is an error.')}
        </p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={18} /> {t('common.goHome', 'Go Home')}
        </Link>
      </div>
    </div>
  );
}
