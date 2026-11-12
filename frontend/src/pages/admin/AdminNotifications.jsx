import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import NotificationList from '../../components/common/NotificationList';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { api } from '../../services/api';

export default function AdminNotifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.getNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };
  const unreadCount = notifications.filter((n) => !n.is_read && !n.read).length;

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.admin', 'Admin'), to: '/admin' },
        { label: t('navigation.notifications', 'Notifications') }
      ]} />
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1>{t('admin.notificationsTitle', 'Notifications')}</h1>
          {unreadCount > 0 && <span className="badge badge-primary">{t('common.unreadNotifications', { count: unreadCount, defaultValue: '{{count}} unread' })}</span>}
        </div>
        <p>{t('admin.notificationsDesc', 'System alerts and administrative updates.')}</p>
      </div>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>{t('admin.loadingNotifications', 'Loading notifications...')}</div>
      ) : (
        <NotificationList notifications={notifications} onMarkRead={handleMarkRead} />
      )}
    </div>
  );
}
