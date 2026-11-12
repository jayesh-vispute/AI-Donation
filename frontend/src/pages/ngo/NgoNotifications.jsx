import React, { useState, useEffect } from 'react';
import { Settings, Search, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import NotificationList from '../../components/common/NotificationList';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export default function NgoNotifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;
  const [hasMore, setHasMore] = useState(false);

  const TABS = [
    { label: t('notification.filterAll', 'All'), value: 'all', tabKey: 'All' },
    { label: `${t('notification.filterUnread', 'Unread')} (${unreadCount})`, value: 'unread', tabKey: 'Unread' },
    { label: t('notification.types.donations', 'Donations'), value: 'donations', tabKey: 'Donations' },
    { label: t('notification.types.pickups', 'Pickups'), value: 'pickups', tabKey: 'Pickups' },
    { label: t('notification.types.system', 'System'), value: 'system', tabKey: 'System' }
  ];

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [activeTab, page]);

  // Debounced Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchNotifications();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.getUnreadCount();
      setUnreadCount(res.count);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (page - 1) * limit,
        limit: limit + 1, // fetch one extra to check if there are more
      };
      
      if (activeTab === 'Unread') {
        params.unread_only = true;
      } else if (activeTab !== 'All') {
        params.type = activeTab.toLowerCase();
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      const res = await api.getNotifications(params);
      
      if (res.length > limit) {
        setHasMore(true);
        setNotifications(res.slice(0, limit));
      } else {
        setHasMore(false);
        setNotifications(res);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError(t('errors.failedLoadNotifications', 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      fetchUnreadCount(); // update local unread badge
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.ngo', 'NGO'), to: '/ngo' },
            { label: t('navigation.notifications', 'Notifications') }
          ]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A1A1A', fontFamily: '"Playfair Display", serif', margin: 0 }}>{t('navigation.notifications', 'Notifications')}</h1>
            {unreadCount > 0 && (
              <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
                {t('common.unreadNotifications', { count: unreadCount, defaultValue: '{{count}} unread' })}
              </span>
            )}
          </div>
          <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>{t('donor.notificationsDesc', 'Stay updated with your donations and pickups.')}</p>
          <p style={{ color: '#10B981', fontSize: '14px', fontStyle: 'italic', marginTop: '4px' }}>
            🌿 Together, we make a bigger impact.
          </p>
        </div>
        
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #EAE5DE', cursor: 'pointer', color: '#2B1D14', fontWeight: 600 }}>
          <Settings size={18} /> {t('ngo.notificationSettings', 'Notification Settings')}
        </button>
      </div>

      {/* Filters Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {TABS.map(tab => (
            <button
              key={tab.tabKey}
              onClick={() => { setActiveTab(tab.tabKey); setPage(1); }}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: activeTab === tab.tabKey ? 'none' : '1px solid #EAE5DE',
                backgroundColor: activeTab === tab.tabKey ? '#E86A33' : '#fff',
                color: activeTab === tab.tabKey ? '#fff' : '#4B5563',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', flex: '1 1 auto', maxWidth: '300px', minWidth: '130px' }}>
            <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder={t('notification.searchPlaceholder', 'Search notifications...')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #EAE5DE', width: '100%', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', backgroundColor: '#fff', fontWeight: 500, color: '#1A1A1A', cursor: 'pointer', flex: '0 0 auto' }}>
            <option>Newest First</option>
            <option>Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {error ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FEF2F2', borderRadius: '12px', color: '#DC2626' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
          <p>{error}</p>
          <button onClick={fetchNotifications} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t('common.retry', 'Retry')}</button>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '3px solid #EAE5DE', borderTopColor: '#E86A33', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <NotificationList notifications={notifications} onMarkRead={handleMarkRead} />
      )}

      {/* Pagination Footer */}
      {!loading && !error && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, (page - 1) * limit + notifications.length)} notifications
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid #EAE5DE', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
            >
              &lt;
            </button>
            <button style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E86A33', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}>
              {page}
            </button>
            <button 
              disabled={!hasMore}
              onClick={() => setPage(p => p + 1)}
              style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid #EAE5DE', borderRadius: '6px', cursor: !hasMore ? 'not-allowed' : 'pointer', opacity: !hasMore ? 0.5 : 1 }}
            >
              &gt;
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
