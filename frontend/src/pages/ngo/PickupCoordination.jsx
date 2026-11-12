import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, MapPin, User, Users, Package } from 'lucide-react';
import NgoButton from '../../components/ngo/NgoButton';
import { api } from '../../services/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function PickupCoordination() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [volunteer, setVolunteer] = useState('');
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    const fetchDonation = async () => {
      try {
        setLoading(true);
        const data = await api.getNgoDonationRequest(id);
        setDonation(data);
        if (data.pickup) {
          if (data.pickup.volunteer) setVolunteer(data.pickup.volunteer);
          if (data.pickup.notes) setNotes(data.pickup.notes);
        }
      } catch (err) {
        setError(t('errors.failedLoadDonation'));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDonation();
  }, [id, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!donation?.pickup?.id) {
      alert(t('errors.noPickupToConfirm'));
      return;
    }
    try {
      setSaving(true);
      await api.updatePickup(donation.pickup.id, {
        status: 'CONFIRMED',
        volunteer,
        notes
      });
      setSubmitted(true);
    } catch (err) {
      alert(t('errors.failedSchedulePickup'));
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    const pickupDate = donation?.pickup
      ? new Date(donation.pickup.date).toLocaleDateString()
      : t('ngo.pickup.scheduledDateFallback');
    const pickupTime = donation?.pickup?.time_slot || '';

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: 'var(--space-6) 0' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(47, 122, 79, 0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)',
          color: 'var(--secondary-600)'
        }}>
          <CheckCircle2 size={40} />
        </div>
        
        <h1 style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>{t('success.pickupScheduled')}</h1>
        <p style={{ color: 'var(--neutral-600)', fontSize: '16px', marginBottom: 'var(--space-5)', lineHeight: 1.5 }}>
          {t('ngo.pickup.scheduledDesc', { date: pickupDate, time: pickupTime })}
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
          <NgoButton variant="outline" onClick={() => navigate('/ngo/donations')}>{t('ngo.pickup.viewRequests')}</NgoButton>
          <NgoButton variant="primary" onClick={() => navigate('/ngo')}>{t('ngo.pickup.backToDashboard')}</NgoButton>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-btn)',
    border: '1px solid #EAE5DE', backgroundColor: 'var(--neutral-0)',
    fontSize: '15px', color: 'var(--neutral-900)', fontFamily: 'var(--font-body)',
    marginBottom: 'var(--space-4)'
  };
  
  const labelStyle = {
    display: 'block', fontSize: '14px', fontWeight: '600',
    color: 'var(--neutral-900)', marginBottom: '8px'
  };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center' }}>{t('common.loading')}</div>;
  if (error || !donation) return <div style={{ padding: '24px', textAlign: 'center', color: 'red' }}>{error || t('errors.donationNotFoundShort')}</div>;

  const itemsCount = donation.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: 'var(--space-6)' }}>
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.ngo', 'NGO'), to: '/ngo' },
        { label: t('navigation.donations', 'Donations'), to: '/ngo/donations' },
        { label: t('ngo.pickup.title', 'Pickup Coordination') }
      ]} />
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-5)', gap: 'var(--space-3)' }}>
        <button 
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: 'var(--neutral-0)', border: '1px solid #EAE5DE', width: 40, height: 40, borderRadius: 'var(--radius-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>{t('ngo.pickup.title')}</h1>
      </div>

      <div style={{ 
        backgroundColor: '#FDFCFB', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)',
        border: '1px solid #EAE5DE', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap'
      }}>
        <div style={{ 
          width: 48, height: 48, borderRadius: '8px', backgroundColor: 'var(--neutral-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-600)'
        }}>
          <User size={24} />
        </div>
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--neutral-900)' }}>{donation.donor_name || t('common.donor')}</div>
          <div style={{ fontSize: '14px', color: 'var(--neutral-600)', marginBottom: '4px', wordBreak: 'break-word' }}>
            {donation.donor_email} {donation.donor_phone && `• ${donation.donor_phone}`}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--neutral-600)' }}>{t('ngo.pickup.donorWaiting', { count: itemsCount })}</div>
        </div>
      </div>

      {/* Allocated Items to Pick Up */}
      {donation.items && donation.items.length > 0 && (
        <div style={{ 
          backgroundColor: '#FDFCFB', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)',
          border: '1px solid #EAE5DE', marginBottom: 'var(--space-5)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={16} color="#C4622D" />
            {t('ngo.pickup.itemsToCollect', 'Allocated Items to Pick Up')} ({donation.items.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {donation.items.map((item, idx) => (
              <div key={item.id || idx} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '8px',
                border: '1px solid #F0ECE6'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14' }}>
                  {item.title || item.detected_item || item.category}
                </span>
                <span style={{ 
                  padding: '4px 10px', borderRadius: '100px', fontSize: '13px', fontWeight: 700,
                  backgroundColor: 'rgba(196, 98, 45, 0.1)', color: '#C4622D'
                }}>
                  ×{item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        {/* Address (Read Only) */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={labelStyle}>{t('ngo.pickup.pickupLocation')}</label>
          <div style={{ position: 'relative' }}>
            <MapPin size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--neutral-600)' }} />
            <input 
              type="text" 
              value={donation.pickup_address || t('ngo.pickup.localPickupFallback')} 
              disabled
              style={{ ...inputStyle, paddingLeft: 42, backgroundColor: '#FDFCFB', color: 'var(--neutral-600)', marginBottom: 0 }} 
            />
          </div>
        </div>

        {/* Date Selector (Read Only) */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={labelStyle}>{t('ngo.pickup.scheduledDate')}</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              value={donation.pickup ? new Date(donation.pickup.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : t('ngo.pickup.pending')} 
              disabled
              style={{ ...inputStyle, backgroundColor: '#FDFCFB', color: 'var(--neutral-600)', marginBottom: 0 }} 
            />
          </div>
        </div>

        {/* Time Selector (Read Only) */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={labelStyle}>{t('ngo.pickup.scheduledTimeSlot')}</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              value={donation.pickup?.time_slot || t('ngo.pickup.pending')} 
              disabled
              style={{ ...inputStyle, backgroundColor: '#FDFCFB', color: 'var(--neutral-600)', marginBottom: 0 }} 
            />
          </div>
        </div>

        {/* Volunteer Assignment */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={labelStyle}>{t('ngo.pickup.assignVolunteer')}</label>
          <div style={{ position: 'relative' }}>
            <Users size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--neutral-600)' }} />
            <select
              value={volunteer}
              onChange={e => setVolunteer(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 42, cursor: 'pointer', appearance: 'none' }}
              required
            >
              <option value="" disabled>{t('ngo.pickup.selectTeamMember')}</option>
              <option value="vol-1">Rahul Sharma</option>
              <option value="vol-2">Priya Patel</option>
              <option value="vol-3">Amit Kumar (Driver)</option>
              <option value="unassigned">{t('ngo.pickup.leaveUnassigned')}</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={labelStyle}>{t('ngo.pickup.internalNotes')}</label>
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            placeholder={t('ngo.pickup.notesPlaceholder')}
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
          />
        </div>

        <NgoButton type="submit" variant="secondary" fullWidth disabled={saving}>
          <CheckCircle2 size={18} /> {saving ? t('ngo.pickup.scheduling') : t('ngo.pickup.confirmNotifyDonor')}
        </NgoButton>
      </form>
    </div>
  );
}
