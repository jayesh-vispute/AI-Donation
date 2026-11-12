import { Bell, GitCompare, Truck, Package, CheckCircle, AlertTriangle, UserPlus, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateNotification } from '../../utils/notificationI18n';

const typeIcons = {
  donations: Package,
  match: GitCompare,
  pickups: Truck,
  pickup: Truck,
  collected: Package,
  delivered: CheckCircle,
  acknowledged: CheckCircle,
  update: Bell,
  reminder: Bell,
  registration: UserPlus,
  system: Activity,
  demand: AlertTriangle,
};

export default function NotificationList({ notifications, onMarkRead }) {
  const { t } = useTranslation();
  if (!notifications || notifications.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <Bell size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
        <p className="text-secondary">{t('empty.noNotifications', 'No notifications yet')}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {notifications.map((notif) => {
        const Icon = typeIcons[notif.type] || Bell;
        const localized = translateNotification(notif, t);
        return (
          <div
            key={notif.id}
            className="card"
            style={{
              padding: '1rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              borderLeft: notif.is_read ? 'none' : '3px solid var(--primary)',
              cursor: 'pointer',
              background: notif.is_read ? 'var(--surface)' : 'var(--primary-50)',
            }}
            onClick={() => onMarkRead?.(notif.id)}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius)',
                backgroundColor: notif.is_read ? 'var(--surface-hover)' : 'var(--primary-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: notif.is_read ? 'var(--text-muted)' : 'var(--primary)',
              }}
            >
              <Icon size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                {localized.title}
                {localized.typeLabel && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#3B82F6', fontWeight: 500, textTransform: 'capitalize' }}>
                    {localized.typeLabel}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {localized.message}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                {new Date(notif.created_at).toLocaleString()}
              </div>
            </div>
            {!notif.is_read && (
              <div className="status-dot status-dot-success" style={{ marginTop: '0.3rem' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
