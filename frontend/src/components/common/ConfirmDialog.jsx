import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, variant = 'danger', onConfirm, onCancel }) {
  const { t } = useTranslation();
  if (!open) return null;

  const iconColors = {
    danger: { bg: 'var(--error-light)', color: 'var(--error)' },
    warning: { bg: 'var(--warning-light)', color: 'var(--warning)' },
    success: { bg: 'var(--success-light)', color: 'var(--success)' },
  };

  const btnClass = variant === 'danger' ? 'btn-danger' : variant === 'success' ? 'btn-success' : 'btn-primary';
  const colors = iconColors[variant] || iconColors.danger;

  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon" style={{ backgroundColor: colors.bg, color: colors.color }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="modal-title" id="confirm-title">{title}</h3>
          </div>
        </div>
        <div className="modal-body">{message}</div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel || t('actions.cancel', 'Cancel')}</button>
          <button className={`btn ${btnClass}`} onClick={onConfirm}>{confirmLabel || t('actions.confirm', 'Confirm')}</button>
        </div>
      </div>
    </div>
  );
}
