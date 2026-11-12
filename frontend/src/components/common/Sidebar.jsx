import { useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart, LayoutDashboard, Search, Camera, Package, GitCompare, Truck, Bell, User,
  ClipboardList, PackagePlus, BarChart3, Building2, Users, Activity, TrendingUp,
  LogOut, FileText, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DownloadAppButton from './DownloadAppButton';

const donorNav = [
  { sectionKey: 'common.main', fallbackSection: 'Main' },
  { to: '/donor', icon: LayoutDashboard, labelKey: 'navigation.dashboard', fallback: 'Dashboard' },
  { to: '/donations', icon: Package, labelKey: 'navigation.myDonations', fallback: 'My Donations' },
  { to: '/donate', icon: Heart, labelKey: 'navigation.donate', fallback: 'Donate' },
  { to: '/detect', icon: Search, labelKey: 'navigation.aiDetection', fallback: 'AI Detection' },
  { to: '/donor/ngos', icon: Building2, labelKey: 'navigation.ngos', fallback: 'NGOs' },
  { sectionKey: 'common.account', fallbackSection: 'Account' },
  { to: '/donor/notifications', icon: Bell, labelKey: 'navigation.notifications', fallback: 'Notifications' },
  { to: '/donor/profile', icon: User, labelKey: 'navigation.profile', fallback: 'Profile' },
  { to: '/donor/settings', icon: CheckCircle, labelKey: 'navigation.settings', fallback: 'Settings' },
];

const ngoNav = [
  { sectionKey: 'common.main', fallbackSection: 'Main' },
  { to: '/ngo', icon: LayoutDashboard, labelKey: 'navigation.dashboard', fallback: 'Dashboard' },
  { to: '/ngo/donations', icon: Package, labelKey: 'navigation.donations', fallback: 'Donations' },
  { to: '/ngo/inventory', icon: ClipboardList, labelKey: 'navigation.inventory', fallback: 'Inventory' },
  { to: '/ngo/item-requests', icon: ClipboardList, labelKey: 'navigation.itemRequests', fallback: 'Item Requests' },
  { to: '/ngo/donors', icon: Users, labelKey: 'navigation.donors', fallback: 'Donors' },
  { to: '/ngo/reports', icon: BarChart3, labelKey: 'navigation.reports', fallback: 'Reports' },
  { sectionKey: 'common.account', fallbackSection: 'Account' },
  { to: '/ngo/notifications', icon: Bell, labelKey: 'navigation.notifications', fallback: 'Notifications' },
  { to: '/ngo/profile', icon: User, labelKey: 'navigation.profile', fallback: 'Profile' },
  { to: '/ngo/settings', icon: CheckCircle, labelKey: 'navigation.settings', fallback: 'Settings' },
];

const adminNav = [
  { sectionKey: 'common.main', fallbackSection: 'Main' },
  { to: '/admin', icon: LayoutDashboard, labelKey: 'navigation.dashboard', fallback: 'Dashboard' },
  { to: '/admin/users', icon: Users, labelKey: 'navigation.users', fallback: 'Users' },
  { to: '/admin/donors', icon: User, labelKey: 'navigation.donors', fallback: 'Donors' },
  { to: '/admin/ngos', icon: Building2, labelKey: 'navigation.ngos', fallback: 'NGOs' },
  { to: '/admin/ngo-approvals', icon: ClipboardList, labelKey: 'navigation.ngoApprovals', fallback: 'NGO Approvals' },
  { to: '/admin/donations', icon: Package, labelKey: 'navigation.donations', fallback: 'Donations' },
  { to: '/admin/categories', icon: PackagePlus, labelKey: 'navigation.categories', fallback: 'Categories' },
  { to: '/admin/ai-detection', icon: Search, labelKey: 'navigation.aiDetection', fallback: 'AI Detection' },
  { to: '/admin/inventory', icon: ClipboardList, labelKey: 'navigation.inventory', fallback: 'Inventory' },
  { to: '/admin/reports', icon: BarChart3, labelKey: 'navigation.reports', fallback: 'Reports' },
  { to: '/admin/audit-logs', icon: FileText, labelKey: 'navigation.auditLogs', fallback: 'Audit Logs' },
  { sectionKey: 'common.account', fallbackSection: 'Account' },
  { to: '/admin/notifications', icon: Bell, labelKey: 'navigation.notifications', fallback: 'Notifications' },
  { to: '/admin/profile', icon: User, labelKey: 'navigation.profile', fallback: 'Profile' },
  { to: '/admin/settings', icon: CheckCircle, labelKey: 'navigation.settings', fallback: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Only lock scroll on mobile when drawer is open
    if (isOpen && window.innerWidth <= 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navItems = role === 'admin' ? adminNav : role === 'ngo' ? ngoNav : donorNav;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userInitial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <>
      <div className={`mobile-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${role === 'donor' ? 'donor-sidebar' : ''}`} role="navigation" aria-label="Sidebar navigation">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" onClick={onClose}>
            <div className="sidebar-logo-icon">
              <Heart size={20} />
            </div>
            Donation <span style={{ color: role === 'donor' ? '#C4622D' : 'inherit' }}>AI</span>
          </Link>
          {role === 'donor' && (
            <div style={{ fontSize: '11px', color: '#8B8176', marginTop: 4, paddingLeft: 12 }}
                 dangerouslySetInnerHTML={{ __html: t('login.hero.tagline', 'Smarter Giving.<br/>Brighter Tomorrows.') }}>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.sectionKey || item.section) {
              const sectionText = item.sectionKey ? t(item.sectionKey, item.fallbackSection) : item.section;
              return (
                <div className="sidebar-section" key={idx}>
                  <div className="sidebar-section-label">{sectionText}</div>
                </div>
              );
            }

            const Icon = item.icon;
            const labelText = item.labelKey ? t(item.labelKey, item.fallback) : item.label;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/donor' || item.to === '/ngo' || item.to === '/admin'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={20} className="icon" />
                {labelText}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: '8px' }}>
            <DownloadAppButton variant="sidebar" />
          </div>
          <button className="sidebar-link" onClick={handleLogout} style={{ color: role === 'donor' ? '#D8D2CA' : 'var(--text-muted)' }}>
            <LogOut size={20} className="icon" />
            {t('navigation.logout', 'Logout')}
          </button>
          {role !== 'donor' && (
            <div className="sidebar-user" onClick={() => { navigate(`/${role === 'admin' ? 'admin' : role === 'ngo' ? 'ngo' : 'donor'}/profile`); onClose?.(); }}>
              <div className="sidebar-avatar">{userInitial}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.displayName || user?.email || 'User'}</div>
                <div className="sidebar-user-role">{role || 'Guest'}</div>
              </div>
            </div>
          )}
          {role === 'donor' && (
            <div style={{ marginTop: 24, paddingLeft: 12, fontFamily: 'Caveat, cursive', fontSize: 20, color: '#D8D2CA', transform: 'rotate(-4deg)' }}
                 dangerouslySetInnerHTML={{ __html: t('login.hero.note', 'Small Acts.<br/>Big Change. ♡') }}>
              <Leaf size={32} color="#45382F" style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.5, transform: 'rotate(15deg)' }}/>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
