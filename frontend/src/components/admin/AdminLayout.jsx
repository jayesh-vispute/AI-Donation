import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, Package, Search, BarChart3, FileText, Settings, Heart, LogOut, Bell, Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../common/LanguageSelector';
import '../../pages/admin/admin-theme.css';

const getAdminNav = (t) => [
  { to: '/admin', icon: LayoutDashboard, label: t('navigation.dashboard', 'Dashboard'), exact: true },
  { to: '/admin/users', icon: Users, label: t('navigation.users', 'Users') },
  { to: '/admin/ngos', icon: Building2, label: t('navigation.ngos', 'NGOs') },
  { to: '/admin/donations', icon: Package, label: t('navigation.donations', 'Donations') },
  { to: '/admin/ai-detection', icon: Search, label: t('navigation.aiDetection', 'AI Detection') },
  { to: '/admin/reports', icon: BarChart3, label: t('navigation.reports', 'Reports') },
  { to: '/admin/audit-logs', icon: FileText, label: t('navigation.auditLogs', 'Audit Logs') },
  { to: '/admin/settings', icon: Settings, label: t('navigation.settings', 'Settings') },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const adminNav = getAdminNav(t);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isDashboard = location.pathname === '/admin' || location.pathname === '/admin/';
  const userInitial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S';

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen && window.innerWidth <= 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="admin-theme">
      <div className="admin-layout">
        
        {/* Mobile Backdrop */}
        <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* Dark Espresso Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {/* Logo Header */}
          <div className="admin-sidebar-header" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(196, 98, 45, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Heart size={22} color="#E66727" fill="#E66727" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
                {t('admin.brandName', 'Donation AI')}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                {t('navigation.adminPanel', 'ADMIN PANEL')}
              </span>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="admin-sidebar-nav">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink 
                  key={item.to} 
                  to={item.to}
                  end={item.exact}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button 
                onClick={handleLogout}
                className="admin-logout-btn"
                title={t('admin.logoutTitle', 'Logout from Admin Panel')}
              >
                <LogOut size={19} color="#E66727" />
                <span>{t('navigation.logout', 'Logout')}</span>
              </button>
            </div>
          </nav>

          {/* Sidebar Footer Watermark */}
          <div className="admin-sidebar-footer">
            <svg 
              className="admin-sidebar-leaf-icon" 
              viewBox="0 0 100 80" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M10 70 C20 40, 50 20, 85 15 C75 45, 55 65, 25 72 Z" 
                stroke="#2F7A4F" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                fill="none" 
                opacity="0.35" 
              />
              <path 
                d="M32 50 C45 35, 65 25, 85 15" 
                stroke="#2F7A4F" 
                strokeWidth="1.8" 
                strokeLinecap="round" 
                opacity="0.3" 
              />
              <path 
                d="M75 45 C88 28, 96 18, 98 12 C90 28, 80 50, 68 58 Z" 
                fill="#2F7A4F" 
                opacity="0.75" 
              />
              <path 
                d="M62 62 C74 50, 84 38, 90 26 C80 40, 72 58, 58 66 Z" 
                fill="#34A853" 
                opacity="0.85" 
              />
            </svg>
            <div className="admin-sidebar-tagline">
              {t('admin.slogan', 'Smarter Giving, Brighter Tomorrows.')}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="admin-main">
          {/* Topbar: Consistent across all admin pages */}
          <header className="admin-topbar">
              {/* Mobile Menu Button */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                  className="mobile-menu-btn" 
                  onClick={() => setSidebarOpen(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginRight: '8px', color: '#1C1611' }}
                  aria-label="Open navigation menu"
                >
                  <Menu size={24} />
                </button>
              </div>

              {/* Left: Global Search Input */}
              <div 
                className="admin-topbar-search"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2DCD5',
                  borderRadius: '10px',
                  padding: '7px 14px',
                  gap: '8px',
                  width: 'min(100%, 320px)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <Search size={15} color="#8A7F72" />
                <input 
                  type="text"
                  placeholder={t('admin.searchUsersPlaceholder', 'Search users, NGOs, donations...')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      navigate(`/admin/users?search=${encodeURIComponent(e.target.value)}`);
                    }
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    color: '#1C1611',
                    width: '100%',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>

              {/* Right: Language + Notification + Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <LanguageSelector />
                {/* Notification Bell */}
                <div 
                  onClick={() => navigate('/admin/notifications')}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2DCD5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                  title={t('navigation.notifications', 'Notifications')}
                >
                  <Bell size={18} color="#221D17" />
                  <span style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    backgroundColor: '#D14343',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #FAF7F2'
                  }}>
                    3
                  </span>
                </div>

                {/* Profile Chip */}
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  onClick={() => navigate('/admin/profile')}
                >
                  <div style={{ 
                    width: 38, height: 38, borderRadius: '50%', backgroundColor: '#221D17', 
                    color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 700, fontSize: '14px', flexShrink: 0
                  }}>
                    {userInitial}
                  </div>
                  <div className="admin-profile-text" style={{ textAlign: 'left', lineHeight: 1.25, minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1611', wordBreak: 'break-word', maxWidth: '120px' }}>{user?.displayName || t('common.admin', 'Admin')}</div>
                    <div style={{ fontSize: '11px', color: '#8A7F72', wordBreak: 'break-word' }}>{t('common.systemOperator', 'System Operator')}</div>
                  </div>
                </div>
              </div>
            </header>
          
          <main className="admin-content">
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}

