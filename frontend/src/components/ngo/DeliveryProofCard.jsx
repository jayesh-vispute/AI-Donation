import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, CheckCircle, Camera, Clock, User, Calendar, ExternalLink, Lock } from 'lucide-react';
import { API_URL } from '../../services/api';

/**
 * Read-only card displaying verified delivery proof details for the NGO.
 * Shows: OTP verified status, delivery photo, delivery date/time, verified by.
 * The NGO cannot edit any delivery proof — this is purely informational.
 */
export default function DeliveryProofCard({ donation }) {
  const { t } = useTranslation();

  if (!donation) return null;

  const statusUpper = (donation.status || '').toUpperCase();
  const isDelivered = statusUpper === 'DELIVERED' || statusUpper === 'RECEIVED';

  // Only show this card when donation has been delivered
  if (!isDelivered) return null;

  const proofUrl = donation.delivery_proof_url;
  const verifiedAt = donation.delivery_verified_at;
  const verifiedBy = donation.delivery_verified_by;
  const otpVerified = donation.delivery_otp_verified ?? true;

  // Format the delivery date and time from the verified_at timestamp
  const formatDate = (dateStr) => {
    if (!dateStr) return t('common.notAvailable', 'N/A');
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return t('common.notAvailable', 'N/A');
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return t('common.notAvailable', 'N/A');
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return t('common.notAvailable', 'N/A');
    }
  };

  const deliveryDate = formatDate(verifiedAt);
  const deliveryTime = formatTime(verifiedAt);
  const photoSrc = proofUrl
    ? (proofUrl.startsWith('http') ? proofUrl : `${API_URL}${proofUrl}`)
    : null;

  return (
    <div
      style={{
        backgroundColor: '#FDFCFB',
        border: '1.5px solid #BBF7D0',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 18px rgba(22, 163, 74, 0.06)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top green accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #16A34A, #22C55E)'
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#DCFCE7',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0, color: '#2B1D14' }}>
              {t('ngo.deliveryProof.title', 'Delivery Verified')}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#15803D', fontWeight: 500 }}>
              {t('ngo.deliveryProof.subtitle', 'Handover authenticated with secure OTP verification')}
            </p>
          </div>
        </div>

        {/* Read-only badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
          borderRadius: '100px', padding: '4px 10px',
          fontSize: '11px', fontWeight: 600, color: '#166534'
        }}>
          <Lock size={11} /> {t('common.readOnly', 'Read-only')}
        </div>
      </div>

      {/* Verification checklist */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
        gap: '10px',
        marginBottom: '16px'
      }}>
        {/* OTP Verified */}
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #DCFCE7',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: '#DCFCE7', color: '#16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <CheckCircle size={16} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>
              {otpVerified ? t('ngo.deliveryProof.otpVerified', 'OTP Verified') : t('ngo.deliveryProof.otpUnknown', 'OTP Pending')}
            </div>
            <div style={{ fontSize: '11px', color: '#166534', marginTop: '1px' }}>
              {t('ngo.deliveryProof.otpConfirmedDesc', 'Donor code confirmed')}
            </div>
          </div>
        </div>

        {/* Delivery Photo */}
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #DCFCE7',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: '#DCFCE7', color: '#16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Camera size={16} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>
              {proofUrl ? t('ngo.deliveryProof.deliveryPhoto', 'Delivery Photo') : t('ngo.deliveryProof.noPhoto', 'No Photo Uploaded')}
            </div>
            <div style={{ fontSize: '11px', color: '#166534', marginTop: '1px' }}>
              {proofUrl ? t('ngo.deliveryProof.photoCapturedDesc', 'Captured at handover') : t('ngo.deliveryProof.noPhotoDesc', 'Photo optional & skipped')}
            </div>
          </div>
        </div>

        {/* Delivery Date */}
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #DCFCE7',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: '#DCFCE7', color: '#16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Calendar size={16} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>
              {t('ngo.deliveryProof.deliveryDate', 'Delivery Date')}
            </div>
            <div style={{ fontSize: '11px', color: '#166534', marginTop: '1px' }}>
              {deliveryDate}
            </div>
          </div>
        </div>

        {/* Delivery Time */}
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #DCFCE7',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: '#DCFCE7', color: '#16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Clock size={16} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>
              {t('ngo.deliveryProof.deliveryTime', 'Delivery Time')}
            </div>
            <div style={{ fontSize: '11px', color: '#166534', marginTop: '1px' }}>
              {deliveryTime}
            </div>
          </div>
        </div>

        {/* Verified By */}
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #DCFCE7',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: '#DCFCE7', color: '#16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <User size={16} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>
              {t('ngo.deliveryProof.verifiedBy', 'Verified By')}
            </div>
            <div style={{ fontSize: '11px', color: '#166534', marginTop: '1px' }}>
              {verifiedBy || t('ngo.deliveryProof.authorizedUser', 'Authorized User')}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Photo Preview */}
      {photoSrc && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #DCFCE7',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <img
            src={photoSrc}
            alt={t('ngo.deliveryProof.deliveryProofAlt', 'Delivery Proof')}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '10px',
              objectFit: 'cover',
              border: '2px solid #BBF7D0',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#15803D', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} /> {t('ngo.deliveryProof.handoverPhotoProof', 'Handover Photo Proof')}
            </div>
            <div style={{ fontSize: '12px', color: '#654B35', marginTop: '3px' }}>
              {t('ngo.deliveryProof.storedSecurely', 'Captured and stored securely on the server at the time of delivery handover.')}
            </div>
            <a
              href={photoSrc}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '12px', color: '#C4622D', fontWeight: 600,
                textDecoration: 'none', display: 'inline-flex',
                alignItems: 'center', gap: '4px', marginTop: '6px'
              }}
            >
              {t('ngo.deliveryProof.viewFullImage', 'View Full Image')} <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* NGO next-step reminder */}
      {statusUpper === 'DELIVERED' && (
        <div style={{
          marginTop: '14px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #FDE68A',
          borderRadius: '10px',
          padding: '12px 14px',
          fontSize: '12px',
          color: '#92400E',
          lineHeight: 1.5
        }}>
          <strong>{t('ngo.deliveryProof.nextStep', 'Next Step:')}</strong> {t('ngo.deliveryProof.nextStepDesc', 'Physically verify the delivered items — check expected quantity, received quantity, and condition — then use Confirm Receipt to complete the process.')}
        </div>
      )}
    </div>
  );
}
