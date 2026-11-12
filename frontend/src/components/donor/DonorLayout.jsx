import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Heart, Package, Building2, User, HeartHandshake, Bell, LogOut, Leaf, Search, Settings, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../common/LanguageSelector';
import '../../pages/donor/donor-theme.css';

const donorNav = [
  { to: '/donor', icon: LayoutDashboard, labelKey: 'navigation.dashboard', fallback: 'Dashboard' },
  { to: '/donate', icon: Heart, labelKey: 'navigation.donate', fallback: 'Donate' },
  { to: '/donations', icon: Package, labelKey: 'navigation.myDonations', fallback: 'My Donations' },
  { to: '/matches', icon: Building2, labelKey: 'navigation.ngoMatches', fallback: 'NGO Matches' },
  { to: '/donor/ai-detection', icon: Search, labelKey: 'navigation.aiDetections', fallback: 'AI Detected Items' },
  { to: '/donor/notifications', icon: Bell, labelKey: 'navigation.notifications', fallback: 'Notifications' },
  { to: '/donor/profile', icon: User, labelKey: 'navigation.profile', fallback: 'Profile' },
  { to: '/donor/settings', icon: Settings, labelKey: 'navigation.settings', fallback: 'Settings' }
];

export default function DonorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    <div className="donor-theme" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="donor-layout">
        
        {/* Mobile Backdrop */}
        <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
        
        {/* Sidebar */}
        <aside className={`donor-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ 
          backgroundColor: '#2B1D14', color: '#fff', 
          overflow: 'hidden' 
        }}>
          <div className="donor-sidebar-header" style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HeartHandshake size={32} color="#C4622D" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'Fraunces, serif' }}>
                Donation <span style={{ color: '#C4622D' }}>AI</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 400, marginTop: '4px' }}>
                {t('donor.slogan', 'Smarter Giving. Brighter Tomorrows.')}
              </div>
            </div>
          </div>
          
          <nav className="donor-sidebar-nav" style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
            {donorNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink 
                  key={item.to} 
                  to={item.to}
                  end={item.to === '/donor'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `donor-nav-link ${isActive ? 'active' : ''}`}
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
                  <span style={{ flex: 1, fontSize: '15px' }}>{t(item.labelKey, item.fallback)}</span>
                </NavLink>
              );
            })}
            
            <div style={{ margin: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
            
            <button 
              onClick={logout}
              style={{
                background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px 16px', color: '#C4622D', fontWeight: 600,
                fontSize: '15px', cursor: 'pointer', width: '100%', textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(196, 98, 45, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut size={20} />
              {t('navigation.logout', 'Logout')}
            </button>
          </nav>

          {/* Bottom Illustration */}
          <div style={{ padding: '32px 24px', zIndex: 10 }}>
            <div style={{ 
              fontFamily: 'Fraunces, serif', fontStyle: 'italic', 
              color: 'rgba(255,255,255,0.6)', fontSize: '18px', 
              lineHeight: 1.2, transform: 'rotate(-5deg)'
            }}>
              {t('donor.quote', 'Small Acts.\nBig Change. ♡')}
            </div>
          </div>
          
          {/* Background Leaf decoration */}
          <div style={{ position: 'absolute', bottom: -20, right: -20, color: 'rgba(255,255,255,0.05)', transform: 'rotate(-15deg)', zIndex: 1 }}>
            <Leaf size={180} strokeWidth={1} />
          </div>
        </aside>



        {/* Main Content */}
        <div className="donor-main" style={{ backgroundColor: '#FFFDF9' }}>
          <header className="donor-topbar" style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            padding: '16px 32px', backgroundColor: 'transparent',
            maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                className="mobile-menu-btn" 
                onClick={() => setSidebarOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginRight: '8px', color: '#2B1D14' }}
              >
                <Menu size={24} />
              </button>
            </div>
            
            <div className="donor-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <LanguageSelector />
              <button 
                onClick={() => navigate('/donor/notifications')}
                style={{ background: '#fff', border: '1px solid #EAE5DE', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#2B1D14', position: 'relative' }}
              >
                <Bell size={20} />
                <span style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, backgroundColor: '#C4622D', color: '#fff', fontSize: '9px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid #F7F3EC' }}>3</span>
              </button>
              
              <div className="donor-topbar-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/donor/profile')}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: '50%', backgroundColor: '#2B1D14', 
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontWeight: 600, fontSize: '14px', flexShrink: 0
                }}>
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'P'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14', display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                  <span className="donor-topbar-profile-name" style={{ wordBreak: 'break-word', maxWidth: '120px' }}>
                    {t('common.helloUser', { name: user?.displayName || user?.email?.split('@')[0] || 'User', defaultValue: 'Hello, {{name}}' })}
                  </span>
                  <svg style={{ flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </header>

          <div className="donor-content">
            <Outlet />
          </div>
        </div>

      </div>
    </div>
  );
}
