import { useState } from 'react';
import { Save, Settings, Shield, Bell } from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

import DownloadAppButton from '../../components/common/DownloadAppButton';
import { Laptop } from 'lucide-react';

export default function AdminSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    autoApproveNgos: false,
    requireEmailVerification: true,
    yoloConfidenceThreshold: 60,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await api.updateAdminSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.admin', 'Admin'), to: '/admin' },
        { label: t('navigation.settings', 'Settings') }
      ]} />
      <div className="page-header">
        <h1>{t('admin.settingsTitle', 'Global Application Settings')}</h1>
        <p>{t('admin.settingsDesc', 'Configure system-wide parameters, security thresholds, and AI models.')}</p>
      </div>

      {success && (
        <div style={{ padding: '1rem', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Save size={20} /> {t('success.settingsSaved', 'Settings saved successfully!')}
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
                Install Donation AI on your desktop or mobile device for quick offline access, system notifications, and admin management tools.
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
              <Settings size={20} color="var(--primary)" />
              System Configuration
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})} />
              <div>
                <div style={{ fontWeight: 500 }}>Maintenance Mode</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--error)' }}>Displays a maintenance screen to all users except admins.</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.autoApproveNgos} onChange={(e) => setSettings({...settings, autoApproveNgos: e.target.checked})} />
              <div>
                <div style={{ fontWeight: 500 }}>Auto-Approve NGOs</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bypass manual review for NGO registrations.</div>
              </div>
            </label>
            
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">YOLOv8 Minimum Confidence Threshold (%)</label>
              <input 
                type="number" 
                className="form-input" 
                value={settings.yoloConfidenceThreshold} 
                onChange={(e) => setSettings({...settings, yoloConfidenceThreshold: parseInt(e.target.value)})}
                min="10" max="100"
              />
              <div className="form-hint">Detections below this threshold will be flagged for manual review.</div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color="var(--primary)" />
              Security
            </h3>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.requireEmailVerification} onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})} />
            <div>
              <div style={{ fontWeight: 500 }}>Require Email Verification</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Users must verify their email before accessing the platform.</div>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
