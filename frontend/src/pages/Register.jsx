import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, User, Loader2, HandHeart, Building2, Users, Leaf, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/common/LanguageSelector';
import './Login.css';

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('donor');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError(t('validation.agreeTerms', 'You must agree to the Terms of Service and Privacy Policy.'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('validation.passwordsDoNotMatch', 'Passwords do not match.'));
      return;
    }
    if (password.length < 6) {
      setError(t('validation.passwordMin6', 'Password must be at least 6 characters.'));
      return;
    }

    setLoading(true);
    try {
      await registerUser(email, password, name, role);
      navigate(role === 'ngo' ? '/ngo' : '/donor', { replace: true });
    } catch (err) {
      setError(err.message || t('errors.registrationFailed', 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ========== LEFT HERO ========== */}
      <section className="login-hero" aria-hidden="true">
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

        <div className="login-hero-body">
          <h1 className="login-hero-heading" style={{ fontSize: 'clamp(36px, 5.5vh, 56px)' }} dangerouslySetInnerHTML={{ __html: t('register.hero.heading', 'Be the<br />Reason for a<br />Brighter<br />Tomorrow') }}></h1>
          <div className="login-hero-bar" />
          <p className="login-hero-copy" dangerouslySetInnerHTML={{ __html: t('register.hero.copy', 'Join Donation AI and<br />turn your kindness into<br />real change.') }}></p>

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

        <div className="login-hero-image" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1593113565214-80af5dff1906?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80")' }} />
        <div className="login-hero-quote" dangerouslySetInnerHTML={{ __html: t('login.hero.quote', 'Kindness<br />creates a brighter<br />tomorrow. ♡') }}></div>
      </section>

      {/* ========== RIGHT FORM ========== */}
      <section className="login-form-side" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
          <LanguageSelector />
        </div>
        <div className="login-card" style={{ maxWidth: 480 }}>

          <div className="login-card-badge">
            <Heart size={22} color="#fff" />
          </div>

          <h2 className="login-card-heading">{t('auth.createAccount', 'Create Account')}</h2>
          <p className="login-card-subheading">{t('auth.joinSubtitle', 'Join Donation AI and start making a difference.')}</p>

          {error && <div className="login-error" role="alert">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit} noValidate autoComplete="off">

            {/* Role selector */}
            <div className="login-field">
              <label className="login-field-label">{t('auth.iAmA', 'I am a')}</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: 8 }}>
                <div
                  onClick={() => setRole('donor')}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 10,
                    border: `2px solid ${role === 'donor' ? '#C4622D' : '#D8D2CA'}`,
                    backgroundColor: role === 'donor' ? '#FAF8F5' : '#fff',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.15s'
                  }}
                >
                  <HandHeart size={22} color={role === 'donor' ? '#C4622D' : '#8B8176'} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#221D17' }}>{t('common.donor', 'Donor')}</div>
                  <div style={{ fontSize: 11, color: '#5C5348', textAlign: 'center' }}>{t('auth.wantToDonate', 'I want to donate items')}</div>
                </div>
                <div
                  onClick={() => setRole('ngo')}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 10,
                    border: `2px solid ${role === 'ngo' ? '#C4622D' : '#D8D2CA'}`,
                    backgroundColor: role === 'ngo' ? '#FAF8F5' : '#fff',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.15s'
                  }}
                >
                  <Building2 size={22} color={role === 'ngo' ? '#C4622D' : '#8B8176'} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#221D17' }}>{t('common.ngo', 'NGO')}</div>
                  <div style={{ fontSize: 11, color: '#5C5348', textAlign: 'center' }}>{t('auth.representOrg', 'I represent an organization')}</div>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="login-field">
              <label className="login-field-label" htmlFor="reg-name">{t('auth.fullName', 'Full Name')}</label>
              <div className="login-field-input-wrap">
                <User size={18} className="login-field-icon" />
                <input
                  id="reg-name"
                  type="text"
                  className="login-field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder', 'Your full name')}
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Email */}
            <div className="login-field">
              <label className="login-field-label" htmlFor="reg-email">{t('auth.emailAddress', 'Email Address')}</label>
              <div className="login-field-input-wrap">
                <Mail size={18} className="login-field-icon" />
                <input
                  id="reg-email"
                  type="email"
                  className="login-field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password row */}
            <div className="register-pw-row">
              <div className="login-field" style={{ flex: 1 }}>
                <label className="login-field-label" htmlFor="reg-pw">{t('auth.password', 'Password')}</label>
                <div className="login-field-input-wrap">
                  <Lock size={18} className="login-field-icon" />
                  <input
                    id="reg-pw"
                    type="password"
                    className="login-field-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.min6Chars', 'Min 6 characters')}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="login-field" style={{ flex: 1 }}>
                <label className="login-field-label" htmlFor="reg-cpw">{t('auth.confirmPassword', 'Confirm Password')}</label>
                <div className="login-field-input-wrap">
                  <Lock size={18} className="login-field-icon" />
                  <input
                    id="reg-cpw"
                    type="password"
                    className="login-field-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.reenterPassword', 'Re-enter password')}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 20 }}>
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#C4622D', width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="terms" style={{ fontSize: 12, color: '#5C5348', cursor: 'pointer', lineHeight: 1.4 }}>
                {t('auth.agreeTermsPrefix', 'I agree to the')} <span style={{ color: '#C4622D', fontWeight: 500 }}>{t('auth.termsOfService', 'Terms of Service')}</span> {t('auth.and', 'and')} <span style={{ color: '#C4622D', fontWeight: 500 }}>{t('auth.privacyPolicy', 'Privacy Policy')}</span>
              </label>
            </div>

            {/* Submit */}
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="login-spinner" /> : <>{t('auth.createAccount', 'Create Account')} <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="login-footer" style={{ marginTop: 20 }}>
            {t('auth.haveAccount', 'Already have an account?')} <Link to="/login">{t('actions.signIn', 'Sign in')}</Link>
          </div>

        </div>
      </section>
    </div>
  );
}
