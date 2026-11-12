import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import DownloadAppButton from './DownloadAppButton';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('navigation.openSidebar', 'Open sidebar')}
            >
              <Menu size={24} />
            </button>
          </div>
          <div className="dashboard-topbar-right">
            <DownloadAppButton variant="topbar" />
            <NotificationBell />
            <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 8px', minWidth: 0, flexShrink: 1 }} onClick={() => window.location.href = `/${role === 'admin' ? 'admin' : role === 'ngo' ? 'ngo' : 'donor'}/profile`}>
              <div className="sidebar-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem', backgroundColor: 'var(--neutral-600)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="sidebar-user-name-container" style={{ display: 'flex', flexDirection: 'column', paddingRight: '8px', minWidth: 0, flexShrink: 1 }}>
                <span style={{ 
                  fontSize: '14px', fontWeight: 500, color: 'var(--neutral-900)', 
                  wordBreak: 'break-word', display: 'block'
                }}>
                  {t('common.helloUser', { name: user?.displayName || user?.email?.split('@')[0] || 'User', defaultValue: 'Hello, {{name}}' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
