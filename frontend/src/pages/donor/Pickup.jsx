import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MapPin, Building2, DoorOpen, Phone, Calendar, Clock, AlertCircle, RefreshCw, Truck } from 'lucide-react';
import DonorButton from '../../components/donor/DonorButton';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

export default function Pickup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: donationId } = useParams();
  
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [targetDonation, setTargetDonation] = useState(null);
  const [ngoInfo, setNgoInfo] = useState(null);
  const [donorProfile, setDonorProfile] = useState(null);

  // Form State
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [profileMissingAddress, setProfileMissingAddress] = useState(false);
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      console.log("[Pickup] donationId:", donationId);
      console.log("[Pickup] route:", window.location.pathname);
      
      let donId = donationId;
      
      if (!donId) {
        setErrorMsg(t('donor.donationIdNotFound', "Donation ID not found. Please select a valid donation."));
        setLoading(false);
        return;
      }

      // Load slots first
      let slots = [];
      try {
        slots = await api.getPickups();
        setAvailableSlots(slots);
      } catch(e) {
        console.warn("Failed to load slots", e);
      }

      // Load donation
      let don;
      try {
        don = await api.getPickupDetails(donId);
      } catch(e) {
        if (e.message?.includes('404')) {
           don = await api.getDonation(donId);
        } else {
           throw e;
        }
      }
      
      if (!don) {
         setErrorMsg(t('donor.donationNotFoundMessage', "Donation or pickup information was not found."));
         setLoading(false);
         return;
      }
      setTargetDonation(don);

      // Load Donor Profile
      let profileAddr = '', profileCity = '', profileState = '', profileZip = '', profilePhone = '';
      try {
        const profile = await api.getDonorProfile();
        setDonorProfile(profile);
        if (profile) {
          profileAddr = profile.address || '';
          profileCity = profile.city || '';
          profileState = profile.state || '';
          profileZip = profile.postal_code || '';
          profilePhone = profile.phone_number || '';
        }
      } catch (e) {
        console.warn("Failed to load donor profile address:", e);
      }

      // Handle existing pickup
      if (don.pickup_scheduled_at || don.status === 'PICKUP_SCHEDULED' || don.pickup) {
          // It's already scheduled
          let pickupDateObj = don.pickup_scheduled_at ? new Date(don.pickup_scheduled_at) : (don.pickup ? new Date(don.pickup.date) : new Date());
          let timeStr = don.pickup?.time_slot || (don.pickup_scheduled_at ? new Date(don.pickup_scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '');
          
          let formattedDateStr = pickupDateObj.toISOString().split('T')[0];
          setSelectedDate(slots.find(s => s.date === formattedDateStr) || { date: formattedDateStr, time_slots: [] });
          setSelectedTime(timeStr);
          setAddress(don.pickup_address || don.pickup?.address || profileAddr);
          setContactNumber(profilePhone);
          
          if (don.pickup?.notes || don.notes) {
              let parsedNotes = don.pickup?.notes || don.notes || '';
              if (parsedNotes.includes('[Leave at Door]')) {
                setLeaveAtDoor(true);
                parsedNotes = parsedNotes.replace('[Leave at Door]', '').trim();
              }
              setNotes(parsedNotes);
          }
          
          setSubmitted(true);
      } else {
          // Not scheduled yet
          if (!profileAddr) {
            setProfileMissingAddress(true);
          }
          setAddress(profileAddr);
          setCity(profileCity);
          setState(profileState);
          setZip(profileZip);
          setContactNumber(profilePhone);
      }

      if (don.ngo_id) {
        try {
          const ngoData = await api.getNgo(don.ngo_id);
          setNgoInfo(ngoData);
        } catch (nErr) {
          console.warn("Could not load NGO info:", nErr);
        }
      }

    } catch (err) {
      console.error("Failed to load pickup info:", err);
      if (err.message?.includes('401')) setErrorMsg(t('donor.sessionExpired', "Your session has expired. Please log in again."));
      else if (err.message?.includes('403')) setErrorMsg(t('donor.notAuthorizedPickup', "You are not authorized to view this pickup."));
      else if (err.message?.includes('404')) setErrorMsg(t('donor.donationNotFoundMessage', "Donation or pickup information was not found."));
      else setErrorMsg(err.message || t('donor.serverConnectionError', "Unable to connect to the server."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [donationId]);

  const parseScheduledAt = (dateStr, timeSlotStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    let [time, modifier] = timeSlotStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const getLabelForDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = d.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('dates.today', 'Today');
    if (diffDays === 1) return t('dates.tomorrow', 'Tomorrow');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!targetDonation?.id) return;
    
    if (profileMissingAddress || !address) {
      setErrorMsg(t('donor.updateProfileAddress', "Please update your profile with a valid address or enter one below before scheduling."));
      return;
    }
    if (!selectedDate || !selectedTime) {
      setErrorMsg(t('donor.selectPickupDateTime', "Please select both a pickup date and a time slot."));
      return;
    }
    
    try {
      setSubmitting(true);
      const scheduledAt = parseScheduledAt(selectedDate.date, selectedTime);

      await api.schedulePickup(targetDonation.id, {
        scheduled_at: scheduledAt.toISOString(),
        pickup_address: address,
        pickup_city: city,
        pickup_state: state,
        pickup_postal_code: zip,
        notes: leaveAtDoor ? `[Leave at Door] ${notes}` : notes
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Pickup scheduling failed:", err);
      if (err.message?.includes('401')) setErrorMsg(t('donor.sessionExpired', "Your session has expired. Please log in again."));
      else if (err.message?.includes('403')) setErrorMsg(t('donor.notAuthorizedSchedulePickup', "You are not authorized to schedule this pickup."));
      else if (err.message?.includes('404')) setErrorMsg(t('donor.donationNotFoundMessage', "Donation or pickup information was not found."));
      else if (err.message?.includes('409')) setErrorMsg(t('donor.pickupSlotUnavailable', "This pickup slot is no longer available."));
      else if (err.message?.includes('422')) setErrorMsg(t('donor.checkPickupInfo', "Please check the pickup information."));
      else setErrorMsg(err.message || t('donor.unableToSchedulePickup', "Unable to schedule the pickup. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px', textAlign: 'center', color: '#654B35', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'inline-block', border: '3px solid #FDF1EB', borderTop: '3px solid #C4622D', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', marginBottom: 16 }}></div>
        <div>{t('uiTemplates.loadingPickupDetails', 'Loading pickup details...')}</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totalItemsCount = targetDonation?.items?.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0) || 0;

  if (submitted) {
    const isPickupScheduled = !!(targetDonation?.pickup || targetDonation?.pickup_scheduled_at || targetDonation?.status === 'PICKUP_SCHEDULED');
    
    return (
      <div style={{ maxWidth: '650px', margin: '0 auto', textAlign: 'center', padding: '48px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E6F7EF', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          color: '#2F7A4F'
        }}>
          <CheckCircle2 size={40} />
        </div>
        
        <h1 style={{ fontSize: '32px', marginBottom: '8px', color: '#2B1D14', fontFamily: 'Fraunces, serif' }}>
          {t('donor.pickupScheduled', 'Pickup Scheduled')}
        </h1>
        <p style={{ color: '#654B35', fontSize: '16px', marginBottom: '32px', lineHeight: 1.5 }}>
          {t('uiTemplates.pickupScheduledDesc', 'Your donation has been scheduled for pickup.')}<br/>
          <strong>{t('uiTemplates.donationNumber', 'Donation #{{id}}', { id: targetDonation?.id })}</strong>
        </p>

        {/* Pickup Summary Card */}
        <div style={{ 
          backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '12px',
          padding: '24px', textAlign: 'left', marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#2B1D14', borderBottom: '1px solid #EAE5DE', paddingBottom: '12px' }}>
            {t('uiTemplates.pickupDetails', 'Pickup Details')}
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Calendar size={20} color="#C4622D" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('uiTemplates.date', 'Date')}</div>
                <div style={{ fontSize: '15px', color: '#2B1D14', fontWeight: 500 }}>
                  {selectedDate?.date ? new Date(selectedDate.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : t('uiTemplates.notSpecified')}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Clock size={20} color="#C4622D" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('uiTemplates.time', 'Time')}</div>
                <div style={{ fontSize: '15px', color: '#2B1D14', fontWeight: 500 }}>{selectedTime || t('uiTemplates.notSpecified')}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <MapPin size={20} color="#C4622D" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('uiTemplates.pickupAddress', 'Pickup Address')}</div>
                <div style={{ fontSize: '15px', color: '#2B1D14', fontWeight: 500, lineHeight: 1.4 }}>{address || t('donor.notProvided')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Phone size={20} color="#C4622D" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('uiTemplates.contactNumber', 'Contact Number')}</div>
                <div style={{ fontSize: '15px', color: '#2B1D14', fontWeight: 500 }}>{contactNumber || t('donor.notProvided')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircle2 size={20} color="#C4622D" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('uiTemplates.packagingStatus', 'Packaging Status')}</div>
                <div style={{ fontSize: '15px', color: '#2B1D14', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  {targetDonation?.status === 'SEALED' ? t('uiTemplates.sealed', 'Sealed') : (targetDonation?.status === 'PACKED' ? t('uiTemplates.packed', 'Packed') : t('status.completed', 'Completed'))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Truck size={20} color="#C4622D" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('uiTemplates.pickupStatus', 'Pickup Status')}</div>
                <div style={{ fontSize: '15px', color: '#2B1D14', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isPickupScheduled ? (
                    <><CheckCircle2 size={16} color="#16A34A" /> {t('status.scheduled', 'Scheduled')}</>
                  ) : (
                    <><RefreshCw size={16} color="#C4622D" /> {t('status.pending', 'Pending')}</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NGO Partner */}
        {ngoInfo && (
          <div style={{ 
            backgroundColor: '#fff', border: '1px solid #EAE5DE', borderRadius: '12px',
            padding: '20px 24px', textAlign: 'left', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '16px'
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '8px', backgroundColor: '#FDF1EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4622D' }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{t('uiTemplates.ngoPartner', 'NGO Partner')}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#2B1D14' }}>{ngoInfo.organization_name}</div>
            </div>
          </div>
        )}

        {/* Next Steps Card */}
        <div style={{ 
          backgroundColor: '#fff', border: '1px solid #EAE5DE', borderRadius: '12px',
          padding: '24px', textAlign: 'left', marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#2B1D14' }}>
            {t('uiTemplates.whatsNext', "What's Next")}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#2F7A4F', fontWeight: 500 }}>
              <CheckCircle2 size={18} /> {t('uiTemplates.donationRegistered', 'Donation Registered')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#2F7A4F', fontWeight: 500 }}>
              <CheckCircle2 size={18} /> {t('uiTemplates.ngoMatched', 'NGO Matched')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#2F7A4F', fontWeight: 500 }}>
              <CheckCircle2 size={18} /> {t('uiTemplates.packagingCompleted', 'Packaging Completed')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isPickupScheduled ? '#2F7A4F' : '#654B35', fontWeight: 500 }}>
              {isPickupScheduled ? <CheckCircle2 size={18} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #C4622D', margin: '2px' }} />} 
              {t('status.pickupScheduled', 'Pickup Scheduled')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#A39284', fontWeight: 500 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #EAE5DE', margin: '2px' }} /> 
              {t('status.collected', 'Collected')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#A39284', fontWeight: 500 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #EAE5DE', margin: '2px' }} /> 
              {t('status.delivered', 'Delivered')}
            </div>
          </div>
        </div>

        {/* Notification Message */}
        {ngoInfo && isPickupScheduled && (
          <div style={{ 
            backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px',
            padding: '16px', textAlign: 'left', marginBottom: '32px',
            display: 'flex', alignItems: 'flex-start', gap: '12px'
          }}>
            <AlertCircle size={20} color="#2563EB" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E3A8A', marginBottom: '4px' }}>{t('donor.notificationSent', 'Notification sent')}</div>
              <div style={{ fontSize: '14px', color: '#1E40AF', lineHeight: 1.4 }}>
                {t('donor.ngoNotifiedPickup', 'The matched NGO has been notified about your scheduled pickup.')}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px', margin: '0 auto' }}>
          <DonorButton variant="primary" onClick={() => navigate(`/donations/${targetDonation?.id}`)} fullWidth>
            {t('donor.viewTracking', 'View Tracking →')}
          </DonorButton>
          <button 
            onClick={() => navigate('/donations')}
            style={{ 
              background: 'transparent', border: 'none', color: '#654B35', fontWeight: 600, 
              fontSize: '15px', padding: '12px', cursor: 'pointer' 
            }}
          >
            {t('donor.backToDashboard', 'Back to Dashboard')}
          </button>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '8px',
    border: '1px solid #EAE5DE', backgroundColor: '#fff',
    fontSize: '15px', color: '#2B1D14', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif'
  };
  
  const labelStyle = {
    display: 'block', fontSize: '14px', fontWeight: '600',
    color: '#2B1D14', marginBottom: '8px'
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '48px', fontFamily: 'Inter, sans-serif', color: '#2B1D14' }}>
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.donor', 'Donor'), to: '/donor' },
        { label: t('navigation.myDonations', 'My Donations'), to: '/donations' },
        { label: t('status.pickupScheduled', 'Pickup Schedule') }
      ]} />
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: '#fff', border: '1px solid #EAE5DE', width: 40, height: 40, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 'clamp(18px, 3vw, 24px)', margin: 0, fontFamily: 'Fraunces, serif', wordBreak: 'break-word' }}>
          {t('donor.schedulePickupForDonation', 'Schedule Pickup for Donation #{{id}}', { id: targetDonation?.id || '' })}
        </h1>
      </div>

      {errorMsg && (
        <div style={{ 
          backgroundColor: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', 
          padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' 
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, fontSize: '14px', lineHeight: 1.5 }}>{errorMsg}</div>
        </div>
      )}

      <div style={{ 
        backgroundColor: '#FFFDF9', borderRadius: '12px', padding: '20px',
        border: '1px solid #EAE5DE', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <div style={{ 
          width: 48, height: 48, borderRadius: '8px', backgroundColor: '#FDF1EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4622D',
          border: '1px solid #F8E3D8', flexShrink: 0
        }}>
          <Building2 size={24} />
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#2B1D14' }}>
            {ngoInfo?.organization_name || t('donor.matchedNgoPartner', 'Matched NGO Partner')}
          </div>
          <div style={{ fontSize: '14px', color: '#654B35' }}>
            {t('donor.willCollectItems', 'Will collect your {{count}} item(s).', { count: totalItemsCount > 0 ? totalItemsCount : t('donor.donationItemsFallback', 'donation items') })}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Address */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>{t('donor.pickupAddressLabel', 'Pickup Address')}</label>
          
          {profileMissingAddress && (
            <div style={{ padding: '12px', backgroundColor: '#FDF1EB', border: '1px solid #C4622D', borderRadius: '8px', color: '#2B1D14', marginBottom: '16px', fontSize: '14px' }}>
              <strong>{t('donor.pickupAddressNotProvided', 'Pickup address not provided.')}</strong> {t('donor.pleaseUpdateProfileOrEnter', 'Please')} <span onClick={() => navigate('/donor/profile')} style={{ color: '#C4622D', textDecoration: 'underline', cursor: 'pointer' }}>{t('donor.updateYourProfile', 'update your profile')}</span> {t('donor.orEnterAddressBelow', 'or enter an address below.')}
            </div>
          )}
          
          <div style={{ position: 'relative' }}>
            <MapPin size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#8C7A6B' }} />
            <input 
              type="text" 
              value={address} 
              onChange={e => {
                setAddress(e.target.value);
                if (e.target.value) setProfileMissingAddress(false);
              }} 
              placeholder={t('donor.enterStreetAddress', 'Enter street address')}
              required
              style={{ ...inputStyle, paddingLeft: 42, marginBottom: 0 }} 
            />
          </div>
        </div>

        {/* Contact Number */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>{t('donor.contactNumberLabel', 'Contact Number')}</label>
          <div style={{ position: 'relative' }}>
            <Phone size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#8C7A6B' }} />
            <input 
              type="text" 
              value={contactNumber} 
              onChange={e => setContactNumber(e.target.value)}
              placeholder={t('donor.enterContactNumber', 'Enter contact number')}
              required
              style={{ ...inputStyle, paddingLeft: 42, marginBottom: 0, backgroundColor: '#fff', cursor: 'text' }} 
            />
          </div>
        </div>

        {/* Date Selector (Scrollable Pills) */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>{t('donor.selectPickupDate', 'Select Pickup Date')}</label>
            <button type="button" onClick={loadData} style={{ background: 'none', border: 'none', color: '#C4622D', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={14} /> {t('donor.refreshSlots', 'Refresh Slots')}
            </button>
          </div>
          
          {availableSlots.length === 0 ? (
            <div style={{ padding: '16px', backgroundColor: '#F9FAFB', border: '1px solid #EAE5DE', borderRadius: '8px', color: '#654B35', fontSize: '14px', fontStyle: 'italic' }}>
              {t('donor.noPickupSlotsAvailable', 'No pickup slots are currently available.')}
            </div>
          ) : (
            <div style={{ 
              display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px',
              WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none'
            }}>
              {availableSlots.map((slot) => {
                const isSelected = selectedDate?.date === slot.date;
                return (
                  <button
                    key={slot.date}
                    type="button"
                    onClick={() => { setSelectedDate(slot); setSelectedTime(''); }}
                    style={{
                      padding: '12px 24px', borderRadius: '100px', fontSize: '15px', fontWeight: 600,
                      whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
                      border: isSelected ? 'none' : '1px solid #EAE5DE',
                      backgroundColor: isSelected ? '#C4622D' : '#fff',
                      color: isSelected ? '#fff' : '#654B35',
                      transition: 'all 150ms ease-out'
                    }}
                  >
                    {getLabelForDate(slot.date)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Time Selector (Grid of Pills) */}
        {selectedDate && (
          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>{t('donor.availableTimeSlots', 'Available Time Slots')}</label>
            {selectedDate.time_slots && selectedDate.time_slots.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 120px), 1fr))', gap: '12px' }}>
                {selectedDate.time_slots.map(time => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      style={{
                        padding: '12px 0', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                        cursor: 'pointer', textAlign: 'center',
                        border: isSelected ? '2px solid #C4622D' : '1px solid #EAE5DE',
                        backgroundColor: isSelected ? '#FDF1EB' : '#fff',
                        color: isSelected ? '#C4622D' : '#654B35',
                        transition: 'all 150ms ease-out'
                      }}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '16px', backgroundColor: '#F9FAFB', border: '1px solid #EAE5DE', borderRadius: '8px', color: '#654B35', fontSize: '14px', fontStyle: 'italic' }}>
                {t('donor.noTimeSlotsAvailable', 'No time slots available for this date.')}
              </div>
            )}
          </div>
        )}

        {/* Leave at Door Toggle */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
          border: '1px solid #EAE5DE', marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: '#C4622D' }}><DoorOpen size={24} /></div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#2B1D14' }}>{t('donor.leaveAtDoor', 'Leave at door')}</div>
              <div style={{ fontSize: '13px', color: '#654B35' }}>{t('donor.ngoWillPickUpWithoutDisturbing', 'NGO will pick up without disturbing you.')}</div>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setLeaveAtDoor(!leaveAtDoor)}
            style={{
              width: 48, height: 26, borderRadius: '100px', cursor: 'pointer',
              backgroundColor: leaveAtDoor ? '#2F7A4F' : '#EAE5DE',
              border: 'none', position: 'relative', transition: 'background-color 200ms'
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', backgroundColor: '#fff',
              position: 'absolute', top: 2, left: leaveAtDoor ? 24 : 2,
              transition: 'left 200ms ease-out', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '40px' }}>
          <label style={labelStyle}>{t('donor.pickupInstructionsLabel', 'Pickup Instructions')}</label>
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            placeholder={t('donor.addInstructionsForPickup', 'Add any instructions for pickup...')}
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
          />
        </div>

        {/* Professional Pickup Summary */}
        <div style={{ 
          backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '12px', 
          padding: '24px', marginBottom: '32px' 
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0', color: '#2B1D14', borderBottom: '1px solid #EAE5DE', paddingBottom: '12px' }}>
            {t('donor.pickupSummary', 'Pickup Summary')}
          </h3>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#654B35', fontSize: '14px' }}>{t('donor.donation', 'Donation')}</span>
              <span style={{ fontWeight: 600, color: '#2B1D14', fontSize: '14px' }}>#{targetDonation?.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#654B35', fontSize: '14px' }}>{t('donor.ngoPartner', 'NGO Partner')}</span>
              <span style={{ fontWeight: 600, color: '#2B1D14', fontSize: '14px', textAlign: 'right' }}>{ngoInfo?.organization_name || t('donor.pending', 'Pending')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#654B35', fontSize: '14px' }}>{t('donor.pickupDateLabel', 'Pickup Date')}</span>
              <span style={{ fontWeight: 600, color: '#2B1D14', fontSize: '14px' }}>{selectedDate ? getLabelForDate(selectedDate.date) : t('donor.notSelected', 'Not selected')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#654B35', fontSize: '14px' }}>{t('donor.pickupTimeLabel', 'Pickup Time')}</span>
              <span style={{ fontWeight: 600, color: '#2B1D14', fontSize: '14px' }}>{selectedTime || t('donor.notSelected', 'Not selected')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#654B35', fontSize: '14px' }}>{t('donor.contactLabel', 'Contact')}</span>
              <span style={{ fontWeight: 600, color: '#2B1D14', fontSize: '14px' }}>{contactNumber || t('donor.notProvided', 'Not provided')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', borderTop: '1px dashed #EAE5DE', paddingTop: '16px', marginTop: '4px' }}>
              <span style={{ color: '#654B35', fontSize: '14px' }}>{t('donor.addressLabel', 'Address')}</span>
              <span style={{ fontWeight: 600, color: '#2B1D14', fontSize: '14px', textAlign: 'right', maxWidth: '60%' }}>{address || t('donor.notProvided', 'Not provided')}</span>
            </div>
          </div>
        </div>

        <DonorButton 
          type="submit" 
          variant="primary" 
          fullWidth 
          disabled={submitting || (!address && profileMissingAddress) || !selectedDate || !selectedTime}
        >
          {submitting ? t('donor.schedulingPickup', 'Scheduling Pickup...') : t('donor.confirmPickup', 'Confirm Pickup')}
        </DonorButton>
      </form>
    </div>
  );
}

