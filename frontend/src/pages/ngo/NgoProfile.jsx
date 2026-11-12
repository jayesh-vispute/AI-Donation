import React, { useState, useEffect, useRef } from 'react';
import { Camera, Save, BadgeCheck, MapPin, UploadCloud, Users, Package, Truck, Heart, Calendar, FileText, Eye, Compass, X, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import NgoButton from '../../components/ngo/NgoButton';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export default function NgoProfile() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [activeDocument, setActiveDocument] = useState(null);

  const documents = profile ? [
    { id: 'registration_certificate', title: t('ngo.documents.registration', 'Registration Certificate'), filename: profile.registration_certificate_url ? profile.registration_certificate_url.split('/').pop() : 'Not Uploaded', size: '-', type: 'pdf', colorBg: '#FEE2E2', colorIcon: '#DC2626', url: profile.registration_certificate_url },
    { id: 'pan_card', title: t('ngo.documents.pan', 'PAN Card'), filename: profile.pan_card_url ? profile.pan_card_url.split('/').pop() : 'Not Uploaded', size: '-', type: 'pdf', colorBg: '#DBEAFE', colorIcon: '#2563EB', url: profile.pan_card_url },
    { id: 'address_proof', title: t('ngo.documents.address', 'Address Proof'), filename: profile.address_proof_url ? profile.address_proof_url.split('/').pop() : 'Not Uploaded', size: '-', type: 'pdf', colorBg: '#DCFCE7', colorIcon: '#16A34A', url: profile.address_proof_url }
  ] : [];

  const DEMO_FOCUS_AREAS = [
    t('ngo.focus.education', 'Education'), 
    t('ngo.focus.food', 'Food Security'), 
    t('ngo.focus.healthcare', 'Healthcare'), 
    t('ngo.focus.childWelfare', 'Child Welfare'), 
    t('ngo.focus.womenEmpowerment', 'Women Empowerment')
  ];

  const getFocusTagStyle = (area) => {
    switch (area.toLowerCase()) {
      case 'education': 
      case t('ngo.focus.education', 'Education').toLowerCase(): return { bg: '#E0F2FE', color: '#0369A1' };
      case 'food security': 
      case t('ngo.focus.food', 'Food Security').toLowerCase(): return { bg: '#DCFCE7', color: '#15803D' };
      case 'healthcare': 
      case t('ngo.focus.healthcare', 'Healthcare').toLowerCase(): return { bg: '#FEF3C7', color: '#B45309' };
      case 'child welfare': 
      case t('ngo.focus.childWelfare', 'Child Welfare').toLowerCase(): return { bg: '#F3E8FF', color: '#6B21A8' };
      case 'women empowerment': 
      case t('ngo.focus.womenEmpowerment', 'Women Empowerment').toLowerCase(): return { bg: '#FCE7F3', color: '#BE185D' };
      default: return { bg: '#F3F4F6', color: '#374151' };
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    organization_name: '',
    email: user?.email || '',
    phone: '',
    website: '',
    organization_type: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileData, analyticsData] = await Promise.all([
        api.getNgoProfile(),
        api.getNgoAnalytics().catch(() => null)
      ]);
      
      setProfile(profileData);
      setAnalytics(analyticsData);
      
      setFormData({
        organization_name: profileData.organization_name || '',
        email: profileData.email || user?.email || '',
        phone: profileData.phone || '',
        website: profileData.website || '',
        organization_type: profileData.organization_type || '',
        description: profileData.description || '',
        address: profileData.address || '',
        city: profileData.city || '',
        postal_code: profileData.postal_code || '',
      });
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError(t('errors.failedLoadProfile', 'Failed to load profile data.'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaveStatus(null);
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError(t('validation.logoMax2mb', 'Logo must be less than 2MB.'));
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("file", file);
      const updatedProfile = await api.uploadNgoLogo(fd);
      setProfile(updatedProfile);
      // Update global context user logo if necessary
      setUser(prev => ({ ...prev, logo_url: updatedProfile.logo_url }));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error("Logo upload failed", err);
      setSaveStatus('error');
      setError(err.message || t('errors.failedUploadLogo', 'Failed to upload logo'));
    } finally {
      setSaving(false);
      e.target.value = null; // reset input
    }
  };

  const handleDocumentClick = (docId) => {
    setUploadingDocId(docId);
    docInputRef.current?.click();
  };

  const handleDocumentChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocId) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t('validation.docMax5mb', 'Document must be less than 5MB.'));
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("file", file);
      const updatedProfile = await api.uploadNgoDocument(uploadingDocId, fd);
      setProfile(updatedProfile);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error("Document upload failed", err);
      setSaveStatus('error');
      setError(err.message || t('errors.failedUploadDoc', 'Failed to upload document'));
    } finally {
      setSaving(false);
      setUploadingDocId(null);
      e.target.value = null; // reset input
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updatedProfile = await api.updateNgoProfile(formData);
      setProfile(updatedProfile);
      
      // Update Context
      setUser(prev => ({ ...prev, name: updatedProfile.organization_name }));
      
      setSaveStatus('success');
      setError(null);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      setError(t('errors.failedSaveProfile', 'Failed to save profile changes.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #EAE5DE', borderTopColor: '#E86A33', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FEF2F2', borderRadius: '12px', color: '#DC2626' }}>
        <p>{error}</p>
        <button onClick={fetchData} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t('common.retry', 'Retry')}</button>
      </div>
    );
  }

  if (!profile) return null;

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #EAE5DE',
    backgroundColor: '#fff',
    fontSize: '14px',
    color: '#1A1A1A',
    fontFamily: '"Inter", sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s'
  };
  
  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: '6px'
  };

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #EAE5DE',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header / Breadcrumbs */}
      <div style={{ marginBottom: '24px' }}>
        <Breadcrumbs items={[
          { label: t('common.home', 'Home'), to: '/' },
          { label: t('common.ngo', 'NGO'), to: '/ngo' },
          { label: t('navigation.profile', 'Profile') }
        ]} />
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A1A1A', fontFamily: '"Playfair Display", serif', margin: 0, marginBottom: '8px' }}>
          {t('ngo.organizationProfile', 'Organization Profile')}
        </h1>
        <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>{t('ngo.profileDesc', "Manage your NGO's public information and contact details.")}</p>
      </div>

      {saveStatus === 'success' && (
        <div style={{ padding: '16px', backgroundColor: '#ECFDF5', color: '#047857', borderRadius: '8px', marginBottom: '24px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
          <CheckCircle size={18} /> {t('success.profileUpdated', 'Profile updated successfully.')}
        </div>
      )}
      {error && profile && (
        <div style={{ padding: '16px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', marginBottom: '24px', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Main Form Area */}
        <div style={cardStyle}>
          
          {/* Header Card inside Main Form */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '24px', borderBottom: '1px solid #EAE5DE', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {profile.logo_url ? (
                    <img src={`/api${profile.logo_url}`} alt={t('common.logo', 'Logo')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#E86A33' }}>{profile.organization_name.charAt(0)}</span>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={handleLogoClick}
                  style={{ position: 'absolute', bottom: -6, right: -6, width: 28, height: 28, borderRadius: '50%', backgroundColor: '#E86A33', color: '#fff', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Camera size={14} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleLogoChange} style={{ display: 'none' }} accept="image/png, image/jpeg" />
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{profile.organization_name}</h2>
                  {profile.verification_status === 'VERIFIED' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ECFDF5', color: '#047857', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                      <BadgeCheck size={14} /> {t('common.verified', 'VERIFIED')}
                    </span>
                  )}
                </div>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0, marginBottom: '4px' }}>{profile.organization_type || t('ngo.registeredNgo', 'Registered NGO')}</p>
                <p style={{ color: '#9CA3AF', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>{profile.description ? profile.description.substring(0, 50) + '...' : t('ngo.defaultTagline', 'For Dignity. For Health. For a Better Tomorrow.')}</p>
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={handleLogoClick}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff', border: '1px solid #EAE5DE', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#4B5563', cursor: 'pointer' }}
              >
                <UploadCloud size={16} /> {t('ngo.changeLogo', 'Change Logo')}
              </button>
              <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px', margin: 0 }}>{t('ngo.logoHint', 'JPG, PNG (Max 2MB)')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', marginBottom: '20px' }}>{t('ngo.organizationDetails', 'Organization Details')}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{t('ngo.organizationName', 'Organization Name')} <span style={{color: '#DC2626'}}>*</span></label>
              <input type="text" name="organization_name" style={inputStyle} value={formData.organization_name} onChange={handleChange} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>{t('ngo.contactEmail', 'Contact Email')} <span style={{color: '#DC2626'}}>*</span></label>
                <input type="email" style={{...inputStyle, backgroundColor: '#F9FAFB', color: '#6B7280', cursor: 'not-allowed'}} value={formData.email} disabled />
              </div>
              <div>
                <label style={labelStyle}>{t('ngo.phoneNumber', 'Phone Number')} <span style={{color: '#DC2626'}}>*</span></label>
                <input type="tel" name="phone" style={inputStyle} value={formData.phone} onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>{t('ngo.website', 'Website')}</label>
                <input type="url" name="website" style={inputStyle} value={formData.website} onChange={handleChange} placeholder="https://" />
              </div>
              <div>
                <label style={labelStyle}>{t('ngo.organizationType', 'Organization Type')}</label>
                <input type="text" name="organization_type" style={inputStyle} value={formData.organization_type} onChange={handleChange} placeholder={t('ngo.orgTypePlaceholder', 'e.g. Non-Profit Organization')} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>{t('ngo.missionDescription', 'Mission / Description')} <span style={{color: '#DC2626'}}>*</span></label>
              <textarea 
                name="description" 
                style={{...inputStyle, minHeight: '100px', resize: 'vertical'}} 
                value={formData.description} 
                onChange={handleChange} 
                required 
                maxLength={500}
              />
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                {formData.description.length}/500
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', marginBottom: '20px' }}>{t('ngo.address', 'Address')}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" name="address" style={{...inputStyle, paddingLeft: '38px'}} value={formData.address} onChange={handleChange} placeholder={t('ngo.streetAddress', 'Street Address')} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '32px' }}>
              <input type="text" name="city" style={inputStyle} value={formData.city} onChange={handleChange} placeholder={t('common.city', 'City')} />
              <input type="text" name="postal_code" style={inputStyle} value={formData.postal_code} onChange={handleChange} placeholder={t('common.zipCode', 'ZIP / Postal Code')} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #EAE5DE' }}>
              <NgoButton type="button" variant="outline" onClick={fetchData} disabled={saving}>
                {t('actions.cancel', 'Cancel')}
              </NgoButton>
              <NgoButton type="submit" variant="primary" disabled={saving}>
                {saving ? t('actions.saving', 'Saving...') : t('actions.saveChanges', 'Save Changes')}
              </NgoButton>
            </div>
          </form>
        </div>

        {/* Right Side Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Verification Status */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>{t('ngo.verificationStatus', 'Verification Status')}</h3>
            {profile.verification_status === 'VERIFIED' ? (
              <div style={{ backgroundColor: '#ECFDF5', padding: '16px', borderRadius: '8px', border: '1px solid #A7F3D0', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BadgeCheck size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#064E3B', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{t('ngo.verifiedNgo', 'Verified NGO')}</h4>
                  <p style={{ margin: 0, color: '#047857', fontSize: '13px', lineHeight: 1.4 }}>{t('ngo.verifiedDesc', 'Your organization has been verified by the admin team.')}</p>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#FFFBEB', padding: '16px', borderRadius: '8px', border: '1px solid #FDE68A', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#78350F', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{t('ngo.pendingVerification', 'Pending Verification')}</h4>
                  <p style={{ margin: 0, color: '#92400E', fontSize: '13px', lineHeight: 1.4 }}>{t('ngo.pendingVerificationDesc', 'Your organization is awaiting verification by the admin team.')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Verification Documents */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #EAE5DE' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#1A1A1A" />
                {t('ngo.verificationDocuments', 'Verification Documents')}
              </div>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F3F4F6', color: '#374151', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {documents.length}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input type="file" ref={docInputRef} onChange={handleDocumentChange} style={{ display: 'none' }} accept=".pdf, image/png, image/jpeg" />
              {documents.map((doc) => (
                <div key={doc.id} style={{ border: '1px solid #EAE5DE', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: doc.colorBg, color: doc.colorIcon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>{doc.title}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>{doc.filename} • {doc.size}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {doc.url ? (
                      <>
                        <button onClick={() => setActiveDocument(doc)} style={{ backgroundColor: '#ffffff', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={14} /> {t('common.view', 'View')}
                        </button>
                        <button onClick={() => handleDocumentClick(doc.id)} style={{ backgroundColor: '#ffffff', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UploadCloud size={14} /> Update
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleDocumentClick(doc.id)} style={{ backgroundColor: '#E86A33', border: '1px solid #E86A33', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UploadCloud size={14} /> Upload
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NGO Focus Areas */}
          <div style={cardStyle}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Compass size={18} color="#1A1A1A" />
              {t('ngo.focusAreas', 'NGO Focus Areas')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DEMO_FOCUS_AREAS.map((area, idx) => {
                const style = getFocusTagStyle(area);
                return (
                  <span key={idx} style={{ backgroundColor: style.bg, color: style.color, padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600 }}>
                    {area}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Impact Highlights */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>{t('ngo.impactHighlights', 'Impact Highlights')}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', border: '1px solid #EAE5DE', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#3B82F6', backgroundColor: '#EFF6FF', padding: '8px', borderRadius: '8px' }}><Users size={20} /></div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>{analytics?.total_people_helped || 0}+</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{t('ngo.peopleHelped', 'People Helped')}</div>
                </div>
              </div>
              
              <div style={{ padding: '12px', border: '1px solid #EAE5DE', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#10B981', backgroundColor: '#ECFDF5', padding: '8px', borderRadius: '8px' }}><Package size={20} /></div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>{analytics?.total_items || 0}+</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{t('ngo.itemsReceived', 'Items Received')}</div>
                </div>
              </div>
              

              <div style={{ padding: '12px', border: '1px solid #EAE5DE', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#EF4444', backgroundColor: '#FEF2F2', padding: '8px', borderRadius: '8px' }}><Heart size={20} /></div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>{analytics?.active_programs || '0'}+</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{t('ngo.activePrograms', 'Active Programs')}</div>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: '#FFF7ED', padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#9A3412', fontSize: '12px', fontStyle: 'italic' }}>
              <span style={{ fontSize: '16px' }}>🌿</span>
              {t('ngo.impactQuote', 'Together, we can create a more compassionate and inclusive society.')}
            </div>
          </div>

          {/* Account Information */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>{t('ngo.accountInformation', 'Account Information')}</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #EAE5DE', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#6B7280' }}>{t('ngo.registeredOn', 'Registered On')}</span>
              <span style={{ fontWeight: 500, color: '#1A1A1A' }}>{new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #EAE5DE', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#6B7280' }}>{t('ngo.lastUpdated', 'Last Updated')}</span>
              <span style={{ fontWeight: 500, color: '#1A1A1A' }}>{new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #EAE5DE', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#6B7280' }}>{t('ngo.accountStatus', 'Account Status')}</span>
              <span style={{ backgroundColor: '#ECFDF5', color: '#047857', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '11px' }}>{profile.account_status}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#6B7280' }}>{t('ngo.organizationId', 'Organization ID')}</span>
              <span style={{ fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>NGO-{new Date(profile.created_at).getFullYear()}-{profile.id.toString().padStart(4, '0')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {activeDocument && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#F9FAFB', borderRadius: '16px', maxWidth: '800px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: activeDocument.colorBg, color: activeDocument.colorIcon, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>{activeDocument.title}</h3>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{activeDocument.filename} • {activeDocument.size}</div>
                </div>
              </div>
              <button onClick={() => setActiveDocument(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '6px', borderRadius: '6px' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '30px', flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              {activeDocument.url ? (
                activeDocument.url.endsWith('.pdf') ? (
                  <iframe src={`/api${activeDocument.url}`} width="100%" height="500px" style={{ border: 'none' }} title={activeDocument.title} />
                ) : (
                  <img src={`/api${activeDocument.url}`} alt={activeDocument.title} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                )
              ) : (
                <div style={{ border: '2px dashed #D1D5DB', borderRadius: '12px', width: '100%', height: '100%', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '40px 20px', marginTop: '20px', fontSize: '14px', color: '#4B5563', textAlign: 'center' }}>
                  📄 {t('ngo.documentPreviewLoaded', 'Document preview loaded.')}
                  <br />
                  <span style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px', display: 'block' }}>{t('ngo.documentPreviewDesc', 'Official registration document issued by relevant authority.')}</span>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#ffffff' }}>
              {activeDocument.url && (
                <a href={`/api${activeDocument.url}`} download target="_blank" rel="noreferrer" style={{ textDecoration: 'none', backgroundColor: '#ffffff', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> {t('common.download', 'Download')}
                </a>
              )}
              <button onClick={() => setActiveDocument(null)} style={{ backgroundColor: '#D9531E', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {t('common.closePreview', 'Close Preview')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple icons for missing imports
const CheckCircle = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const AlertCircle = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;


