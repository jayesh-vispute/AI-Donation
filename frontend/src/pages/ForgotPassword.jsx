import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowLeft, CheckCircle, AlertCircle, ShieldCheck, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('validation.validEmail', 'Please enter a valid email address.'));
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      console.error('Reset password error:', err.code, err.message);
      
      switch (err.code) {
        case 'auth/invalid-email':
          setError(t('auth.forgotPassword.invalidEmail', 'The email address is not valid.'));
          break;
        case 'auth/user-not-found':
          setError(t('auth.forgotPassword.userNotFound', 'No account found with this email address.'));
          break;
        case 'auth/too-many-requests':
          setError(t('auth.forgotPassword.tooManyRequests', 'We have blocked all requests from this device due to unusual activity. Try again later.'));
          break;
        case 'auth/network-request-failed':
          setError(t('auth.forgotPassword.networkError', 'Network error. Please check your connection and try again.'));
          break;
        case 'auth/operation-not-allowed':
          setError(t('auth.forgotPassword.operationNotAllowed', 'Password reset is disabled for this project.'));
          break;
        case 'auth/unauthorized-continue-uri':
          setError(t('auth.forgotPassword.invalidContinueUri', 'The domain is not authorized for password reset.'));
          break;
        default:
          const msg = err.message || '';
          if (msg.includes('Network') || msg.includes('fetch')) {
            setError(t('auth.forgotPassword.networkError', "We couldn't connect right now. Please check your connection."));
          } else {
            setError(t('auth.forgotPassword.genericError', 'Unable to send the reset link. Please try again.'));
          }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-pwd-container">
      {/* Background artwork and subtle organic shapes */}
      <div className="reset-pwd-bg-art">
        <div className="reset-pwd-bg-glow-top" />
        <div className="reset-pwd-bg-glow-bottom" />
        <div className="reset-pwd-handwritten-left" dangerouslySetInnerHTML={{ __html: t('forgotPassword.hero.note', 'Together<br />for a kinder<br />tomorrow. ♡') }}></div>
        <div className="reset-pwd-impact-labels">
          <span>{t('forgotPassword.hero.impact1', 'PEOPLE')}</span>
          <span>{t('forgotPassword.hero.impact2', 'COMMUNITY')}</span>
          <span>{t('forgotPassword.hero.impact3', 'IMPACT')}</span>
        </div>
        <svg className="reset-pwd-decorative-leaves" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M160 100c-20-30-60-20-80 0" stroke="#C9652B" strokeWidth="2" fill="none" opacity="0.15"/>
          <path d="M140 110c-15-25-50-18-65 5" stroke="#C9652B" strokeWidth="1.5" fill="none" opacity="0.12"/>
          <ellipse cx="155" cy="95" rx="18" ry="8" fill="#C9652B" opacity="0.08" transform="rotate(-30 155 95)"/>
          <ellipse cx="130" cy="105" rx="14" ry="6" fill="#C9652B" opacity="0.06" transform="rotate(-20 130 105)"/>
        </svg>
      </div>

      {/* Brand Header Section Above Card */}
      <div className="reset-pwd-brand">
        <Link to="/" className="reset-pwd-brand-logo" aria-label="Donation AI Home">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--reset-primary-accent)' }}>
            <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"/>
          </svg>
          <div className="reset-pwd-brand-name">
            Donation <span>AI</span>
          </div>
        </Link>
        <div className="reset-pwd-brand-tagline">
          {t('login.hero.tagline', 'Smarter Giving. Brighter Tomorrows.')}
        </div>
      </div>

      {/* Main Card */}
      <div className="reset-pwd-card">
        {sent ? (
          /* SUCCESS STATE */
          <div className="reset-pwd-success-box animate-fade-in">
            <div className="reset-pwd-icon-wrapper">
              <div className="reset-pwd-icon-circle reset-pwd-icon-circle--success">
                <CheckCircle size={32} />
              </div>
            </div>

            <div className="reset-pwd-header">
              <h1 className="reset-pwd-title">{t('forgotPassword.checkEmail', 'Check your email')}</h1>
              <p className="reset-pwd-subtitle">
                {t('forgotPassword.checkEmailSubtitle', 'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions.')}
              </p>
            </div>

            <div className="reset-pwd-success-message">
              {t('forgotPassword.sentTo', 'Sent to:')} <span className="reset-pwd-success-email">{email}</span>
            </div>

            <div className="reset-pwd-actions" style={{ marginTop: '2rem' }}>
              <Link to="/login" className="reset-pwd-btn reset-pwd-btn--outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={18} /> {t('forgotPassword.backToLogin', 'Back to login')}
              </Link>
            </div>

            <Link to="/login" className="reset-pwd-submit-btn" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={18} /> {t('forgotPassword.backToLogin', 'Back to Login')}
            </Link>
          </div>
        ) : (
          /* DEFAULT FORM STATE */
          <>
            <div className="reset-pwd-icon-wrapper">
              <div className="reset-pwd-icon-circle">
                <Lock size={28} />
              </div>
              {/* Radiating spark graphics */}
              <svg className="reset-pwd-icon-sparks" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M42 6V12" stroke="#C9652B" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                <path d="M16.5 16.5L20.7 20.7" stroke="#C9652B" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                <path d="M67.5 16.5L63.3 20.7" stroke="#C9652B" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </div>

            <div className="reset-pwd-header">
              <h1 className="reset-pwd-title">{t('forgotPassword.resetPassword', 'Reset Password')}</h1>
              <p className="reset-pwd-subtitle">
                {t('forgotPassword.resetSubtitle', 'Enter your email and we\'ll send you a secure link to reset your password.')}
              </p>
            </div>

            {error && (
              <div className="reset-pwd-error-banner" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form className="reset-pwd-form" onSubmit={handleSubmit} noValidate autoComplete="off">
              <div className="reset-pwd-field">
                <label className="reset-pwd-label" htmlFor="reset-email">
                  {t('auth.emailAddress', 'Email Address')}
                </label>
                <div className="reset-pwd-input-wrap">
                  <Mail size={18} className="reset-pwd-input-icon" />
                  <input
                    id="reset-email"
                    type="email"
                    className="reset-pwd-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="reset-pwd-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="reset-pwd-spinner" />
                    {t('common.sending', 'Sending...')}
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {t('forgotPassword.sendLink', 'Send Reset Link')}
                  </>
                )}
              </button>
            </form>

            <div className="reset-pwd-divider">
              <div className="reset-pwd-divider-line" />
              <span className="reset-pwd-divider-text">{t('auth.or', 'or')}</span>
              <div className="reset-pwd-divider-line" />
            </div>

            <Link to="/login" className="reset-pwd-back-link">
              <ArrowLeft size={16} /> {t('forgotPassword.backToLogin', 'Back to Login')}
            </Link>

            <div className="reset-pwd-security-notice">
              <div className="reset-pwd-security-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                {t('auth.resetSecurityNotice', "For your security, we'll send the reset link to the email address associated with your account.")}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
