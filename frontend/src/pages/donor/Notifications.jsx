import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Truck, Package, PackageCheck, FileText, Heart, Leaf, ChevronRight, Check, Users, Clock, X, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';
import { translateNotification } from '../../utils/notificationI18n';

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All'); // 'All', 'Unread', 'Read'
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNotifications();
      const list = Array.isArray(data) ? data : [];
      // Sort by latest first
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setNotifications(list);
    } catch (err) {
      setError(t('errors.failedLoadNotifications', 'Unable to load notifications. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id);
    }
    setSelectedNotification(notification);
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await handleMarkRead(n.id);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.filter(n => n.is_read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'Unread') return !n.is_read;
    if (filter === 'Read') return n.is_read;
    return true;
  });

  const getNotificationStyle = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('match')) {
      return { bg: '#F2F6FE', iconBg: '#E0E7FF', iconColor: '#3B82F6', dotColor: '#3B82F6', icon: <Users size={20} /> };
    }
    if (t.includes('pickup')) {
      return { bg: '#F0FDF4', iconBg: '#DCFCE7', iconColor: '#16A34A', dotColor: '#16A34A', icon: <Truck size={20} /> };
    }
    if (t.includes('collect')) {
      return { bg: '#FFFBEB', iconBg: '#FEF3C7', iconColor: '#D97706', dotColor: '#D97706', icon: <Package size={20} /> };
    }
    if (t.includes('deliver') || t.includes('complete')) {
      return { bg: '#F0FDF4', iconBg: '#DCFCE7', iconColor: '#16A34A', dotColor: '#16A34A', icon: <CheckCircle size={20} /> };
    }
    if (t.includes('acknowledg')) {
      return { bg: '#FAF5FF', iconBg: '#F3E8FF', iconColor: '#9333EA', dotColor: '#9333EA', icon: <FileText size={20} /> };
    }
    // Default
    return { bg: '#FDF1EB', iconBg: '#FEF3E4', iconColor: '#C4622D', dotColor: '#C4622D', icon: <Bell size={20} /> };
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return t('time.justNow', 'Just now');
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (isNaN(seconds) || seconds < 0) return t('time.justNow', 'Just now');
    let interval = seconds / 31536000;
    if (interval > 1) return t('time.yearsAgo', '{{count}} years ago', { count: Math.floor(interval) });
    interval = seconds / 2592000;
    if (interval > 1) return t('time.monthsAgo', '{{count}} months ago', { count: Math.floor(interval) });
    interval = seconds / 86400;
    if (interval > 1) return t('time.daysAgo', '{{count}} days ago', { count: Math.floor(interval) });
    interval = seconds / 3600;
    if (interval > 1) return t('time.hoursAgo', '{{count}} hours ago', { count: Math.floor(interval) });
    interval = seconds / 60;
    if (interval > 1) return t('time.minutesAgo', '{{count}} minutes ago', { count: Math.floor(interval) });
    return t('time.secondsAgo', '{{count}} seconds ago', { count: Math.floor(seconds) });
  };

  return (
    <div style={{ 
      fontFamily: 'Inter, sans-serif',
      color: '#2B1D14'
    }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.donor', 'Donor'), to: '/donor' },
            { label: t('navigation.notifications', 'Notifications') }
          ]} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontFamily: 'Fraunces, serif', margin: 0, color: '#2B1D14', fontWeight: 700 }}>{t('navigation.notifications', 'Notifications')}</h1>
            {unreadCount > 0 && (
              <span style={{ backgroundColor: '#E0F2FE', color: '#0284C7', padding: '4px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: 600 }}>
                {t('donor.unreadCount', { count: unreadCount, defaultValue: '{{count}} unread' })}
              </span>
            )}
          </div>
          <p style={{ color: '#4A3D34', fontSize: '16px', margin: 0 }}>
            {t('donor.notificationsDesc', 'Stay updated on your donation activities.')}
          </p>
        </div>

        {/* Decorative Quote */}
        <div style={{ textAlign: 'right', color: '#654B35', paddingTop: '16px' }}
             dangerouslySetInnerHTML={{ __html: t('donor.goodThingsQuote', '<h3 style="font-size: clamp(16px, 2vw, 24px); font-family: Fraunces, serif; font-style: italic; margin: 0; font-weight: 500">Good things happen</h3><h3 style="font-size: clamp(16px, 2vw, 24px); font-family: Fraunces, serif; font-style: italic; margin: 0; font-weight: 500">when you care. ♡</h3>') }}>
        </div>
      </div>

      {/* Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '100px', padding: '4px', overflowX: 'auto' }}>
          {[
            { id: 'All', label: `${t('donor.filterAll', 'All')} (${notifications.length})` },
            { id: 'Unread', label: `${t('donor.filterUnread', 'Unread')} (${unreadCount})` },
            { id: 'Read', label: `${t('donor.filterRead', 'Read')} (${readCount})` }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '10px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 600,
                border: 'none',
                backgroundColor: filter === f.id ? '#C4622D' : 'transparent',
                color: filter === f.id ? 'white' : '#654B35',
                cursor: 'pointer', transition: 'all 0.2s ease',
                flexShrink: 0, whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: 'transparent', border: '1px solid #C4622D', borderRadius: '8px',
              padding: '10px 16px', fontSize: '14px', fontWeight: 600, color: '#C4622D', cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FDF1EB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <CheckCircle size={18} /> {t('donor.markAllAsRead', 'Mark all as read')}
          </button>
        )}
      </div>

      {/* Timeline Content */}
      <div style={{ position: 'relative', paddingLeft: '32px' }}>
        
        {/* Vertical Line */}
        <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '24px', width: '2px', backgroundColor: '#EAE5DE', zIndex: 0 }} />

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: '100px', backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '12px', animation: 'pulse 1.5s infinite', marginLeft: '16px' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '24px', borderRadius: '12px', textAlign: 'center', marginLeft: '16px' }}>
            {error} <br/>
            <button onClick={fetchNotifications} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#991B1B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{t('common.retry', 'Retry')}</button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#654B35', marginLeft: '16px', backgroundColor: '#FDFCFB', borderRadius: '16px', border: '1px dashed #EAE5DE' }}>
            <Bell size={48} color="#EAE5DE" style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#2B1D14' }}>{t('empty.noNotificationsTitle', 'No notifications')}</h3>
            <p style={{ margin: 0 }}>{t('empty.caughtUp', "You're all caught up!")}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredNotifications.map((notification) => {
              const style = getNotificationStyle(notification.type || notification.title);
              const localized = translateNotification(notification, t);
              
              return (
                <div key={notification.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  
                  {/* Timeline Dot */}
                  <div style={{ 
                    position: 'absolute', left: '-32px', width: '12px', height: '12px', 
                    borderRadius: '50%', backgroundColor: style.dotColor, 
                    border: '2px solid white', zIndex: 1, top: '50%', transform: 'translateY(-50%)'
                  }} />

                  {/* Notification Card */}
                  <div 
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      flex: 1,
                      backgroundColor: style.bg,
                      border: '1px solid',
                      borderColor: notification.is_read ? 'transparent' : '#EAE5DE',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: notification.is_read ? 0.8 : 1,
                      flexWrap: 'wrap'
                    }}
                  >
                    
                    <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: style.iconBg, color: style.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {style.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#2B1D14' }}>
                          {localized.title}
                        </h4>
                        {!notification.is_read && (
                          <span style={{ backgroundColor: '#E0F2FE', color: '#0284C7', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>
                            {t('donor.newBadge', 'New')}
                          </span>
                        )}
                      </div>
                      
                      <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#4A3D34' }}>
                        {localized.message}
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8C7A6B' }}>
                        <Clock size={12} />
                        {timeAgo(notification.created_at)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      {/* Unread dot indicator */}
                      <div style={{ 
                        width: '8px', height: '8px', borderRadius: '50%', 
                        backgroundColor: notification.is_read ? '#D4D4D8' : '#16A34A',
                        alignSelf: 'flex-start', marginTop: '4px'
                      }} />

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
                        style={{
                          backgroundColor: 'white', border: '1px solid #EAE5DE', color: '#2B1D14',
                          borderRadius: '8px', padding: '8px 16px', fontWeight: 600, fontSize: '14px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          cursor: 'pointer', flexShrink: 0
                        }}
                      >
                        {t('donor.viewDetails', 'View Details')} <ChevronRight size={16} />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Banner */}
      <div style={{ 
        backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
        padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: '40px', marginLeft: '0', flexWrap: 'wrap', gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', flex: '1 1 280px' }}>
            <div style={{ color: '#2F7A4F', flexShrink: 0 }}>
              <Leaf size={40} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <h3 style={{ fontSize: '18px', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: '0 0 4px 0', color: '#2B1D14' }}>
                {t('donor.thankYouChangemaker', 'Thank you for being a changemaker!')}
              </h3>
              <p style={{ margin: 0, fontSize: '15px', color: '#654B35', lineHeight: 1.5 }}>
                {t('donor.donationsHelpDesc', 'Your donations help build stronger, kinder communities.')}
              </p>
            </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ 
            backgroundColor: '#FDF1EB', padding: '14px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4622D', flexShrink: 0
          }}>
            <Heart fill="currentColor" size={28} />
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'Fraunces, serif', color: '#654B35', fontStyle: 'italic', fontSize: '16px' }}
               dangerouslySetInnerHTML={{ __html: t('donor.togetherForBetterQuote', 'Together<br/>for a Better<br/>Tomorrow. ♡') }}>
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(43, 29, 20, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedNotification(null)}
        >
          <div 
            style={{
              backgroundColor: '#FDFCFB',
              borderRadius: '24px',
              border: '1px solid #EAE5DE',
              maxWidth: '520px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedNotification(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#F5F2ED',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#654B35'
              }}
            >
              <X size={20} />
            </button>

            {/* Modal Header Icon & Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: getNotificationStyle(selectedNotification.type || selectedNotification.title).iconBg,
                color: getNotificationStyle(selectedNotification.type || selectedNotification.title).iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getNotificationStyle(selectedNotification.type || selectedNotification.title).icon}
              </div>
              <div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#C4622D',
                  backgroundColor: '#FDF1EB',
                  padding: '4px 12px',
                  borderRadius: '100px'
                }}>
                  {t(`notifications.types.${(selectedNotification.type || 'Notification').toLowerCase()}`, selectedNotification.type || 'Notification')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8C7A6B', marginTop: '6px' }}>
                  <Clock size={13} />
                  {timeAgo(selectedNotification.created_at)}
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '24px',
              fontWeight: 700,
              color: '#2B1D14',
              margin: '0 0 12px 0'
            }}>
              {selectedNotification.title}
            </h2>

            {/* Message Box */}
            <div style={{
              backgroundColor: '#F7F5F0',
              borderRadius: '14px',
              padding: '18px 20px',
              border: '1px solid #EAE5DE',
              marginBottom: '24px'
            }}>
              <p style={{
                margin: 0,
                fontSize: '15px',
                color: '#4A3D34',
                lineHeight: '1.6'
              }}>
                {selectedNotification.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedNotification(null)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '100px',
                  border: '1px solid #EAE5DE',
                  backgroundColor: 'transparent',
                  color: '#654B35',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {t('common.close', 'Close')}
              </button>

              <button
                onClick={() => {
                  const notif = selectedNotification;
                  setSelectedNotification(null);
                  if (notif.related_entity_type === 'donation' || notif.type?.includes('donation')) {
                    if (notif.related_entity_id) {
                      navigate(`/donations/${notif.related_entity_id}`);
                    } else {
                      navigate('/donations');
                    }
                  } else if (notif.related_entity_type === 'match' || notif.type?.includes('match')) {
                    navigate('/matches');
                  } else if (notif.related_entity_type === 'pickup' || notif.type?.includes('pickup')) {
                    if (notif.related_entity_id) {
                      navigate(`/pickup/${notif.related_entity_id}`);
                    } else {
                      navigate('/donations');
                    }
                  } else {
                    navigate('/donations');
                  }
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '100px',
                  border: 'none',
                  backgroundColor: '#C4622D',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(196, 98, 45, 0.25)'
                }}
              >
                <span>
                  {selectedNotification.related_entity_type === 'donation' || selectedNotification.type?.includes('donation')
                    ? t('donor.viewDonationDetails', 'View Donation Details')
                    : selectedNotification.related_entity_type === 'match' || selectedNotification.type?.includes('match')
                    ? t('donor.viewMatches', 'View Matches')
                    : selectedNotification.related_entity_type === 'pickup' || selectedNotification.type?.includes('pickup')
                    ? t('donor.viewPickupStatus', 'View Pickup Status')
                    : t('donor.viewActivityDetails', 'View Activity Details')}
                </span>
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
