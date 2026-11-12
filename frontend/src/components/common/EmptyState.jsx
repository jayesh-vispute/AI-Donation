import { PackageOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EmptyState({ icon: Icon = PackageOpen, title, message = '', action, actionLabel }) {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={80} />
      </div>
      <h3 className="empty-state-title">{title || t('empty.noData', 'No data')}</h3>
      {message && <p className="empty-state-text">{message}</p>}
      {action && (
        <button className="btn btn-primary mt-4" onClick={action}>
          {actionLabel || t('actions.getStarted', 'Get Started')}
        </button>
      )}
    </div>
  );
}
