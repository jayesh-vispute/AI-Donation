import { useState } from 'react';
import { Save, Building2, Bell, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

import DownloadAppButton from '../../components/common/DownloadAppButton';
import { Laptop } from 'lucide-react';

export default function NgoSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState({
    acceptingDonations: true,
    emailNotifications: true,
    autoAcceptMatches: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await api.updateNgoSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.ngo', 'NGO'), to: '/ngo' },
        { label: t('navigation.settings', 'Settings') }
      ]} />
      <div className="page-header">
        <h1>{t('uiTemplates.organizationSettings')}</h1>
        <p>{t('uiTemplates.organizationSettingsDesc')}</p>
      </div>

      {success && (
        <div style={{ padding: '1rem', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Save size={20} /> {t('success.settingsSaved')}
        </div>
      )}

      {/* PWA DESKTOP APP CARD */}
      <div className="card mb-4" style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: '240px' }}>
            <div style={{ color: 'var(--primary)', background: 'var(--primary-50, #FAF6F0)', padding: '10px', borderRadius: '12px' }}>
              <Laptop size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                Donation AI Desktop & Mobile App
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Install Donation AI on your desktop or mobile device for quick offline access to inventory, demand management, and real-time pickup updates.
              </p>
            </div>
          </div>
          <DownloadAppButton variant="card" />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={20} color="var(--primary)" />
              {t('uiTemplates.operationalSettings')}
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.acceptingDonations} onChange={(e) => setSettings({...settings, acceptingDonations: e.target.checked})} />
              <div>
                <div style={{ fontWeight: 500 }}>{t('uiTemplates.acceptingNewDonations')}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('uiTemplates.acceptingNewDonationsDesc')}</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.autoAcceptMatches} onChange={(e) => setSettings({...settings, autoAcceptMatches: e.target.checked})} />
              <div>
                <div style={{ fontWeight: 500 }}>{t('uiTemplates.autoAcceptMatches')}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('uiTemplates.autoAcceptMatchesDesc')}</div>
              </div>
            </label>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} color="var(--primary)" />
              {t('common.notifications')}
            </h3>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})} />
            <div>
              <div style={{ fontWeight: 500 }}>{t('uiTemplates.emailAlerts')}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('uiTemplates.emailAlertsDesc')}</div>
            </div>
          </label>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} color="var(--primary)" />
              {t('uiTemplates.security')}
            </h3>
          </div>
          <div className="form-group">
            <label className="form-label">{t('uiTemplates.currentPassword')}</label>
            <input type="password" className="form-input" placeholder={t('uiTemplates.currentPasswordPlaceholder')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('auth.newPassword')}</label>
              <input type="password" className="form-input" placeholder={t('auth.newPassword')} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.confirmPassword')}</label>
              <input type="password" className="form-input" placeholder={t('uiTemplates.confirmNewPassword')} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary">{t('actions.cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('actions.saving') : t('actions.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}
