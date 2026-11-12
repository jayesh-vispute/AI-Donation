import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, PackagePlus, Package, ClipboardList, 
  Users, Truck, BarChart3, Bell, User, CheckCircle, LogOut, HeartHandshake, Leaf, Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../pages/ngo/ngo-theme.css';

import { useTranslation } from 'react-i18next';
import LanguageSelector from '../common/LanguageSelector';

const getNgoMainNav = (t) => [
  { to: '/ngo', icon: LayoutDashboard, label: t('navigation.dashboard', 'Dashboard') },
  { to: '/ngo/donations', icon: Package, label: t('navigation.donations', 'Donations') },
  { to: '/ngo/inventory', icon: ClipboardList, label: t('navigation.inventory', 'Inventory') },
  { to: '/ngo/item-requests', icon: ClipboardList, label: t('navigation.itemRequests', 'Item Requests') },
  { to: '/ngo/donors', icon: Users, label: t('navigation.donors', 'Donors') },
  { to: '/ngo/reports', icon: BarChart3, label: t('navigation.reports', 'Reports') },
];

const getNgoAccountNav = (t) => [
  { to: '/ngo/notifications', icon: Bell, label: t('navigation.notifications', 'Notifications') },
  { to: '/ngo/profile', icon: User, label: t('navigation.profile', 'Profile') },
];

export default function NgoLayout() {
  const { t } = useTranslation();
  const ngoMainNav = getNgoMainNav(t);
  const ngoAccountNav = getNgoAccountNav(t);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="ngo-theme" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="ngo-layout">
        
        {/* Mobile Backdrop */}
        <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <aside className={`ngo-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ 
          backgroundColor: '#2B1D14', color: '#fff', 
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden' 
        }}>
          <div className="ngo-sidebar-header" style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HeartHandshake size={32} color="#C4622D" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'Fraunces, serif' }}>
                {(() => {
                  const brand = t('ngo.brandName', 'Donation AI');
                  const parts = brand.split(/\s+(?=AI$)/);
                  return parts.length > 1
                    ? <>{parts[0]} <span style={{ color: '#C4622D' }}>{parts[1]}</span></>
                    : brand;
                })()}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 400, marginTop: '4px' }}>
                {t('ngo.slogan', 'Smarter Giving. Brighter Tomorrows.')}
              </div>
            </div>
          </div>

          <div className="ngo-sidebar-scroll-area" style={{ flex: 1, overflowY: 'auto' }}>
            <nav className="ngo-sidebar-nav" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: '8px', marginBottom: '4px', paddingLeft: '16px', letterSpacing: '1px' }}>{t('navigation.main', 'MAIN')}</div>
              {ngoMainNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink 
                    key={item.to} 
                    to={item.to}
                    end={item.to === '/ngo'}
                    onClick={() => setSidebarOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '12px 16px', borderRadius: '8px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.8)',
                      backgroundColor: isActive ? '#C4622D' : 'transparent',
                      textDecoration: 'none', transition: 'all 0.2s',
                      fontWeight: isActive ? 600 : 500
                    })}
                  >
                    <Icon size={20} />
                    <span style={{ flex: 1, fontSize: '15px' }}>{item.label}</span>
                  </NavLink>
                );
              })}

              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: '16px', marginBottom: '4px', paddingLeft: '16px', letterSpacing: '1px' }}>{t('navigation.account', 'ACCOUNT')}</div>
              {ngoAccountNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink 
                    key={item.to} 
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '12px 16px', borderRadius: '8px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.8)',
                      backgroundColor: isActive ? '#C4622D' : 'transparent',
                      textDecoration: 'none', transition: 'all 0.2s',
                      fontWeight: isActive ? 600 : 500
                    })}
                  >
                    <div style={{ position: 'relative', display: 'flex' }}>
                      <Icon size={20} />
                      {item.badge && (
                        <div style={{ 
                          position: 'absolute', top: -6, right: -6,
                          backgroundColor: '#C4622D', color: '#fff', 
                          fontSize: '10px', fontWeight: 600, width: '16px', height: '16px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          borderRadius: '50%', border: '2px solid #2B1D14'
                        }}>
                          {item.badge}
                        </div>
                      )}
                    </div>
                    <span style={{ flex: 1, fontSize: '15px' }}>{item.label}</span>
                  </NavLink>
                );
              })}
              
              <div style={{ margin: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
              
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '12px 16px', color: '#C4622D', fontWeight: 600,
                  fontSize: '15px', cursor: 'pointer', width: '100%', textAlign: 'left',
                  transition: 'all 0.2s', marginBottom: '16px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(196, 98, 45, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={20} />
                {t('navigation.logout', 'Logout')}
              </button>
            </nav>
          </div>

          {/* Bottom Illustration */}
          <div style={{ padding: '32px 24px', zIndex: 10, marginTop: 'auto' }}>
            <div style={{ 
              fontFamily: 'Fraunces, serif', fontStyle: 'italic', 
              color: 'rgba(255,255,255,0.6)', fontSize: '18px', 
              lineHeight: 1.2, transform: 'rotate(-5deg)'
            }}>
              {t('ngo.smallActs', 'Small Acts.')}<br/>{t('ngo.bigChange', 'Big Change. ♡')}
            </div>
          </div>
          
          {/* Background Leaf decoration */}
          <div style={{ position: 'absolute', bottom: -20, right: -20, color: 'rgba(255,255,255,0.05)', transform: 'rotate(-15deg)', zIndex: 1 }}>
            <Leaf size={180} strokeWidth={1} />
          </div>
        </aside>



        {/* Main Content */}
        <div className="ngo-main" style={{ backgroundColor: '#FFFDF9' }}>
          <header className="ngo-topbar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                className="mobile-menu-btn" 
                onClick={() => setSidebarOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginRight: '8px', color: '#2B1D14' }}
              >
                <Menu size={24} />
              </button>
            </div>
            
            <div className="ngo-topbar-right">
              <LanguageSelector />
              <button 
                className="ngo-topbar-btn"
                onClick={() => navigate('/ngo/notifications')}
                style={{ background: '#fff', border: '1px solid #EAE5DE', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#2B1D14', position: 'relative' }}
              >
                <Bell size={20} />
                <span style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, backgroundColor: '#C4622D', color: '#fff', fontSize: '9px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid #F7F3EC' }}>3</span>
              </button>
              <div className="ngo-topbar-profile" onClick={() => navigate('/ngo/profile')}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: '50%', backgroundColor: '#2B1D14', 
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontWeight: 600, fontSize: '14px', flexShrink: 0
                }}>
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'H'}
                </div>
                <div className="ngo-topbar-profile-text" style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14', display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                    <span style={{ wordBreak: 'break-word', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.displayName || t('common.yourNgo', 'Your NGO')}
                    </span>
                    <svg style={{ flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                  <div style={{ fontSize: '12px', color: '#654B35', marginTop: '2px', wordBreak: 'break-word', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('ngo.ngoPartner', 'NGO Partner')}</div>
                </div>
              </div>
            </div>
          </header>

          <div className="ngo-content">
            <Outlet />
          </div>
        </div>

      </div>
    </div>
  );
}
