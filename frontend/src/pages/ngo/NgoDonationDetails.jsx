import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Calendar, Check, X, MapPin, Package, Copy, Phone, Mail, 
  Weight, Hash, Truck, Sparkles, AlertCircle, Armchair, Shirt, BookOpen, Utensils, Laptop, Lamp, Box, ExternalLink, ShieldCheck
} from 'lucide-react';
import TrackingTimeline from '../../components/donor/TrackingTimeline';
import NgoButton from '../../components/ngo/NgoButton';
import MatchReason from '../../components/donor/MatchReason';
import ReceiptVerificationModal from '../../components/ngo/ReceiptVerificationModal';
import DeliveryOtpModal from '../../components/ngo/DeliveryOtpModal';
import DeliveryVerificationWorkflow from '../../components/ngo/DeliveryVerificationWorkflow';
import DeliveryProofCard from '../../components/ngo/DeliveryProofCard';
import { useTranslation } from 'react-i18next';
import { api, API_URL } from '../../services/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { formatCleanDate, formatPickupDateTime, formatDonationId } from '../../utils/formatters';
import { translateDonationStatus, translateCondition, translateCategory } from '../../utils/ngoI18n';

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

export default function NgoDonationDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDeliveryOtpModal, setShowDeliveryOtpModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [ngoProfile, setNgoProfile] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDonation = async () => {
    try {
      const data = await api.getNgoDonationRequest(id);
      setDonation(data);
      try {
        const realDonationId = data.donation_id || id;
        const historyData = await api.getDonationHistory(realDonationId);
        setHistory(Array.isArray(historyData) ? historyData : []);
      } catch (hErr) {
        console.warn("Could not fetch history:", hErr);
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to fetch donation request:", err);
      setError(t('errors.failedLoadDonation', 'Failed to load donation details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchDonation();
    api.getNgoProfile().then(setNgoProfile).catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '36px', textAlign: 'center', color: '#654B35', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
        {t('ngo.donationDetails.loading', 'Loading donation details...')}
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div style={{ padding: '36px', textAlign: 'center', color: '#D14343', fontFamily: 'Inter, sans-serif' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>{error || t('errors.donationNotFound', 'Donation request not found')}</h2>
        <button 
          onClick={() => navigate('/ngo/donations')}
          style={{ padding: '6px 14px', backgroundColor: '#C4622D', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
        >
          {t('ngo.donationDetails.backToRequests', 'Back to Donation Requests')}
        </button>
      </div>
    );
  }

  const items = Array.isArray(donation.items) ? donation.items : [];
  const totalItemsCount = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);
  const formattedId = formatDonationId(donation.donation_id || donation.id);

  const handleCopyId = () => {
    if (!formattedId) return;
    navigator.clipboard.writeText(formattedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const matchScore = donation.match_score || 85;
  const matchReasons = [
    { label: t('ngo.donationDetails.matchReasonCategory', 'Matches registered NGO demand category.'), met: true },
    {
      label: donation.match_score > 80
        ? t('ngo.donationDetails.matchReasonHighScore', 'High relevance score ({{score}}%)', { score: matchScore })
        : t('ngo.donationDetails.matchReasonScore', 'Matched with score {{score}}%', { score: matchScore }),
      met: true,
    },
  ];

  const isPending = donation.status === 'PENDING' || donation.status === 'MATCHED';

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      await api.acceptDonationRequest(donation?.id || id);
      navigate(`/ngo/pickups/${donation?.id || id}`);
    } catch (err) {
      console.error(err);
      showToast(t('errors.failedAcceptDonation', 'Failed to accept donation.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!window.confirm(t('ngo.donationDetails.declineConfirm', 'Are you sure you want to decline this donation?'))) return;
    try {
      setActionLoading(true);
      await api.rejectDonationRequest(donation?.id || id);
      navigate('/ngo/donations');
    } catch (err) {
      console.error(err);
      showToast(t('errors.failedDeclineDonation', 'Failed to decline donation.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    try {
      setActionLoading(true);
      const pickupId = donation.pickup?.id;
      if (!pickupId) {
        showToast(t('errors.pickupNotFound', 'Pickup record not found. Please schedule the pickup first.'), 'error');
        return;
      }
      await api.updatePickup(pickupId, { status: 'CONFIRMED' });
      showToast(t('success.pickupConfirmed', 'Pickup confirmed successfully.'), 'success');
      setDonation(prev => ({
        ...prev,
        status: 'PICKUP_CONFIRMED',
        pickup: { ...(prev?.pickup || {}), status: 'CONFIRMED' }
      }));
      await fetchDonation();
    } catch (err) {
      console.error("Confirm Pickup failed:", err, err.response?.data);
      const status = err.response?.status;
      if (status === 404) showToast(t('errors.pickupNotFound', 'Pickup record not found. Please schedule the pickup first.'), 'error');
      else if (status === 403) showToast(t('errors.notAuthorizedPickup', 'You are not authorized to confirm this pickup.'), 'error');
      else if (status === 409) showToast(t('errors.pickupAlreadyConfirmed', 'This pickup has already been confirmed.'), 'error');
      else showToast(t('errors.unableConfirmPickup', 'Unable to confirm pickup. Please try again.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCollected = async () => {
    if (!window.confirm(t('ngo.donationDetails.collectConfirm', 'Confirm that the donation items have been collected from the donor?'))) return;
    try {
      setActionLoading(true);
      const pickupId = donation.pickup?.id;
      if (!pickupId) {
        showToast(t('errors.noPickupRecord', 'No pickup record found.'), 'error');
        return;
      }
      await api.updatePickup(pickupId, { status: 'COLLECTED' });
      showToast(t('success.markedCollected', 'Marked as collected.'), 'success');
      setDonation(prev => ({
        ...prev,
        status: 'COLLECTED',
        pickup: { ...(prev?.pickup || {}), status: 'COLLECTED' }
      }));
      await fetchDonation();
    } catch (err) {
      showToast(t('errors.failedMarkCollected', 'Failed to mark as collected.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoToDeliveryVerification = () => {
    const el = document.getElementById('delivery-verification');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const input = el.querySelector('input');
        if (input) input.focus();
      }, 400);
    }
  };

  const handleDeliveryVerifiedSuccess = (proofRes) => {
    showToast(t('success.deliveryVerified', 'Delivery verified and marked as delivered successfully.'), 'success');
    setDonation(prev => ({
      ...prev,
      status: 'DELIVERED',
      delivery_proof_url: proofRes?.photo_url || prev?.delivery_proof_url
    }));
    fetchDonation();
  };

  const handleConfirmReceipt = () => {
    setShowReceiptModal(true);
  };

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || 'PENDING').toUpperCase();
    if (['RECEIVED', 'ACKNOWLEDGED', 'NGO_RECEIVED', 'COMPLETED'].includes(s)) {
      return {
        bg: '#F0FDF4', color: '#16A34A', border: '#DCFCE7',
        title: translateDonationStatus(s, t),
        desc: t('ngo.donationDetails.statusReceivedDesc', 'Donation physically verified and received by your organization.'),
      };
    }
    if (s === 'DELIVERED') {
      return {
        bg: '#F0FDF4', color: '#16A34A', border: '#DCFCE7',
        title: translateDonationStatus('DELIVERED', t),
        desc: t('ngo.donationDetails.statusDeliveredDesc', 'Delivery verified with OTP and photo proof. Awaiting physical receipt confirmation.'),
      };
    }
    if (s === 'COLLECTED' || s === 'PICKUP_SCHEDULED' || s === 'PICKUP_CONFIRMED') {
      return {
        bg: '#F2F6FE', color: '#2563EB', border: '#E0E7FF',
        title: translateDonationStatus(s, t),
        desc: t('ngo.donationDetails.statusTransitDesc', 'Donation is in transit or pickup is scheduled.'),
      };
    }
    if (s === 'MATCHED' || s === 'ACCEPTED') {
      return {
        bg: '#FAF5FF', color: '#9333EA', border: '#F3E8FF',
        title: translateDonationStatus('MATCHED', t),
        desc: t('ngo.donationDetails.statusMatchedDesc', 'Matched donation request ready for pickup coordination.'),
      };
    }
    return {
      bg: '#FEF3E4', color: '#B45309', border: '#FED7AA',
      title: translateDonationStatus('PENDING', t),
      desc: t('ngo.donationDetails.statusPendingDesc', 'Donation request pending review and acceptance.'),
    };
  };

  const statusBadge = getStatusBadge(donation.status);
  const formattedDate = formatCleanDate(donation.created_at || donation.requested_at);
  const pickupTimeFormatted = formatPickupDateTime(
    donation.pickup_scheduled_at || donation.pickup?.date,
    donation.pickup?.time_slot
  );

  return (
    <div className="ngo-details-page" style={{ fontFamily: 'Inter, sans-serif', color: '#2B1D14', maxWidth: '1360px', margin: '0 auto', padding: '16px 24px 40px', boxSizing: 'border-box' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', 
          backgroundColor: toast.type === 'error' ? '#FEF2F2' : '#2B1D14', 
          color: toast.type === 'error' ? '#991B1B' : 'white',
          border: toast.type === 'error' ? '1px solid #FCA5A5' : 'none',
          padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 500, zIndex: 1100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {toast.type === 'error' ? <AlertCircle size={15} color="#991B1B" /> : <Check size={15} color="#16A34A" />}
          {toast.message}
        </div>
      )}

      {copied && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#2B1D14', color: 'white',
          padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 500, zIndex: 1100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Check size={15} color="#16A34A" /> {t('success.idCopied', 'ID copied to clipboard!')}
        </div>
      )}

      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.ngo', 'NGO'), to: '/ngo' },
        { label: t('navigation.donations', 'Donations'), to: '/ngo/donations' },
        { label: t('common.details', 'Details') }
      ]} />

      {/* Back button */}
      <button 
        onClick={() => navigate('/ngo/donations')}
        style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '6px', 
          backgroundColor: 'white', border: '1px solid #EAE5DE', borderRadius: '100px', 
          padding: '6px 14px', fontSize: '13px', fontWeight: 600, color: '#654B35', 
          cursor: 'pointer', marginBottom: '14px', transition: 'all 0.15s ease'
        }}
      >
        <ArrowLeft size={15} /> {t('ngo.donationDetails.backToRequestsShort', 'Back to Requests')}
      </button>

      {/* ===== HEADER SECTION ===== */}
      <div className="det-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        
        {/* Left Side Header */}
        <div className="det-header-left" style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '30px', fontWeight: 700, margin: 0, color: '#2B1D14', lineHeight: 1.1, wordBreak: 'break-all' }}>
              {formattedId || t('ngo.donationDetails.requestId', 'Request #{{id}}', { id: donation.id })}
            </h1>
            <button
              onClick={handleCopyId}
              title={t('ngo.donationDetails.copyId', 'Copy ID')}
              style={{
                background: '#F5F2ED', border: 'none', borderRadius: '8px', padding: '6px',
                cursor: 'pointer', color: '#654B35', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Copy size={16} />
            </button>
          </div>

          <p style={{ margin: '4px 0 2px 0', fontSize: '14px', color: '#4A3D34' }}>
            {t('ngo.donationDetails.logisticsTitle', 'Donation Request & Logistics Coordination')}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#8C7A6B', fontWeight: 500, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={14} color="#C4622D" /> {t('ngo.donationDetails.requestedOn', 'Requested on {{date}}', { date: formattedDate })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <User size={14} color="#C4622D" /> {donation.donor_name || t('ngo.donationDetails.anonymousDonor', 'Anonymous Donor')}
            </span>
          </div>
        </div>

        {/* Right Side Header (Status & Actions) */}
        <div className="det-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Status Badge */}
          <div className="det-status-badge" style={{ 
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
          <div className="det-action-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isPending && (
              <>
                <button
                  onClick={handleDecline}
                  style={{
                    backgroundColor: 'white', border: '1px solid #EAE5DE', color: '#D14343',
                    borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                  }}
                >
                  <X size={15} /> {t('ngo.donationDetails.decline', 'Decline')}
                </button>
                <button
                  onClick={handleAccept}
                  style={{
                    backgroundColor: '#C4622D', border: 'none', color: 'white',
                    borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(196, 98, 45, 0.25)'
                  }}
                >
                  <Check size={15} /> {t('ngo.donationDetails.acceptCoordinate', 'Accept & Coordinate')}
                </button>
              </>
            )}
            {donation.status === 'PICKUP_SCHEDULED' && (
              <button
                onClick={handleConfirmPickup}
                disabled={actionLoading}
                style={{
                  backgroundColor: '#C4622D', border: 'none', color: 'white',
                  borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                <Check size={15} /> {actionLoading ? t('common.processing', 'Processing...') : t('ngo.donationDetails.confirmPickup', 'Confirm Pickup')}
              </button>
            )}
            {donation.status === 'PICKUP_CONFIRMED' && (
              <button
                onClick={handleMarkCollected}
                disabled={actionLoading}
                style={{
                  backgroundColor: '#C4622D', border: 'none', color: 'white',
                  borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                <Check size={15} /> {actionLoading ? t('common.processing', 'Processing...') : t('ngo.donationDetails.markCollected', 'Mark Collected')}
              </button>
            )}
            {donation.status === 'COLLECTED' && (
              <button
                onClick={handleGoToDeliveryVerification}
                style={{
                  backgroundColor: '#C4622D', border: 'none', color: 'white',
                  borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(196, 98, 45, 0.25)'
                }}
              >
                <ShieldCheck size={15} /> {t('ngo.donationDetails.deliveryVerification', 'Delivery Verification')}
              </button>
            )}
            {donation.status === 'DELIVERED' && (
              <button
                onClick={handleConfirmReceipt}
                style={{
                  backgroundColor: '#C4622D', border: 'none', color: 'white',
                  borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                }}
              >
                <Check size={15} /> {t('ngo.donationDetails.confirmReceipt', 'Confirm Receipt')}
              </button>
            )}
            {['RECEIVED', 'ACKNOWLEDGED', 'NGO_RECEIVED', 'COMPLETED'].includes((donation.status || '').toUpperCase()) && (
              <div style={{ backgroundColor: '#F0FDF4', color: '#16A34A', padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #DCFCE7' }}>
                <Check size={15} /> {t('ngo.donationDetails.receivedVerified', 'Received & Verified')}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ===== COMPACT TWO-COLUMN LAYOUT ===== */}
      <div className="ngo-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* ================= LEFT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* CARD 1: DONATION SUMMARY */}
          <div className="ngo-details-card" style={{ 
            backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
            padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ color: '#C4622D' }}><Package size={20} /></div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('ngo.donationDetails.donationSummary', 'Donation Summary')}</h3>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#8C7A6B' }}>{t('ngo.donationDetails.summaryDesc', 'A quick overview of requested items.')}</p>

            <div className="det-summary-grid" style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 100px), 1fr))', gap: '12px', 
              backgroundColor: '#F7F5F0', borderRadius: '12px', padding: '16px 12px', textAlign: 'center'
            }}>
              {/* Metric 1 */}
              <div>
                <div style={{ color: '#C4622D', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Package size={16} /></div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#2B1D14' }}>{totalItemsCount}</div>
                <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500, marginTop: '2px' }}>{t('ngo.donationDetails.totalItems', 'Total Items')}</div>
              </div>

              {/* Metric 2 */}
              <div>
                <div style={{ color: '#2F7A4F', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Weight size={16} /></div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#2B1D14', marginTop: '2px' }}>
                  {donation.total_weight ? `${donation.total_weight} kg` : t('ngo.donationDetails.notProvided', 'Not provided')}
                </div>
                <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500, marginTop: '2px' }}>{t('ngo.donationDetails.totalWeight', 'Total Weight')}</div>
              </div>

              {/* Metric 3 */}
              <div>
                <div style={{ color: '#C4622D', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Calendar size={16} /></div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2B1D14', marginTop: '3px' }}>{formattedDate}</div>
                <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500, marginTop: '2px' }}>{t('ngo.donationDetails.requestDate', 'Request Date')}</div>
              </div>

              {/* Metric 4 */}
              <div>
                <div style={{ color: '#2563EB', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Hash size={16} /></div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2B1D14', marginTop: '3px', wordBreak: 'break-all' }}>{formattedId || `#${donation.id}`}</div>
                <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500, marginTop: '2px' }}>{t('ngo.donationDetails.donationId', 'Donation ID')}</div>
              </div>
            </div>
          </div>

          {/* CARD 2: INCLUDED ITEMS */}
          <div className="ngo-details-card" style={{ 
            backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
            padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ color: '#C4622D' }}><Package size={20} /></div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('ngo.donationDetails.includedItems', 'Included Items')}</h3>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#8C7A6B' }}>{t('ngo.donationDetails.includedItemsDesc', 'Items included in this request.')}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item, idx) => {
                const ItemIcon = getItemIconComponent(item.item_name || item.name, item.category);

                return (
                  <div key={idx} style={{ 
                    padding: '12px 16px', borderRadius: '12px', 
                    backgroundColor: 'white', border: '1px solid #EAE5DE',
                    display: 'flex', alignItems: 'center', gap: '14px'
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
                            {item.item_name || item.name || t('ngo.donationDetails.donatedItem', 'Donated Item')}
                          </h4>

                          {/* Category & Subcategory Tags */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '2px 0 4px 0' }}>
                            {item.category && (
                              <span style={{ backgroundColor: '#FDF1EB', color: '#C4622D', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>
                                {translateCategory(item.category, t)}
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
                            {t('ngo.donationDetails.conditionLabel', 'Condition:')} <strong>{translateCondition(item.condition || 'GOOD', t)}</strong>
                          </p>
                        </div>

                        {/* Quantity */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', color: '#8C7A6B', display: 'block' }}>{t('ngo.donationDetails.quantity', 'Quantity')}</span>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: '#2B1D14' }}>{item.quantity || 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: '#8C7A6B', fontStyle: 'italic', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #EAE5DE', fontSize: '13px' }}>
                  {t('empty.noItemsInRequest', 'No items specified in this request.')}
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: PICKUP DETAILS & DONOR CONTACT */}
          <div className="ngo-details-card" style={{ 
            backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
            padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ color: '#C4622D' }}><Truck size={20} /></div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('ngo.donationDetails.pickupDetails', 'Pickup Details & Logistics')}</h3>
            </div>

            <div style={{ backgroundColor: 'white', border: '1px solid #EAE5DE', borderRadius: '12px', padding: '14px 16px' }}>
              
              <div className="det-pickup-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '14px' }}>
                
                {/* Scheduled Time */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Calendar size={18} color="#C4622D" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500 }}>{t('ngo.donationDetails.scheduledTime', 'Scheduled Time')}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#2B1D14', marginTop: '2px' }}>
                      {pickupTimeFormatted}
                    </div>
                  </div>
                </div>

                {/* Pickup Address */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <MapPin size={18} color="#C4622D" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500 }}>{t('ngo.donationDetails.pickupAddress', 'Pickup Address')}</div>
                    <div style={{ fontSize: '13px', color: '#2B1D14', marginTop: '2px', lineHeight: 1.4 }}>
                      {donation.pickup_address || donation.address || t('ngo.donationDetails.addressUponAcceptance', 'Address provided upon acceptance')}
                      {donation.city ? `, ${donation.city}` : ''}
                    </div>
                  </div>
                </div>

              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #F0ECE6', margin: '0 -16px 12px -16px' }} />

              {/* Donor Contact Details */}
              <div className="det-donor-contact" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={16} color="#C4622D" />
                  <div>
                    <span style={{ fontSize: '11px', color: '#8C7A6B', display: 'block' }}>{t('ngo.donationDetails.donorName', 'Donor Name')}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2B1D14' }}>
                      {donation.donor_name || t('ngo.donationDetails.anonymousDonor', 'Anonymous Donor')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {donation.donor_phone && (
                    <a 
                      href={`tel:${donation.donor_phone}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#C4622D', textDecoration: 'none', fontWeight: 600 }}
                    >
                      <Phone size={13} /> {donation.donor_phone}
                    </a>
                  )}
                  {donation.donor_email && (
                    <a 
                      href={`mailto:${donation.donor_email}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#654B35', textDecoration: 'none' }}
                    >
                      <Mail size={13} /> {donation.donor_email}
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* CARD 4: AI MATCH ANALYSIS */}
          <div className="ngo-details-card" style={{ 
            backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
            padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ color: '#C4622D' }}><Sparkles size={18} /></div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('ngo.donationDetails.aiMatchAnalysis', 'AI Match Analysis')}</h3>
            </div>
            <MatchReason reasons={matchReasons} />
          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* DELIVERY VERIFICATION WORKFLOW (only when COLLECTED — active verification form) */}
          {donation.status === 'COLLECTED' && (
            <DeliveryVerificationWorkflow
              donation={donation}
              realNgoName={ngoProfile?.organization_name || donation.ngo_name}
              formattedDonationId={formattedId}
              onSuccess={handleDeliveryVerifiedSuccess}
            />
          )}

          {/* DELIVERY PROOF CARD (right column for DELIVERED/RECEIVED — read-only proof summary) */}
          {['DELIVERED', 'RECEIVED', 'ACKNOWLEDGED', 'NGO_RECEIVED', 'COMPLETED'].includes((donation.status || '').toUpperCase()) && (
            <DeliveryProofCard donation={donation} />
          )}

          {/* TRACKING HISTORY CARD */}
          <div className="ngo-details-card" style={{ 
            backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
            padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ color: '#C4622D' }}><Truck size={20} /></div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('ngo.donationDetails.trackingHistory', 'Tracking History')}</h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#8C7A6B' }}>
              {t('ngo.donationDetails.trackingDesc', "Follow your donation's journey from pickup to impact.")}
            </p>

            <TrackingTimeline donation={donation} history={history} />
          </div>

        </div>

      </div>

      <ReceiptVerificationModal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        donation={donation}
        onSuccess={(msg) => {
          setShowReceiptModal(false);
          showToast(msg || t('success.receiptConfirmed', 'Receipt confirmed successfully.'), 'success');
          setDonation(prev => ({
            ...prev,
            status: 'RECEIVED'
          }));
          fetchDonation();
        }}
      />

      <DeliveryOtpModal
        show={showDeliveryOtpModal}
        onHide={() => setShowDeliveryOtpModal(false)}
        donation={donation}
        onSuccess={(msg) => {
          setShowDeliveryOtpModal(false);
          showToast(msg || t('success.deliveryVerified', 'Delivery verified and marked as delivered successfully.'), 'success');
          setDonation(prev => ({
            ...prev,
            status: 'DELIVERED'
          }));
          fetchDonation();
        }}
      />
    </div>
  );
}



