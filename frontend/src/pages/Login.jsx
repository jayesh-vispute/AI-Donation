import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Mail, Lock, Loader2, Users, Leaf, Building2, Eye, EyeOff, HandHeart, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/common/LanguageSelector';
import './Login.css';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, setUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const redirectByRole = (verifiedRole) => {
    const roleStr = (verifiedRole || 'donor').toLowerCase();
    if (from && from !== '/access-denied' && from !== '/login') {
      const isAllowed = 
        (roleStr === 'donor' && !from.startsWith('/ngo') && !from.startsWith('/admin')) ||
        (roleStr === 'ngo' && !from.startsWith('/admin') && (from.startsWith('/ngo') || from === '/')) ||
        (roleStr === 'admin');

      if (isAllowed) {
        return navigate(from, { replace: true });
      }
    }

    if (roleStr === 'admin') return navigate('/admin', { replace: true });
    if (roleStr === 'ngo') return navigate('/ngo', { replace: true });
    return navigate('/donor', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('validation.validEmail', 'Please enter a valid email address.'));
      return;
    }
    if (!password) {
      setError(t('validation.enterPassword', 'Please enter your password.'));
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      redirectByRole(loggedUser?.role);
    } catch (err) {
      const msg = err.message || err.detail || '';
      if (err.status === 403 || msg.includes('blocked') || msg.includes('deactivated')) {
        return navigate('/access-denied', { replace: true });
      }
      if (msg.includes('Network') || msg.includes('fetch') || msg.includes('Cannot connect')) {
        setError(t('errors.couldNotConnect', "We couldn't connect right now. Please try again."));
      } else {
        setError(t('errors.emailOrPasswordIncorrect', 'Email or password is incorrect.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        redirectByRole(loggedUser.role);
      }
    } catch (err) {
      const msg = err.message || err.detail || '';
      if (err.status === 403 || msg.includes('blocked') || msg.includes('deactivated')) {
        return navigate('/access-denied', { replace: true });
      }

      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        if (err.code === 'auth/popup-blocked') {
          setError(t('errors.popupBlocked', 'Popup was blocked by your browser. Please allow popups for this site.'));
        } else if (err.message && err.message.includes('internal-error')) {
          setError(t('errors.googleNotConfigured', 'Google Sign-In is not fully configured for this project. Please use email/password or a Demo Login.'));
        } else {
          setError(msg || t('errors.googleSignInFailed', 'Failed to sign in with Google.'));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (demoRole) => {
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(`${demoRole}@demo.com`, 'demo123');
      redirectByRole(loggedUser?.role || demoRole);
    } catch (err) {
      const msg = err.message || err.detail || '';
      if (err.status === 403 || msg.includes('blocked') || msg.includes('deactivated')) {
        return navigate('/access-denied', { replace: true });
      }
      setError(msg || t('errors.demoLoginFailed', 'Demo login failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ========== LEFT HERO ========== */}
      <section className="login-hero" aria-hidden="true">

        {/* Brand + Handwritten note row */}
        <div className="login-hero-header">
          <div className="login-brand">
            <svg className="login-brand-icon" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"/>
            </svg>
            <div>
              <div className="login-brand-name">Donation <span>AI</span></div>
              <div className="login-brand-tagline">{t('login.hero.tagline', 'Smarter Giving. Brighter Tomorrows.')}</div>
            </div>
          </div>
          <div className="login-handwritten-note">
            <span dangerouslySetInnerHTML={{ __html: t('login.hero.note', 'Small Acts.<br />Big Change. ♡') }} />
          </div>
        </div>

        {/* Hero body */}
        <div className="login-hero-body">
          <h1 className="login-hero-heading" dangerouslySetInnerHTML={{ __html: t('login.hero.heading', 'Good<br />Things<br />Reach<br />Good People') }}></h1>
          <div className="login-hero-bar" />
          <p className="login-hero-copy" dangerouslySetInnerHTML={{ __html: t('login.hero.copy', 'Donate what you can.<br />Help where it\'s needed.<br />Together we build<br />stronger communities.') }}></p>

          {/* Impact indicators */}
          <div className="login-impacts">
            <div className="login-impact">
              <div className="login-impact-circle login-impact-circle--green">
                <Users size={24} color="#2F7A4F" />
              </div>
              <span className="login-impact-label" dangerouslySetInnerHTML={{ __html: t('login.hero.impact1', 'People<br />Connected') }}></span>
            </div>
            <div className="login-impact">
              <div className="login-impact-circle login-impact-circle--green">
                <Leaf size={24} color="#2F7A4F" />
              </div>
              <span className="login-impact-label" dangerouslySetInnerHTML={{ __html: t('login.hero.impact2', 'Resources<br />Shared') }}></span>
            </div>
            <div className="login-impact">
              <div className="login-impact-circle login-impact-circle--warm">
                <Heart size={24} color="#C4622D" fill="#C4622D" />
              </div>
              <span className="login-impact-label" dangerouslySetInnerHTML={{ __html: t('login.hero.impact3', 'Stronger<br />Communities') }}></span>
            </div>
          </div>
        </div>

        {/* Background photo */}
        <div className="login-hero-image" />

        {/* Bottom quote */}
        <div className="login-hero-quote" dangerouslySetInnerHTML={{ __html: t('login.hero.quote', 'Kindness<br />creates a brighter<br />tomorrow. ♡') }}></div>

        {/* Decorative leaves */}
        <svg className="login-hero-leaves" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M160 100c-20-30-60-20-80 0" stroke="#2F7A4F" strokeWidth="2" fill="none" opacity="0.4"/>
          <path d="M140 110c-15-25-50-18-65 5" stroke="#2F7A4F" strokeWidth="1.5" fill="none" opacity="0.3"/>
          <ellipse cx="155" cy="95" rx="18" ry="8" fill="#2F7A4F" opacity="0.12" transform="rotate(-30 155 95)"/>
          <ellipse cx="130" cy="105" rx="14" ry="6" fill="#2F7A4F" opacity="0.1" transform="rotate(-20 130 105)"/>
        </svg>
      </section>

      {/* ========== RIGHT FORM ========== */}
      <section className="login-form-side">
        <div className="login-lang-selector">
          <LanguageSelector />
        </div>
        <div className="login-card">

          {/* Mobile brand (hidden on desktop) */}
          <div className="login-mobile-brand">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#C4622D" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"/>
            </svg>
            <span className="login-brand-name" style={{ fontSize: 20 }}>Donation <span>AI</span></span>
          </div>

          {/* Badge */}
          <div className="login-card-badge">
            <Heart size={26} color="#fff" />
          </div>

          {/* Title */}
          <h2 className="login-card-heading">{t('auth.welcomeBack', 'Welcome Back')}</h2>
          <p className="login-card-subheading">{t('auth.signInSubtitle', 'Sign in to your Donation AI account')}</p>

          {/* Error */}
          {error && <div className="login-error" role="alert">{error}</div>}

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate autoComplete="off">

            {/* Email */}
            <div className="login-field">
              <div className="login-field-header">
                <label className="login-field-label" htmlFor="login-email">{t('auth.emailAddress', 'Email Address')}</label>
              </div>
              <div className="login-field-input-wrap">
                <Mail size={18} className="login-field-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="login-field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <div className="login-field-header">
                <label className="login-field-label" htmlFor="login-password">{t('auth.password', 'Password')}</label>
                <Link to="/forgot-password" className="login-field-link">{t('auth.forgotPassword', 'Forgot password?')}</Link>
              </div>
              <div className="login-field-input-wrap">
                <Lock size={18} className="login-field-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-field-input"
                  style={{ paddingRight: 48 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.enterPasswordPlaceholder', 'Enter your password')}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="login-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="login-submit" disabled={loading}>
              {loading
                ? <Loader2 size={20} className="login-spinner" />
                : <>{t('actions.signIn', 'Sign In')} <ArrowRight size={18} /></>
              }
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">{t('auth.or', 'or')}</span>
            <div className="login-divider-line" />
          </div>

          {/* Google */}
          <button type="button" className="login-google" onClick={handleGoogleLogin} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t('actions.continueGoogle', 'Continue with Google')}
          </button>

          {/* Demo divider */}
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">{t('auth.orTryDemo', 'or try a demo')}</span>
            <div className="login-divider-line" />
          </div>

          {/* Demo buttons — NO Admin on public page */}
          <div className="login-demos">
            <button type="button" className="login-demo-btn" onClick={() => demoLogin('donor')} disabled={loading}>
              <HandHeart size={18} color="#C4622D" /> {t('auth.donorDemo', 'Donor Demo')}
            </button>
            <button type="button" className="login-demo-btn" onClick={() => demoLogin('ngo')} disabled={loading}>
              <Building2 size={18} color="#2F7A4F" /> {t('auth.ngoDemo', 'NGO Demo')}
            </button>
          </div>

          {/* Footer */}
          <div className="login-footer">
            {t('auth.noAccount', "Don't have an account?")} <Link to="/register">{t('actions.signUp', 'Sign up')}</Link>
          </div>

        </div>
      </section>
    </div>
  );
}
