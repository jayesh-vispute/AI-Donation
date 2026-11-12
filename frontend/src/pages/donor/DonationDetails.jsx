import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Copy, Edit2, HelpCircle, Package, Weight, Calendar, Hash, 
  Building2, ExternalLink, Check, Sparkles, Truck, MapPin, Leaf, Heart, AlertCircle,
  Armchair, Shirt, BookOpen, Utensils, Laptop, Lamp, Box, ShieldCheck, Clock, KeyRound, RefreshCw, Loader2
} from 'lucide-react';
import { api, API_URL } from '../../services/api';
import TrackingTimeline from '../../components/donor/TrackingTimeline';
import HelpModal from '../../components/donor/HelpModal';
import { DonorSkeleton, DonorErrorState } from '../../components/donor/DonorStates';
import { formatCleanDate, formatPickupDateTime, formatDonationId } from '../../utils/formatters';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';
import { translateDonationStatus } from '../../utils/ngoI18n';

function getItemIconComponent(name = '', category = '') {
  const text = `${name} ${category}`.toLowerCase();
  if (text.includes('chair') || text.includes('sofa') || text.includes('couch') || text.includes('seating')) return Armchair;
  if (text.includes('table') || text.includes('desk') || text.includes('furniture')) return Box;
  if (text.includes('lamp') || text.includes('light')) return Lamp;
  if (text.includes('cloth') || text.includes('shirt') || text.includes('pant') || text.includes('wear')) return Shirt;
  if (text.includes('book') || text.includes('paper') || text.includes('study')) return BookOpen;
  if (text.includes('food') || text.includes('kitchen') || text.includes('dish')) return Utensils;
  if (text.includes('laptop') || text.includes('computer') || text.includes('electronic')) return Laptop;
  return Package;
}

export default function DonationDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [donation, setDonation] = useState(null);
  const [history, setHistory] = useState([]);
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive UI state
  const [copied, setCopied] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editNotice, setEditNotice] = useState(null);

  // Delivery Verification OTP state
  const [deliveryOtpData, setDeliveryOtpData] = useState(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(null);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [otpError, setOtpError] = useState(null);

  const fetchDeliveryOtp = async (donationId) => {
    try {
      setLoadingOtp(true);
      setOtpError(null);
      const data = await api.getDeliveryOtp(donationId);
      if (data && data.has_active_otp) {
        setDeliveryOtpData(data);
        const secs = Math.max(0, Math.floor(data.seconds_remaining ?? data.time_remaining_seconds ?? 0));
        setOtpTimeLeft(secs);
      } else {
        setDeliveryOtpData(data || null);
        setOtpTimeLeft(0);
      }
    } catch (err) {
      console.warn('Could not load delivery OTP:', err);
      setOtpError(err.message || t('donor.failedToLoadOtp', 'Failed to load delivery verification code.'));
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!donation?.id) return;
    try {
      setLoadingOtp(true);
      setOtpError(null);
      await api.resendDeliveryOtp(donation.id);
      await fetchDeliveryOtp(donation.id); // Fetch the new OTP details
    } catch (err) {
      console.warn('Could not resend OTP:', err);
      setOtpError(err.message || t('donor.failedToResendOtp', 'Failed to resend delivery verification code.'));
    } finally {
      setLoadingOtp(false);
    }
  };

  useEffect(() => {
    if (otpTimeLeft === null || otpTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimeLeft]);

  const handleCopyOtp = () => {
    if (!deliveryOtpData?.otp) return;
    navigator.clipboard.writeText(deliveryOtpData.otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch core donation details
      const donationData = await api.getDonation(id);
      setDonation(donationData);

      // If COLLECTED, fetch active delivery verification OTP
      if ((donationData?.status || '').toUpperCase() === 'COLLECTED') {
        fetchDeliveryOtp(donationData.id);
      }

      // Fetch tracking history logs safely
      try {
        const historyData = await api.getDonationHistory(id);
        setHistory(Array.isArray(historyData) ? historyData : []);
      } catch (hErr) {
        console.warn('Could not load status history:', hErr);
      }

      // If matched with NGO, fetch NGO details
      const targetNgoId = donationData?.ngo_id 
        || donationData?.resolved_ngo_id 
        || donationData?.items?.find(it => it.allocations && it.allocations.length > 0)?.allocations?.[0]?.ngo_id;
      if (targetNgoId) {
        try {
          const ngoData = await api.getNgo(targetNgoId);
          setNgo(ngoData);
        } catch (nErr) {
          console.warn('Could not load NGO details:', nErr);
        }
      }
    } catch (err) {
      setError(err.message || t('donor.unableToLoadDonationDetails', 'Unable to load donation details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const formattedId = formatDonationId(donation?.id);

  const handleCopyId = () => {
    if (!formattedId) return;
    navigator.clipboard.writeText(formattedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEditable = donation?.status?.toUpperCase() === 'PENDING' || donation?.status?.toUpperCase() === 'DRAFT';

  const handleEditClick = () => {
    if (isEditable) {
      navigate('/item-cart', { state: { items: donation.items, edit_donation_id: donation.id } });
    } else {
      setEditNotice(t('donor.cannotEditDonationNotice', 'Donations with status "{{status}}" cannot be edited as processing has already begun.', { status: donation.status }));
      setTimeout(() => setEditNotice(null), 4000);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
        <DonorSkeleton type="card" />
        <div style={{ marginTop: '16px' }}>
          <DonorSkeleton type="timeline" />
        </div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
        <DonorErrorState message={error || t('donor.donationNotFound', 'Donation not found')} onRetry={fetchAllData} />
      </div>
    );
  }

  const totalItems = donation.items?.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0) || 0;
  const formattedDate = formatCleanDate(donation.created_at);

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || 'PENDING').toUpperCase();
    if (['RECEIVED', 'ACKNOWLEDGED', 'NGO_RECEIVED', 'COMPLETED'].includes(s)) {
      return {
        bg: '#F0FDF4', color: '#16A34A', border: '#DCFCE7',
        title: translateDonationStatus(s, t), desc: t('donor.statusDescReceived', 'Your donation has been successfully received by the NGO.')
      };
    }
    if (s === 'DELIVERED') {
      return {
        bg: '#F0FDF4', color: '#16A34A', border: '#DCFCE7',
        title: translateDonationStatus(s, t), desc: t('donor.statusDescDelivered', 'Delivery verified with OTP and photo proof.')
      };
    }
    if (s === 'SEALED') {
      return {
        bg: '#F0FDF4', color: '#16A34A', border: '#DCFCE7',
        title: translateDonationStatus(s, t), desc: t('donor.statusDescSealed', 'Sealed and ready for pickup.')
      };
    }
    if (s === 'PACKED') {
      return {
        bg: '#FDF1EB', color: '#C4622D', border: '#FEF3E4',
        title: translateDonationStatus(s, t), desc: t('donor.statusDescPacked', 'Items packed. Complete sealing to proceed.')
      };
    }
    if (s === 'COLLECTED' || s === 'PICKUP_SCHEDULED' || s === 'PACKAGING_NOTIFIED') {
      return {
        bg: '#F2F6FE', color: '#2563EB', border: '#E0E7FF',
        title: translateDonationStatus(s, t), desc: s === 'PACKAGING_NOTIFIED' ? t('donor.statusDescPackaging', 'Please prepare your items for packaging.') : t('donor.statusDescTransit', 'Your donation is in transit or pickup is scheduled.')
      };
    }
    if (s === 'MATCHED' || s === 'ACCEPTED') {
      return {
        bg: '#FAF5FF', color: '#9333EA', border: '#F3E8FF',
        title: translateDonationStatus(s, t), desc: t('donor.statusDescMatched', 'Matched with an NGO. Preparing for pickup.')
      };
    }
    return {
      bg: '#FEF3E4', color: '#B45309', border: '#FED7AA',
      title: translateDonationStatus(s, t), desc: t('donor.statusDescProcessing', 'Your donation is being processed.')
    };
  };

  const showPackagingBtn = ['PACKAGING_NOTIFIED', 'PACKED', 'SEALED', 'MATCHED', 'ACCEPTED'].includes((donation?.status || '').toUpperCase());
  const statusBadge = getStatusBadge(donation.status);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#2B1D14', maxWidth: '1120px', margin: '0 auto', padding: '12px 16px 40px' }}>
      
      {/* Toast Notification */}
      {copied && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#2B1D14', color: 'white',
          padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 500, zIndex: 1100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Check size={15} color="#16A34A" /> {t('donor.donationIdCopied', 'Donation ID copied to clipboard!')}
        </div>
      )}

      {/* Edit Warning Toast */}
      {editNotice && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#FFFBEB', color: '#B45309',
          border: '1px solid #FEF3C7', padding: '12px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, zIndex: 1100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertCircle size={16} /> {editNotice}
        </div>
      )}

      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.donor', 'Donor'), to: '/donor' },
        { label: t('navigation.myDonations', 'My Donations'), to: '/donations' },
        { label: t('common.details', 'Details') }
      ]} />

      {/* Back button */}
      <button 
        onClick={() => navigate('/donations')}
        style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '6px', 
          backgroundColor: 'white', border: '1px solid #EAE5DE', borderRadius: '100px', 
          padding: '6px 14px', fontSize: '13px', fontWeight: 600, color: '#654B35', 
          cursor: 'pointer', marginBottom: '14px', transition: 'all 0.15s ease'
        }}
      >
        <ArrowLeft size={15} /> {t('donor.backToMyDonations', 'Back to My Donations')}
      </button>

      {/* ===== HEADER SECTION ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        
        {/* Left Side Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, margin: 0, color: '#2B1D14', lineHeight: 1.1, wordBreak: 'break-all' }}>
              {formattedId}
            </h1>
            <button
              onClick={handleCopyId}
              title={t('actions.copyDonationId', 'Copy Donation ID')}
              style={{
                background: '#F5F2ED', border: 'none', borderRadius: '8px', padding: '6px',
                cursor: 'pointer', color: '#654B35', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Copy size={16} />
            </button>
          </div>

          <p style={{ margin: '4px 0 2px 0', fontSize: '14px', color: '#4A3D34' }}>
            {t('donor.thankYouMakingDifference', 'Thank you for making a difference!')}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8C7A6B', fontWeight: 500 }}>
            <Leaf size={14} color="#2F7A4F" /> {t('donor.donatedOnDate', 'Donated on {{date}}', { date: formattedDate })}
          </div>
        </div>

        {/* Right Side Header (Status & Actions) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Compact Status Card */}
          <div style={{ 
            backgroundColor: statusBadge.bg, border: `1px solid ${statusBadge.border}`, 
            borderRadius: '14px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ 
              width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusBadge.color, flexShrink: 0 
            }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: statusBadge.color, letterSpacing: '0.4px' }}>
                {statusBadge.title}
              </div>
              <div style={{ fontSize: '11px', color: '#654B35', marginTop: '1px' }}>
                {statusBadge.desc}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {showPackagingBtn && (
              <button
                onClick={() => navigate(`/packaging/${donation.id}`)}
                style={{
                  backgroundColor: '#C4622D', border: 'none', color: 'white',
                  borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(196, 98, 45, 0.25)'
                }}
              >
                <Package size={15} /> {t('donor.packagingChecklist', 'Packaging Checklist')}
              </button>
            )}
            <button
              onClick={handleEditClick}
              style={{
                backgroundColor: 'white', border: '1px solid #EAE5DE', color: isEditable ? '#2B1D14' : '#A39284',
                borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px', cursor: isEditable ? 'pointer' : 'not-allowed',
                opacity: isEditable ? 1 : 0.7
              }}
            >
              <Edit2 size={15} /> {t('actions.edit', 'Edit')}
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              style={{
                backgroundColor: '#2B1D14', border: 'none', color: 'white',
                borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(43, 29, 20, 0.2)'
              }}
            >
              <HelpCircle size={15} /> {t('donor.needHelp', 'Need Help?')}
            </button>
          </div>

        </div>

      </div>

      {/* ===== COMPACT TWO-COLUMN LAYOUT ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* ================= LEFT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* CARD 1: DONATION SUMMARY */}
          <div style={{ 
            backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
            padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
              <div style={{ color: '#C4622D' }}><Package size={20} /></div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('donor.donationSummary', 'Donation Summary')}</h3>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#8C7A6B' }}>{t('donor.donationSummaryDesc', 'A quick overview of your donation.')}</p>

            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '8px', 
              backgroundColor: '#F7F5F0', borderRadius: '12px', padding: '12px 8px', textAlign: 'center'
            }}>
              {/* Metric 1 */}
              <div>
                <div style={{ color: '#C4622D', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Package size={16} /></div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#2B1D14' }}>{totalItems}</div>
                <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500, marginTop: '2px' }}>{t('donor.totalItems', 'Total Items')}</div>
              </div>

              {/* Metric 2 */}
              <div>
                <div style={{ color: '#2F7A4F', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Weight size={16} /></div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#2B1D14', marginTop: '2px' }}>
                  {donation.total_weight ? `${donation.total_weight} kg` : t('donor.notProvided', 'Not provided')}
                </div>
                <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500, marginTop: '2px' }}>{t('donor.totalWeight', 'Total Weight')}</div>
              </div>

              {/* Metric 3 */}
              <div>
                <div style={{ color: '#C4622D', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Calendar size={16} /></div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2B1D14', marginTop: '3px' }}>{formattedDate}</div>
                <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500, marginTop: '2px' }}>{t('donor.donationDate', 'Donation Date')}</div>
              </div>

              {/* Metric 4 */}
              <div>
                <div style={{ color: '#2563EB', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Hash size={16} /></div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2B1D14', marginTop: '3px' }}>{formattedId}</div>
                <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500, marginTop: '2px' }}>{t('donor.donationId', 'Donation ID')}</div>
              </div>
            </div>
          </div>

          {/* CARD: SECURE DELIVERY VERIFICATION */}
          {(() => {
            const statusUpper = (donation.status || '').toUpperCase();
            const isCollected = statusUpper === 'COLLECTED';
            const isDeliveredOrReceived = statusUpper === 'DELIVERED' || statusUpper === 'RECEIVED';
            const isBeforeCollected = !isCollected && !isDeliveredOrReceived;

            const ngoName = ngo?.organization_name || donation.ngo?.organization_name || donation.ngo_name || t('donor.assignedPartnerNgo', 'Assigned Partner NGO');
            const pickupTimeText = formatPickupDateTime(donation.pickup_scheduled_at, donation.pickup?.time_slot);
            const pickupAddressText = donation.pickup_address || t('donor.donorRegisteredAddress', 'Donor registered address');

            return (
              <div style={{
                backgroundColor: '#FDFCFB',
                border: isCollected ? '1.5px solid #FCD34D' : (isDeliveredOrReceived ? '1.5px solid #BBF7D0' : '1px solid #EAE5DE'),
                borderRadius: '16px',
                padding: '20px',
                boxShadow: isCollected ? '0 4px 18px rgba(245, 158, 11, 0.08)' : '0 2px 12px rgba(0,0,0,0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Top accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                  backgroundColor: isCollected ? '#F59E0B' : (isDeliveredOrReceived ? '#16A34A' : '#C4622D')
                }} />

                {/* Section Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      backgroundColor: isCollected ? '#FEF3C7' : (isDeliveredOrReceived ? '#DCFCE7' : '#FDF1EB'),
                      color: isCollected ? '#D97706' : (isDeliveredOrReceived ? '#16A34A' : '#C4622D'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <ShieldCheck size={19} />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0, color: '#2B1D14', letterSpacing: '0.2px' }}>
                        {t('donor.deliveryVerification', 'DELIVERY VERIFICATION')}
                      </h3>
                      <p style={{ margin: '1px 0 0 0', fontSize: '12px', color: '#8C7A6B' }}>
                        {isCollected
                          ? t('donor.donationReadyForDelivery', 'Your donation is ready for delivery.')
                          : (isDeliveredOrReceived
                            ? t('donor.donationVerifiedReceived', 'Your donation has been verified and safely received.')
                            : t('donor.donationReadyAfterCollection', 'Your donation will be ready for delivery after collection.'))}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator Badge & Refresh */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isCollected ? (
                      otpTimeLeft !== null && otpTimeLeft > 0 ? (
                        <span style={{
                          backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                          borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: '5px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                          {Math.floor(otpTimeLeft / 60)}:{(otpTimeLeft % 60).toString().padStart(2, '0')} {t('donor.remainingTime', 'remaining')}
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                          borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: 600
                        }}>
                          {t('donor.codeExpired', 'Code Expired')}
                        </span>
                      )
                    ) : isDeliveredOrReceived ? (
                      <span style={{
                        backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7',
                        borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Check size={13} /> {t('donor.handoverVerified', 'Handover Verified')}
                      </span>
                    ) : (
                      <span style={{
                        backgroundColor: '#F5F2ED', color: '#654B35', border: '1px solid #EAE5DE',
                        borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: 600
                      }}>
                        {t('donor.pendingCollection', 'Pending Collection')}
                      </span>
                    )}

                    {isCollected && (
                      <button
                        onClick={() => fetchDeliveryOtp(donation.id)}
                        disabled={loadingOtp}
                        title={t('actions.refreshVerificationStatus', 'Refresh verification status')}
                        style={{
                          background: 'transparent', border: '1px solid #EAE5DE', borderRadius: '6px',
                          padding: '4px', cursor: 'pointer', color: '#654B35', display: 'flex', alignItems: 'center'
                        }}
                      >
                        <RefreshCw size={13} style={{ animation: loadingOtp ? 'spin 1s linear infinite' : 'none' }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Delivery Verification Code Box */}
                <div style={{
                  backgroundColor: isCollected ? '#FFFBEB' : (isDeliveredOrReceived ? '#F0FDF4' : '#FBF9F7'),
                  border: isCollected ? '1.5px dashed #F59E0B' : (isDeliveredOrReceived ? '1px solid #DCFCE7' : '1px dashed #D1C8C0'),
                  borderRadius: '14px',
                  padding: '16px',
                  margin: '12px 0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isCollected ? '#B45309' : (isDeliveredOrReceived ? '#16A34A' : '#654B35'), letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                      {t('donor.deliveryVerificationCode', 'Delivery Verification Code')}
                    </span>
                    {isBeforeCollected && (
                      <span style={{ fontSize: '11px', color: '#8C7A6B', fontStyle: 'italic' }}>
                        {t('donor.hiddenUntilCollected', 'Hidden until status reaches Collected')}
                      </span>
                    )}
                  </div>

                  {/* Code Presentation States */}
                  {isBeforeCollected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 12px 0' }}>
                      {['●', '●', '●', '●', '●', '●'].map((dot, idx) => (
                        <div key={idx} style={{
                          width: '36px', height: '42px', backgroundColor: 'white',
                          border: '1.5px solid #EAE5DE', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px', fontWeight: 700, color: '#A39284',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                        }}>
                          {dot}
                        </div>
                      ))}
                    </div>
                  )}

                  {isDeliveredOrReceived && (
                    <div style={{ margin: '8px 0 10px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          backgroundColor: '#DCFCE7', color: '#15803D', padding: '6px 14px',
                          borderRadius: '8px', fontSize: '13px', fontWeight: 700
                        }}>
                          <Check size={16} /> {t('donor.codeSuccessfullyRedeemed', 'Code Successfully Redeemed')}
                        </div>
                        <span style={{ fontSize: '12px', color: '#654B35' }}>
                          ● ● ● ● ● ● ({t('donor.codeRetired', 'Retired')})
                        </span>
                      </div>

                      {donation.delivery_proof_url && (
                        <div style={{
                          marginTop: '4px', padding: '10px 14px', backgroundColor: 'white',
                          borderRadius: '10px', border: '1px solid #DCFCE7', display: 'flex',
                          alignItems: 'center', gap: '12px'
                        }}>
                          <img
                            src={donation.delivery_proof_url.startsWith('http') ? donation.delivery_proof_url : `${API_URL}${donation.delivery_proof_url}`}
                            alt="Delivery Proof"
                            style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #EAE5DE' }}
                          />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>
                              {t('donor.deliveryPhotoProofVerified', 'Delivery Photo Proof Verified')}
                            </div>
                            <div style={{ fontSize: '11px', color: '#8C7A6B', marginTop: '1px' }}>
                              {t('donor.handoverPhotoConfirmed', 'Handover photo confirmed at destination')}
                            </div>
                            <a
                              href={donation.delivery_proof_url.startsWith('http') ? donation.delivery_proof_url : `${API_URL}${donation.delivery_proof_url}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '11px', color: '#C4622D', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}
                            >
                              {t('donor.viewFullPhoto', 'View Full Photo')} <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isCollected && (
                    <>
                      {loadingOtp ? (
                        <div style={{ padding: '16px 0', textAlign: 'center', color: '#654B35', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>{t('donor.fetchingVerificationCode', 'Fetching secure delivery verification code from server...')}</span>
                        </div>
                      ) : otpError ? (
                        <div style={{
                          backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '10px',
                          padding: '10px 14px', color: '#DC2626', fontSize: '13px', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between', gap: '10px', margin: '6px 0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            <span>{otpError}</span>
                          </div>
                          <button
                            onClick={handleResendOtp}
                            style={{
                              backgroundColor: '#DC2626', color: 'white', border: 'none',
                              borderRadius: '100px', padding: '5px 12px', fontSize: '11px',
                              fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            {t('actions.resend', 'Resend')}
                          </button>
                        </div>
                      ) : deliveryOtpData?.has_active_otp && otpTimeLeft > 0 ? (
                        <div style={{
                          backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '10px',
                          padding: '12px 14px', color: '#B45309', fontSize: '13px', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between', gap: '10px', margin: '6px 0', fontWeight: 500
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Check size={18} style={{ flexShrink: 0, color: '#D97706' }} />
                            <span>{deliveryOtpData.message || t('donor.otpSentToEmail', 'Delivery verification OTP has been sent to your registered email address.')}</span>
                          </div>
                          <button
                            onClick={handleResendOtp}
                            style={{
                              backgroundColor: 'transparent', color: '#B45309', border: '1px solid #FCD34D',
                              borderRadius: '100px', padding: '4px 10px', fontSize: '11px',
                              fontWeight: 600, cursor: 'pointer', wordBreak: 'break-word'
                            }}
                          >
                            {t('actions.resendOtp', 'Resend Code')}
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          backgroundColor: '#FFF1F2', border: '1px solid #FFE4E6', borderRadius: '10px',
                          padding: '12px 14px', color: '#BE123C', fontSize: '13px', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between', gap: '10px', margin: '6px 0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} style={{ flexShrink: 0 }} />
                            <span>{t('donor.verificationCodeExpired', 'Verification code has expired.')}</span>
                          </div>
                          <button
                            onClick={handleResendOtp}
                            style={{
                              backgroundColor: '#BE123C', color: 'white', border: 'none',
                              borderRadius: '100px', padding: '5px 12px', fontSize: '11px',
                              fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            {t('actions.resendNewCode', 'Resend New Code')}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Required Quote Text */}
                  <p style={{
                    margin: '6px 0 0 0', fontSize: '12px', fontStyle: 'italic',
                    color: isCollected ? '#92400E' : (isDeliveredOrReceived ? '#166534' : '#654B35'),
                    lineHeight: 1.4
                  }}>
                    {t('donor.shareCodeWithDeliveryPerson', '"Share this code with the authorized delivery person only when your donation is being delivered."')}
                  </p>
                </div>

                {/* 4 Metadata Details Grid: Donation ID, NGO Name, Pickup Information, OTP Expiration */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
                  gap: '12px',
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid #F0ECE6'
                }}>
                  {/* Item 1: Donation ID */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {t('donor.donationId', 'Donation ID')}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2B1D14', marginTop: '2px', wordBreak: 'break-all' }}>
                      {formattedId}
                    </div>
                  </div>

                  {/* Item 2: NGO Name */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {t('donor.ngoName', 'NGO Name')}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2B1D14', marginTop: '2px' }}>
                      {ngoName}
                    </div>
                  </div>

                  {/* Item 3: Pickup Information */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {t('donor.pickupInformation', 'Pickup Information')}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2B1D14', marginTop: '2px' }}>
                      {pickupTimeText}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', marginTop: '1px' }}>
                      {pickupAddressText}
                    </div>
                  </div>

                  {/* Item 4: OTP Expiration Information */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {t('donor.otpExpirationInfo', 'OTP Expiration Info')}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isCollected ? '#C4622D' : '#654B35', marginTop: '2px' }}>
                      {isCollected ? (
                        otpTimeLeft !== null && otpTimeLeft > 0 ? (
                          t('donor.otpRemainingTime', '{{m}}m {{s}}s remaining (15-min validity)', { m: Math.floor(otpTimeLeft / 60), s: otpTimeLeft % 60 })
                        ) : (
                          t('donor.expired', 'Expired')
                        )
                      ) : isDeliveredOrReceived ? (
                        t('donor.codeRedeemedExpired', 'Code Redeemed & Expired')
                      ) : (
                        t('donor.activeFor15Mins', 'Active for 15 minutes once collected')
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* CARD 2: INCLUDED ITEMS */}
          <div style={{ 
            backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
            padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
              <div style={{ color: '#C4622D' }}><Package size={20} /></div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('donor.includedItems', 'Included Items')}</h3>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#8C7A6B' }}>{t('donor.includedItemsDesc', 'Items you are donating.')}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {donation.items?.map((item, idx) => {
                const isAiDetected = item.detection_source === 'yolo' || item.confidence > 0;
                const ItemIcon = getItemIconComponent(item.item_name, item.category);

                return (
                  <div key={idx} style={{ 
                    padding: '12px 16px', borderRadius: '12px', 
                    backgroundColor: 'white', border: '1px solid #EAE5DE',
                    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
                  }}>
                    {/* Item Icon */}
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px',
                      backgroundColor: '#FDF1EB', color: '#C4622D',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ItemIcon size={20} />
                    </div>

                    {/* Item Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 700, color: '#2B1D14', textTransform: 'capitalize' }}>
                            {item.item_name}
                          </h4>

                          {/* Category & Subcategory Tags */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '2px 0 4px 0' }}>
                            {item.category && (
                              <span style={{ backgroundColor: '#FDF1EB', color: '#C4622D', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>
                                {t(`categories.${item.category.toLowerCase()}`, item.category)}
                              </span>
                            )}
                            {item.subcategory && (
                              <span style={{ backgroundColor: '#FEF3E4', color: '#B45309', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>
                                {item.subcategory}
                              </span>
                            )}
                          </div>

                          {/* Condition */}
                          <p style={{ margin: 0, fontSize: '12px', color: '#654B35' }}>
                            {t('donor.condition', 'Condition:')} <strong>{item.condition || t('donor.conditionGood', 'GOOD')}</strong>
                          </p>
                        </div>

                        {/* Quantity */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', color: '#8C7A6B', display: 'block' }}>{t('donor.quantity', 'Quantity')}</span>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: '#2B1D14' }}>{item.quantity || 1}</span>
                        </div>
                      </div>

                      {/* AI Detection Badge if applicable */}
                      {isAiDetected && (
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#F0FDF4', color: '#16A34A', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>
                            <Check size={11} strokeWidth={3} /> {t('donor.detectedByAi', 'Detected by AI')} {item.confidence ? `(${Math.round(item.confidence * 100)}%)` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {!donation.items?.length && (
                <div style={{ padding: '16px', textAlign: 'center', color: '#8C7A6B', fontStyle: 'italic', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #EAE5DE', fontSize: '13px' }}>
                  {t('donor.noDonationItemsFound', 'No donation items found.')}
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: PICKUP DETAILS */}
          <div style={{ 
            backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
            padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ color: '#C4622D' }}><Truck size={20} /></div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('donor.pickupDetails', 'Pickup Details')}</h3>
            </div>

            <div style={{ backgroundColor: 'white', border: '1px solid #EAE5DE', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: '16px' }}>
                
                {/* Scheduled Time */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Calendar size={18} color="#C4622D" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500 }}>{t('donor.scheduledTime', 'Scheduled Time')}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#2B1D14', marginTop: '2px' }}>
                      {formatPickupDateTime(donation.pickup_scheduled_at, donation.pickup?.time_slot)}
                    </div>
                  </div>
                </div>

                {/* Pickup Address */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <MapPin size={18} color="#C4622D" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500 }}>{t('donor.pickupAddress', 'Pickup Address')}</div>
                    <div style={{ fontSize: '13px', color: '#2B1D14', marginTop: '2px', lineHeight: 1.4 }}>
                      {donation.pickup_address || t('donor.donorRegisteredAddress', 'Donor registered address')}
                      {donation.pickup_city ? `, ${donation.pickup_city}` : ''}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* CARD: MATCHED NGO (if present) */}
          {ngo && (
            <div style={{ 
              backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
              padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ color: '#C4622D' }}><Building2 size={20} /></div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('donor.matchedNgo', 'Matched NGO')}</h3>
              </div>

              <div style={{ backgroundColor: 'white', border: '1px solid #EAE5DE', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ 
                      width: 42, height: 42, borderRadius: '50%', backgroundColor: '#FDF1EB', 
                      color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '16px', flexShrink: 0, border: '1px solid #FEF3E4'
                    }}>
                      {ngo.logo_url ? (
                        <img src={ngo.logo_url} alt={ngo.organization_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <Heart size={20} fill="currentColor" />
                      )}
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 700, color: '#2B1D14' }}>
                        {ngo.organization_name}
                      </h4>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ backgroundColor: '#F0FDF4', color: '#16A34A', padding: '1px 6px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>
                          {t('donor.verifiedNgo', 'Verified NGO')}
                        </span>
                        {ngo.organization_type && (
                          <span style={{ backgroundColor: '#E0F2FE', color: '#0284C7', padding: '1px 6px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>
                            {t(`ngo.type.${ngo.organization_type.toLowerCase().replace(/ /g, '_')}`, ngo.organization_type)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link 
                    to="/donor/ngos" 
                    style={{
                      backgroundColor: 'white', border: '1px solid #C4622D', color: '#C4622D',
                      borderRadius: '100px', padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none'
                    }}
                  >
                    {t('donor.viewNgo', 'View NGO')} <ExternalLink size={13} />
                  </Link>

                </div>
              </div>
            </div>
          )}

          {/* TRACKING HISTORY CARD */}
          <div style={{ 
            backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
            padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
              <div style={{ color: '#C4622D' }}><Truck size={20} /></div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('donor.trackingHistory', 'Tracking History')}</h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#8C7A6B' }}>
              {t('donor.trackingHistoryDesc', "Follow your donation's journey from pickup to impact.")}
            </p>

            <TrackingTimeline donation={donation} history={history} deliveryOtpData={deliveryOtpData} />
          </div>

        </div>

      </div>

      {/* HELP MODAL */}
      {showHelpModal && (
        <HelpModal donationId={donation.id} onClose={() => setShowHelpModal(false)} />
      )}

    </div>
  );
}



