import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="auth-page">
      <div style={{ textAlign: 'center' }}>
        <FileQuestion size={80} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>404</h1>
        <h2 style={{ marginBottom: '0.5rem' }}>{t('error.pageNotFound', 'Page Not Found')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
          {t('error.pageDoesNotExist', 'The page you\'re looking for doesn\'t exist or has been moved.')}
        </p>
        <Link to="/" className="btn btn-primary">
          <Home size={18} /> {t('common.goHome', 'Go Home')}
        </Link>
      </div>
    </div>
  );
}
