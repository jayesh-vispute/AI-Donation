import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

export default function NotificationBell() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.getUnreadCount();
        setCount(res.count);
      } catch (err) {
        console.error("Failed to fetch notification count", err);
      }
    };
    fetchCount();
  }, []);

  const handleClick = () => {
    if (role === 'admin') navigate('/admin/notifications');
    else if (role === 'ngo') navigate('/ngo/notifications');
    else navigate('/donor/notifications');
  };

  return (
    <button
      className="btn btn-ghost btn-icon btn-sm notification-bell"
      onClick={handleClick}
      aria-label={count > 0 ? t('common.unreadNotifications', { count, defaultValue: `Notifications, {{count}} unread` }) : t('common.notifications', 'Notifications')}
    >
      <Bell size={20} />
      {count > 0 && <span className="notification-badge-count">{count}</span>}
    </button>
  );
}
