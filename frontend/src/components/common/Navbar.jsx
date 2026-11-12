import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Heart, LogIn, UserPlus, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

import DownloadAppButton from './DownloadAppButton';

export default function Navbar() {
  const { isAuthenticated, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const SUPPORTED_LANGUAGES = new Set(['en', 'te', 'hi', 'ta', 'kn']);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    if (!SUPPORTED_LANGUAGES.has(lang)) return;
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'ngo') return '/ngo';
    return '/donor';
  };

  return (
    <>
      <nav className="navbar" role="navigation" aria-label={t('navigation.mainNavigation', 'Main navigation')}>
        <Link to="/" className="nav-brand">
          <div className="sidebar-logo-icon" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
            <Heart size={18} />
          </div>
          <span style={{ wordBreak: 'break-word' }}>Donation AI</span>
        </Link>

        <div className="nav-links">
          <DownloadAppButton variant="navbar" />
          <select
            value={i18n.language || 'en'}
            onChange={handleLanguageChange}
            aria-label="Select language"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              padding: '4px 8px',
              borderRadius: 'var(--radius)',
              marginRight: '8px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
            <option value="hi">हिन्दी</option>
            <option value="ta">தமிழ்</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
          {isAuthenticated ? (
            <>
              <NavLink
                to={getDashboardPath()}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {t('navigation.dashboard', 'Dashboard')}
              </NavLink>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} aria-label={t('navigation.logOut', 'Log out')}>
                <LogOut size={18} /> {t('navigation.logout', 'Logout')}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-ghost btn-sm">
                <LogIn size={18} /> {t('navigation.login', 'Login')}
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={18} /> {t('navigation.register', 'Register')}
              </NavLink>
            </>
          )}
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t('navigation.closeMenu', 'Close menu') : t('navigation.openMenu', 'Open menu')}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: 'var(--navbar-height)',
            left: 0,
            right: 0,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '1rem',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            animation: 'slideUp 200ms ease',
          }}
        >
          <select
            value={i18n.language || 'en'}
            onChange={handleLanguageChange}
            aria-label="Select language"
            style={{
              background: 'var(--surface-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              padding: '8px',
              borderRadius: 'var(--radius)',
              marginBottom: '8px',
              fontSize: '0.9rem',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
            <option value="hi">हिन्दी</option>
            <option value="ta">தமிழ்</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
          {isAuthenticated ? (
            <>
              <NavLink
                to={getDashboardPath()}
                className="nav-link"
                onClick={() => setMobileOpen(false)}
              >
                {t('navigation.dashboard', 'Dashboard')}
              </NavLink>
              <button
                className="btn btn-ghost w-full"
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                style={{ justifyContent: 'flex-start' }}
              >
                <LogOut size={18} /> {t('navigation.logout', 'Logout')}
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="btn btn-ghost w-full"
                onClick={() => setMobileOpen(false)}
                style={{ justifyContent: 'flex-start' }}
              >
                <LogIn size={18} /> {t('navigation.login', 'Login')}
              </NavLink>
              <NavLink
                to="/register"
                className="btn btn-primary w-full"
                onClick={() => setMobileOpen(false)}
              >
                <UserPlus size={18} /> {t('navigation.register', 'Register')}
              </NavLink>
            </>
          )}
        </div>
      )}
    </>
  );
}
