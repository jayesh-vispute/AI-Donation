import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, MapPin, Phone, Bell, Save, Camera, Heart, Users, Calendar, LogOut, Home, Building2, Leaf, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export default function DonorProfile() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    preferences: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ donations: 0, matches: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load stats
        const donations = await api.getDonorDonations('all');
        const matchesCount = donations.filter(d => d.status && d.status !== 'PENDING').length;
        setStats({ donations: donations.length, matches: matchesCount });
        
        // Load profile
        const profileData = await api.getDonorProfile();
        setFormData({
          full_name: profileData.user?.full_name || user?.displayName || '',
          email: profileData.user?.email || user?.email || '',
          phone: profileData.user?.phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          postal_code: profileData.postal_code || '',
          preferences: profileData.preferences || {}
        });
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    if (e.target.name.startsWith('notify')) {
      setFormData(prev => ({
        ...prev,
        preferences: { ...prev.preferences, [e.target.name]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: value }));
    }
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateDonorSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 42px',
    borderRadius: '8px',
    border: '1px solid #EAE5DE',
    backgroundColor: '#FFFDF9',
    fontSize: '14px',
    color: '#2B1D14',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };
  
  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#2B1D14',
    marginBottom: '6px'
  };

  const sectionStyle = {
    backgroundColor: '#FFFDF9',
    borderRadius: '16px',
    padding: 'clamp(16px, 3vw, 24px)',
    border: '1px solid #EAE5DE',
    marginBottom: '24px'
  };

  const IconWrapper = ({ icon: Icon, bg, color }) => (
    <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} />
    </div>
  );

  return (
    <div style={{ 
      fontFamily: 'Inter, sans-serif',
      color: '#2B1D14'
    }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.donor', 'Donor'), to: '/donor' },
            { label: t('navigation.profile', 'Profile') }
          ]} />

          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontFamily: 'Fraunces, serif', margin: '0 0 8px 0', color: '#2B1D14', fontWeight: 700 }}>{t('navigation.profile', 'Profile')}</h1>
          <p style={{ color: '#4A3D34', fontSize: '16px', margin: 0 }}>
            {t('donor.profileDesc', 'Manage your personal information and preferences.')}
          </p>
        </div>

        {/* Decorative Quote */}
        <div style={{ textAlign: 'right', color: '#654B35', paddingTop: '16px', position: 'relative' }}>
          <h3 style={{ fontSize: 'clamp(16px, 2vw, 24px)', fontFamily: 'Fraunces, serif', fontStyle: 'italic', margin: 0, fontWeight: 500, zIndex: 2, position: 'relative' }} dangerouslySetInnerHTML={{ __html: t('donor.kindPeopleQuote', 'Kind people<br/>change the world. ♡') }}></h3>
          {/* Smudge background approximation */}
          <div style={{ position: 'absolute', top: '10px', right: '-20px', width: '260px', height: '60px', backgroundColor: '#FDF1EB', borderRadius: '40%', transform: 'rotate(-2deg)', zIndex: 1, filter: 'blur(10px)' }} />
          <div style={{ position: 'absolute', top: 0, right: '-40px', color: '#2F7A4F', zIndex: 3, transform: 'rotate(15deg)' }}><Leaf size={40} strokeWidth={1.5} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
        
        {/* Left Column - Summary Card */}
        <div>
          <div style={{ backgroundColor: '#FDFCFB', borderRadius: '24px', padding: '40px 32px', border: '1px solid #EAE5DE', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            
            {/* Avatar */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <div style={{ 
                width: 120, height: 120, borderRadius: '50%', backgroundColor: '#C4622D', 
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', fontWeight: 600,
                border: '6px solid #FDF1EB'
              }}>
                {formData.full_name ? formData.full_name[0] : 'U'}
              </div>
              <button type="button" style={{
                position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: '50%',
                backgroundColor: '#fff', color: '#2B1D14', border: '1px solid #EAE5DE', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <Camera size={16} />
              </button>
            </div>

            <h2 style={{ fontSize: '22px', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: '0 0 12px 0', color: '#2B1D14' }}>{formData.full_name}</h2>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 16px', backgroundColor: '#FDF1EB', color: '#C4622D', borderRadius: '100px', fontSize: '13px', fontWeight: 600, marginBottom: '32px' }}>
              <Heart size={14} /> {t('donor.donorMember', 'Donor Member')}
            </div>

            <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: '#654B35', fontSize: '18px', marginBottom: '16px', lineHeight: 1.4 }}
                 dangerouslySetInnerHTML={{ __html: t('donor.makingDifferenceQuote', '"Making a difference,<br/>one donation at a time."') }}>
            </div>
            <Leaf size={20} color="#2F7A4F" style={{ marginBottom: '32px' }} />

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#FFFDF9', padding: '16px', borderRadius: '12px', border: '1px solid #EAE5DE', textAlign: 'left' }}>
                 <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={20} /></div>
                 <div>
                   <div style={{ fontSize: '18px', fontWeight: 700, color: '#2B1D14', lineHeight: 1 }}>{stats.donations}</div>
                   <div style={{ fontSize: '13px', color: '#654B35', marginTop: '4px' }}>{t('donor.totalDonations', 'Total Donations')}</div>
                 </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#FFFDF9', padding: '16px', borderRadius: '12px', border: '1px solid #EAE5DE', textAlign: 'left' }}>
                 <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} /></div>
                 <div>
                   <div style={{ fontSize: '18px', fontWeight: 700, color: '#2B1D14', lineHeight: 1 }}>{stats.matches}</div>
                   <div style={{ fontSize: '13px', color: '#654B35', marginTop: '4px' }}>{t('donor.ngoMatches', 'NGO Matches')}</div>
                 </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#FFFDF9', padding: '16px', borderRadius: '12px', border: '1px solid #EAE5DE', textAlign: 'left' }}>
                 <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} /></div>
                 <div>
                   <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14', lineHeight: 1.2 }}>{t('donor.memberSince', 'Member Since')}</div>
                   <div style={{ fontSize: '16px', fontWeight: 700, color: '#2B1D14', marginTop: '2px' }}>Sep 2025</div>
                 </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column - Form */}
        <div>
          {saved && (
            <div style={{ padding: '16px', backgroundColor: '#E9F5EF', color: '#1B472E', borderRadius: '12px', marginBottom: '24px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #2F7A4F' }}>
              <CheckCircle size={18} /> {t('donor.profileSaved', 'Profile saved successfully.')}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* Personal Info Section */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                 <IconWrapper icon={User} bg="#FDF1EB" color="#C4622D" />
                 <div>
                   <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#2B1D14', fontFamily: 'Fraunces, serif' }}>{t('donor.personalInformation', 'Personal Information')}</h2>
                   <p style={{ margin: 0, fontSize: '13px', color: '#654B35' }}>{t('donor.updatePersonalDetails', 'Update your personal details')}</p>
                 </div>
              </div>

              <label style={labelStyle}>{t('donor.fullName', 'Full Name')}</label>
              <div style={inputContainerStyle}>
                <User size={18} color="#8C7A6B" style={{ position: 'absolute', left: '14px' }} />
                <input type="text" name="full_name" style={inputStyle} value={formData.full_name} onChange={handleChange} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>{t('donor.emailAddress', 'Email Address')}</label>
                  <div style={inputContainerStyle}>
                    <Mail size={18} color="#8C7A6B" style={{ position: 'absolute', left: '14px' }} />
                    <input type="email" name="email" style={inputStyle} value={formData.email} disabled />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{t('donor.phoneNumber', 'Phone Number')}</label>
                  <div style={inputContainerStyle}>
                    <Phone size={18} color="#8C7A6B" style={{ position: 'absolute', left: '14px' }} />
                    <input type="tel" name="phone" style={inputStyle} value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                 <IconWrapper icon={MapPin} bg="#FDF1EB" color="#C4622D" />
                 <div>
                   <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#2B1D14', fontFamily: 'Fraunces, serif' }}>{t('donor.defaultAddress', 'Default Address')}</h2>
                   <p style={{ margin: 0, fontSize: '13px', color: '#654B35' }}>{t('donor.whereToContact', 'Where should we contact you?')}</p>
                 </div>
              </div>
              
              <label style={labelStyle}>{t('donor.streetAddress', 'Street Address')}</label>
              <div style={inputContainerStyle}>
                <Home size={18} color="#8C7A6B" style={{ position: 'absolute', left: '14px' }} />
                <input type="text" name="address" style={inputStyle} value={formData.address} onChange={handleChange} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>{t('donor.city', 'City')}</label>
                  <div style={inputContainerStyle}>
                    <Building2 size={18} color="#8C7A6B" style={{ position: 'absolute', left: '14px' }} />
                    <input type="text" name="city" style={inputStyle} value={formData.city} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{t('donor.state', 'State')}</label>
                  <div style={inputContainerStyle}>
                    <MapPin size={18} color="#8C7A6B" style={{ position: 'absolute', left: '14px' }} />
                    <input type="text" name="state" style={inputStyle} value={formData.state} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{t('donor.zipCode', 'ZIP Code')}</label>
                  <div style={inputContainerStyle}>
                    <MapPin size={18} color="#8C7A6B" style={{ position: 'absolute', left: '14px' }} />
                    <input type="text" name="postal_code" style={inputStyle} value={formData.postal_code} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                 <IconWrapper icon={Bell} bg="#FDF1EB" color="#C4622D" />
                 <div>
                   <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#2B1D14', fontFamily: 'Fraunces, serif' }}>{t('donor.notificationPreferences', 'Notification Preferences')}</h2>
                   <p style={{ margin: 0, fontSize: '13px', color: '#654B35' }}>{t('donor.chooseNotifications', 'Choose how you want to be notified')}</p>
                 </div>
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer' }}>
                <input type="checkbox" name="notifyEmail" checked={formData.preferences?.notifyEmail !== false} onChange={handleChange} style={{ width: 18, height: 18, accentColor: '#C4622D' }} />
                <span style={{ fontSize: '14px', color: '#2B1D14', fontWeight: 500 }}>{t('donor.emailUpdates', 'Email updates for donation status and matches')}</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="notifySMS" checked={formData.preferences?.notifySMS === true} onChange={handleChange} style={{ width: 18, height: 18, accentColor: '#C4622D' }} />
                <span style={{ fontSize: '14px', color: '#2B1D14', fontWeight: 500 }}>{t('donor.smsUpdates', 'SMS updates for pickups and delivery')}</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button 
                type="button" 
                onClick={logout}
                style={{
                  background: 'transparent', border: '1px solid #C4622D', borderRadius: '8px',
                  padding: '12px 24px', color: '#C4622D', fontWeight: 600,
                  fontSize: '15px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FDF1EB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={18} /> {t('donor.logOut', 'Log Out')}
              </button>
              
              <button 
                type="submit" 
                style={{
                  background: '#C4622D', border: 'none', borderRadius: '8px',
                  padding: '12px 32px', color: '#fff', fontWeight: 600,
                  fontSize: '15px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B25424'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C4622D'}
                disabled={saving}
              >
                <Save size={18} /> {saving ? t('donor.saving', 'Saving...') : t('donor.saveChanges', 'Save Changes')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


