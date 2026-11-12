import React, { useState, useEffect } from 'react';
import { 
  Bell, Lock, Shield, Save, Check, AlertCircle, Eye, EyeOff, 
  Smartphone, Mail, Heart, Sparkles, UserCheck, Laptop
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';
import DownloadAppButton from '../../components/common/DownloadAppButton';

export default function DonorSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [notifications, setNotifications] = useState({
    email_updates: true,
    pickup_reminders: true,
    new_matches: true,
    impact_reports: false
  });

  const [privacy, setPrivacy] = useState({
    anonymous_donations: false,
    share_contact_with_ngo: true
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const profile = await api.getDonorProfile();
        if (profile) {
          const rawPref = profile.notification_preferences || profile.preferences;
          if (rawPref) {
            let p = rawPref;
            if (typeof rawPref === 'string') {
              try {
                p = JSON.parse(rawPref);
              } catch {
                p = {};
              }
            }
            setNotifications({
              email_updates: p.email_updates !== false,
              pickup_reminders: p.pickup_reminders !== false,
              new_matches: p.new_matches !== false,
              impact_reports: p.impact_reports === true
            });
            setPrivacy({
              anonymous_donations: p.anonymous_donations === true,
              share_contact_with_ngo: p.share_contact_with_ngo !== false
            });
          }
        }
      } catch (err) {
        console.warn('Could not load preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSavePreferences = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    try {
      const prefsPayload = {
        ...notifications,
        ...privacy
      };
      await api.updateDonorSettings({
        notification_preferences: JSON.stringify(prefsPayload),
        preferences: prefsPayload
      });
      showToast(t('donor.settingsSaved', 'Settings saved successfully!'));
    } catch (err) {
      console.error(err);
      showToast(t('donor.settingsSaveFailed', 'Failed to save settings. Please try again.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!passwordData.new_password) {
      showToast(t('donor.enterNewPassword', 'Please enter a new password.'), 'error');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast(t('donor.passwordsDoNotMatch', 'New passwords do not match.'), 'error');
      return;
    }
    if (passwordData.new_password.length < 6) {
      showToast(t('donor.passwordTooShort', 'Password must be at least 6 characters.'), 'error');
      return;
    }

    setSaving(true);
    try {
      if (api.changePassword) {
        await api.changePassword({
          old_password: passwordData.current_password,
          new_password: passwordData.new_password
        });
      }
      showToast(t('donor.passwordUpdated', 'Password updated successfully!'));
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showToast(err.message || t('donor.passwordUpdateFailed', 'Failed to update password.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderToggle = (checked, onChange, label, description, icon) => {
    const IconComponent = icon;
    return (
      <div 
        onClick={() => onChange(!checked)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #EAE5DE',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0, paddingRight: '16px' }}>
          {IconComponent && (
            <div style={{ color: '#C4622D', marginTop: '2px', flexShrink: 0 }}>
              <IconComponent size={18} />
            </div>
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14' }}>{label}</div>
            <div style={{ fontSize: '12px', color: '#8C7A6B', marginTop: '2px', lineHeight: 1.35 }}>{description}</div>
          </div>
        </div>

        {/* Custom Toggle Switch */}
        <div style={{
          width: '42px',
          height: '24px',
          borderRadius: '100px',
          backgroundColor: checked ? '#C4622D' : '#EAE5DE',
          position: 'relative',
          transition: 'background-color 0.2s',
          flexShrink: 0
        }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            position: 'absolute',
            top: '3px',
            left: checked ? '21px' : '3px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }} />
        </div>
      </div>
    );
  };

  return (

    <div style={{ fontFamily: 'Inter, sans-serif', color: '#2B1D14', maxWidth: '860px', margin: '0 auto', padding: '16px 20px 48px' }}>
      
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          backgroundColor: toast.type === 'error' ? '#FEF2F2' : '#2B1D14',
          color: toast.type === 'error' ? '#991B1B' : '#FFFFFF',
          border: toast.type === 'error' ? '1px solid #FCA5A5' : 'none',
          padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 500, zIndex: 1100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {toast.type === 'error' ? <AlertCircle size={15} color="#991B1B" /> : <Check size={15} color="#16A34A" />}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Breadcrumbs items={[
          { label: t('common.home', 'Home'), to: '/' },
          { label: t('common.donor', 'Donor'), to: '/donor' },
          { label: t('navigation.settings', 'Settings') }
        ]} />
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 700, margin: '0 0 6px 0', color: '#2B1D14' }}>
          {t('navigation.settings', 'Account Settings')}
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#8C7A6B' }}>
          {t('donor.accountSettingsDesc', 'Manage your notification preferences, privacy, and account security.')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* PWA DESKTOP APP SECTION */}
        <div style={{ 
          backgroundColor: '#FFFDF9', border: '2px solid #C4622D', borderRadius: '16px', 
          padding: '20px', boxShadow: '0 4px 16px rgba(196, 98, 45, 0.08)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '240px' }}>
              <div style={{ color: '#C4622D', background: '#FAF6F0', padding: '10px', borderRadius: '12px' }}>
                <Laptop size={24} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#2B1D14' }}>
                  Donation AI Desktop & Mobile App
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#6B5E59', lineHeight: 1.4 }}>
                  Install Donation AI as a native Desktop or Mobile Progressive Web App for faster AI camera detection, offline capabilities, and instant access.
                </p>
              </div>
            </div>
            <DownloadAppButton variant="card" />
          </div>
        </div>

        {/* SECTION 1: NOTIFICATION PREFERENCES */}
        <div style={{ 
          backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
          padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ color: '#C4622D' }}><Bell size={20} /></div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {t('donor.notificationPreferencesTitle', 'Notification Preferences')}
            </h3>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#8C7A6B' }}>
            {t('donor.notificationPreferencesDesc', 'Choose which notifications you wish to receive about your donations and pickups.')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {renderToggle(
              notifications.email_updates,
              (val) => setNotifications(prev => ({ ...prev, email_updates: val })),
              t('donor.emailUpdatesTitle', 'Email Updates & Status Alerts'),
              t('donor.emailUpdatesDesc', 'Receive email confirmations when your donations are matched, scheduled, or delivered.'),
              Mail
            )}

            {renderToggle(
              notifications.pickup_reminders,
              (val) => setNotifications(prev => ({ ...prev, pickup_reminders: val })),
              t('donor.pickupRemindersTitle', 'Pickup Reminders & SMS'),
              t('donor.pickupRemindersDesc', 'Receive timely reminders before the scheduled pickup window.'),
              Smartphone
            )}

            {renderToggle(
              notifications.new_matches,
              (val) => setNotifications(prev => ({ ...prev, new_matches: val })),
              t('donor.newMatchesTitle', 'NGO Match Notifications'),
              t('donor.newMatchesDesc', 'Get notified immediately when an NGO accepts your donation items.'),
              Sparkles
            )}

            {renderToggle(
              notifications.impact_reports,
              (val) => setNotifications(prev => ({ ...prev, impact_reports: val })),
              t('donor.impactReportsTitle', 'Quarterly Impact Digest'),
              t('donor.impactReportsDesc', 'Receive summaries of community impact and items distributed through your contributions.'),
              Heart
            )}
          </div>
        </div>

        {/* SECTION 2: PRIVACY & VISIBILITY */}
        <div style={{ 
          backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
          padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ color: '#C4622D' }}><Shield size={20} /></div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {t('donor.privacyPreferencesTitle', 'Privacy & Preferences')}
            </h3>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#8C7A6B' }}>
            {t('donor.privacyPreferencesDesc', 'Control your profile visibility and communication preferences with NGOs.')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {renderToggle(
              privacy.anonymous_donations,
              (val) => setPrivacy(prev => ({ ...prev, anonymous_donations: val })),
              t('donor.anonymousDonorTitle', 'Anonymous Donor Mode'),
              t('donor.anonymousDonorDesc', 'Display "Anonymous Donor" to NGOs until the pickup is coordinated.'),
              UserCheck
            )}

            {renderToggle(
              privacy.share_contact_with_ngo,
              (val) => setPrivacy(prev => ({ ...prev, share_contact_with_ngo: val })),
              t('donor.shareContactTitle', 'Share Phone with Matched NGO'),
              t('donor.shareContactDesc', 'Allows the NGO or courier volunteer to contact you directly for smooth pickup coordination.'),
              Smartphone
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              style={{
                backgroundColor: '#C4622D', border: 'none', color: '#FFFFFF',
                borderRadius: '100px', padding: '9px 20px', fontSize: '13px', fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(196, 98, 45, 0.25)', opacity: saving ? 0.7 : 1
              }}
            >
              <Save size={15} /> {saving ? t('donor.saving', 'Saving...') : t('donor.savePreferences', 'Save Preferences')}
            </button>
          </div>
        </div>

        {/* SECTION 3: SECURITY & PASSWORD */}
        <div style={{ 
          backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
          padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ color: '#C4622D' }}><Lock size={20} /></div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {t('donor.securityPasswordTitle', 'Security & Password')}
            </h3>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#8C7A6B' }}>
            {t('donor.securityPasswordDesc', 'Update your account password to ensure continued account security.')}
          </p>

          <form onSubmit={handlePasswordSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#2B1D14', marginBottom: '6px' }}>
                  {t('donor.currentPassword', 'Current Password')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                    placeholder={t('donor.enterCurrentPassword', "Enter your current password")}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px',
                      borderRadius: '10px', border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                      fontSize: '13px', color: '#2B1D14', outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A6B' }}
                  >
                    {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#2B1D14', marginBottom: '6px' }}>
                    {t('donor.newPassword', 'New Password')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      placeholder={t('donor.atLeast6Chars', "At least 6 characters")}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px',
                        borderRadius: '10px', border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                        fontSize: '13px', color: '#2B1D14', outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A6B' }}
                    >
                      {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#2B1D14', marginBottom: '6px' }}>
                    {t('donor.confirmNewPassword', 'Confirm New Password')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      placeholder={t('donor.reEnterNewPassword', "Re-enter new password")}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px',
                        borderRadius: '10px', border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                        fontSize: '13px', color: '#2B1D14', outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A6B' }}
                    >
                      {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    backgroundColor: '#FFFFFF', border: '1px solid #C4622D', color: '#C4622D',
                    borderRadius: '100px', padding: '8px 18px', fontSize: '13px', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                  }}
                >
                  <Lock size={14} /> {t('donor.updatePassword', 'Update Password')}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}

