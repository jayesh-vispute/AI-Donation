import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateDonationStatus } from '../../utils/ngoI18n';
import { ShieldCheck, Check, CheckCircle, AlertCircle, Loader2, Camera, Upload, Trash2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { api, API_URL } from '../../services/api';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

export default function DeliveryVerificationWorkflow({
  donation,
  realNgoName,
  formattedDonationId,
  onSuccess
}) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const fileInputRef = useRef(null);
  const otpInputRef = useRef(null);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendingOtp) return;
    setResendingOtp(true);
    setError('');
    setResendSuccess('');

    try {
      const realDonationId = donation?.donation_id || donation?.id;
      await api.resendDeliveryOtp(realDonationId);
      setResendSuccess(t('ngo.deliveryWorkflow.resendSuccessMsg', 'New verification code sent to the donor\'s registered email.'));
      setResendCooldown(60);
      
      // Clear success message after 10 seconds
      setTimeout(() => setResendSuccess(''), 10000);
    } catch (err) {
      console.error('Failed to resend OTP:', err);
      setError(err?.message || err?.detail || t('ngo.deliveryWorkflow.resendFailedMsg', 'Unable to send a new verification code. Please try again.'));
    } finally {
      setResendingOtp(false);
    }
  };

  const statusUpper = (donation?.status || '').toUpperCase();
  const isCollected = statusUpper === 'COLLECTED';
  const isDelivered = statusUpper === 'DELIVERED' || statusUpper === 'RECEIVED' || verified;

  const displayDonationId = formattedDonationId || (donation?.donation_id ? `DON-${donation.donation_id}` : (donation?.id ? `DON-${donation.id}` : 'DON-001'));
  const displayNgoName = realNgoName || donation?.ngo_name || donation?.ngo?.organization_name || donation?.ngo?.name || t('ngo.deliveryWorkflow.assignedPartner', 'Assigned NGO Partner');

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    if (error) setError('');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) || (file.type && !ALLOWED_TYPES.includes(file.type))) {
      setError(t('validation.unsupportedImageFormat', 'Unsupported image format. Please use JPG, PNG, or WEBP.'));
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(t('validation.imageSizeExceeds', { size: (file.size / (1024 * 1024)).toFixed(1), defaultValue: 'File size exceeds 5MB' }));
      return;
    }

    if (file.size === 0) {
      setError(t('validation.emptyImageFile', 'Image file is empty.'));
      return;
    }

    setError('');
    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFormValid = otp.trim().length === 6 && !submitting;

  const handleVerifyAndDeliver = async (e) => {
    if (e) e.preventDefault();

    if (otp.trim().length !== 6) {
      setError(t('validation.otpSixDigitsCode', 'Please enter the complete 6-digit verification code.'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const realDonationId = donation?.donation_id || donation?.id;
      const donationRequestId = donation?.id;

      // 1. Upload & submit proof to the proof validation endpoint
      const formData = new FormData();
      formData.append('otp', otp.trim());
      if (photoFile) {
        formData.append('file', photoFile);
      }
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const proofRes = await api.verifyDelivery(realDonationId, formData);

      // 2. Call existing backend delivery workflow
      try {
        if (donationRequestId) {
          await api.markDonationDelivered(donationRequestId);
        }
      } catch (existingErr) {
        console.log('Existing backend delivery workflow synced:', existingErr?.message || existingErr);
      }

      setVerified(true);

      if (onSuccess) {
        onSuccess(proofRes);
      }
    } catch (err) {
      console.error('Delivery verification failed:', err);
      const backendError = err?.message || err?.detail || t('errors.deliveryVerificationFailed', 'Delivery verification failed. Please check the OTP code and try again.');
      setError(backendError);
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      id="delivery-verification"
      style={{
        backgroundColor: '#FDFCFB',
        border: isDelivered ? '1.5px solid #BBF7D0' : (isCollected ? '1.5px solid #FCD34D' : '1px solid #EAE5DE'),
        borderRadius: '16px',
        padding: '20px',
        boxShadow: isDelivered ? '0 4px 18px rgba(22, 163, 74, 0.08)' : (isCollected ? '0 4px 18px rgba(245, 158, 11, 0.08)' : '0 2px 12px rgba(0,0,0,0.02)'),
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: isDelivered ? '#16A34A' : (isCollected ? '#F59E0B' : '#C4622D')
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: isDelivered ? '#DCFCE7' : (isCollected ? '#FEF3C7' : '#FDF1EB'),
            color: isDelivered ? '#16A34A' : (isCollected ? '#D97706' : '#C4622D'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0, color: '#2B1D14' }}>
              {t('ngo.deliveryWorkflow.title', 'Delivery Verification')}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#8C7A6B' }}>
              {isDelivered ? t('ngo.deliveryWorkflow.subtitleDelivered', 'Handover authenticated & verified') : t('ngo.deliveryWorkflow.subtitlePending', 'Verify donor OTP code and upload optional delivery photo')}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '100px',
          backgroundColor: isDelivered ? '#DCFCE7' : (isCollected ? '#FEF3C7' : '#F5F2ED'),
          color: isDelivered ? '#16A34A' : (isCollected ? '#D97706' : '#654B35'),
          border: `1px solid ${isDelivered ? '#BBF7D0' : (isCollected ? '#FDE68A' : '#EAE5DE')}`,
          letterSpacing: '0.4px'
        }}>
          {isDelivered ? t('ngo.deliveryWorkflow.deliveredBadge', 'DELIVERED') : (isCollected ? t('ngo.deliveryWorkflow.actionRequired', 'ACTION REQUIRED') : statusUpper)}
        </span>
      </div>

      {/* Context Metadata Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px',
        backgroundColor: '#F7F5F0',
        borderRadius: '10px',
        padding: '10px 14px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C7A6B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('ngo.deliveryWorkflow.donationLabel', 'Donation ID')}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#2B1D14', marginTop: '2px' }}>
            {displayDonationId}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C7A6B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('ngo.deliveryWorkflow.ngoLabel', 'NGO Partner')}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#2B1D14', marginTop: '2px', wordBreak: 'break-word' }}>
            {displayNgoName}
          </div>
        </div>
      </div>

      {/* ================= IF ALREADY DELIVERED ================= */}
      {isDelivered ? (
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1.5px solid #BBF7D0',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontSize: '15px', fontWeight: 700 }}>
              <CheckCircle size={20} /> {t('ngo.deliveryWorkflow.deliveryVerified', 'Delivery Verified & Authenticated')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 600 }}>{t('ngo.deliveryWorkflow.statusLabel', 'Status:')}</span>
              <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: '100px', fontWeight: 700, fontSize: '12px', border: '1px solid #BBF7D0' }}>
                {translateDonationStatus('DELIVERED', t)}
              </span>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: '#166534', lineHeight: 1.5 }}>
            {t('ngo.deliveryWorkflow.deliveredAuthDesc', 'Delivery OTP verification code was successfully confirmed.')}
          </p>

          {(donation?.delivery_proof_url || photoPreview) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'white',
              border: '1px solid #DCFCE7',
              borderRadius: '10px',
              padding: '10px 12px'
            }}>
              <img
                src={photoPreview || (donation?.delivery_proof_url?.startsWith('http') ? donation.delivery_proof_url : `${API_URL}${donation?.delivery_proof_url}`)}
                alt={t('ngo.deliveryProof.deliveryProofAlt', 'Delivery Proof')}
                style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #EAE5DE' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>
                  {t('ngo.deliveryWorkflow.handoverPhotoProof', 'Handover Photo Proof')}
                </div>
                <div style={{ fontSize: '11px', color: '#654B35', marginTop: '2px' }}>
                  {t('ngo.deliveryWorkflow.storedOnServer', 'Stored securely on server')}
                </div>
                {donation?.delivery_proof_url && (
                  <a
                    href={donation.delivery_proof_url.startsWith('http') ? donation.delivery_proof_url : `${API_URL}${donation.delivery_proof_url}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: '#C4622D', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}
                  >
                    {t('ngo.deliveryWorkflow.viewFullPhoto', 'View Full Photo')} <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ) : isCollected ? (
        /* ================= IF COLLECTED: ACTIVE VERIFICATION WORKFLOW ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* STEP 1: DELIVERY VERIFICATION CODE */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EAE5DE',
            borderRadius: '12px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#654B35', letterSpacing: '0.4px', display: 'block' }}>
                {t('ngo.deliveryWorkflow.step1Title', 'Step 1: Enter 6-Digit Delivery OTP')}
              </label>
              <span style={{ fontSize: '11px', fontWeight: 600, color: otp.length === 6 ? '#16A34A' : '#8C7A6B' }}>
                {t('ngo.deliveryWorkflow.digitsProgress', '{{count}}/6 digits entered', { count: otp.length })}
              </span>
            </div>

            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#8C7A6B' }}>
              {t('ngo.deliveryWorkflow.step1Hint', 'Ask the donor for the 6-digit delivery code sent to their email.')}
            </p>

            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              placeholder="______"
              disabled={submitting}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '8px',
                padding: '10px 14px',
                backgroundColor: '#FBF9F7',
                border: `2px solid ${otp.length === 6 ? '#16A34A' : '#EAE5DE'}`,
                borderRadius: '10px',
                color: '#2B1D14',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
            />

            {/* RESEND OTP SECTION */}
            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#654B35', fontWeight: 500 }}>
                {t('ngo.deliveryWorkflow.didNotReceiveCode', 'Didn\'t receive the code?')}
              </p>
              
              {resendSuccess && (
                <div style={{ marginBottom: '8px', fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>
                  <CheckCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                  {resendSuccess}
                </div>
              )}

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resendingOtp || submitting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: (resendCooldown > 0 || resendingOtp || submitting) ? '#A39284' : '#C4622D',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: (resendCooldown > 0 || resendingOtp || submitting) ? 'not-allowed' : 'pointer',
                  textDecoration: (resendCooldown > 0 || resendingOtp || submitting) ? 'none' : 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease'
                }}
              >
                {resendingOtp ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> {t('ngo.deliveryWorkflow.sending', 'Sending...')}
                  </>
                ) : resendCooldown > 0 ? (
                  t('ngo.deliveryWorkflow.resendCooldown', 'Resend OTP in {{seconds}}s', { seconds: resendCooldown })
                ) : (
                  t('ngo.deliveryWorkflow.resendOtp', 'Resend OTP')
                )}
              </button>
            </div>
          </div>

          {/* STEP 2: UPLOAD DELIVERY PHOTO */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EAE5DE',
            borderRadius: '12px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#654B35', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{t('ngo.deliveryWorkflow.step2Title', 'Step 2: Delivery Photo')}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#8C7A6B', backgroundColor: '#F5F2ED', padding: '1px 7px', borderRadius: '100px', border: '1px solid #EAE5DE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('common.optional', 'Optional')}
                </span>
              </label>
              <span style={{ fontSize: '11px', color: '#8C7A6B' }}>
                {t('ngo.deliveryWorkflow.maxSize', 'Max 5MB (JPG, PNG, WEBP)')}
              </span>
            </div>

            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#8C7A6B' }}>
              {t('ngo.deliveryWorkflow.step2Hint', 'Optionally take or upload a photo of the handed-over items.')}
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handlePhotoSelect}
              disabled={submitting}
              style={{ display: 'none' }}
            />

            {!photoPreview ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  style={{
                    backgroundColor: '#FDF1EB',
                    border: '1.5px dashed #C4622D',
                    color: '#C4622D',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Camera size={16} /> {t('actions.choosePhoto', 'Choose / Take Photo')}
                </button>
                <span style={{ fontSize: '12px', color: '#8C7A6B' }}>
                  {t('ngo.deliveryWorkflow.noPhotoSelected', 'No photo selected (optional)')}
                </span>
              </div>
            ) : (
              /* Photo Preview Block */
              <div style={{
                border: '1.5px solid #BBF7D0',
                borderRadius: '10px',
                padding: '10px 12px',
                backgroundColor: '#F0FDF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <img
                    src={photoPreview}
                    alt={t('ngo.deliveryOtp.proofPreview', 'Photo Preview')}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #BBF7D0',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16A34A', fontSize: '12px', fontWeight: 700 }}>
                      <Check size={14} /> {t('ngo.deliveryOtp.photoSelected', 'Photo Selected')}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#2B1D14',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '180px',
                      marginTop: '2px'
                    }}>
                      {photoFile?.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#654B35', marginTop: '1px' }}>
                      {formatFileSize(photoFile?.size)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #EAE5DE',
                      borderRadius: '6px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#654B35',
                      cursor: 'pointer'
                    }}
                  >
                    {t('ngo.deliveryWorkflow.change', 'Change')}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={submitting}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #FCA5A5',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      fontSize: '11px',
                      color: '#DC2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={t('ngo.deliveryOtp.removePhoto', 'Remove photo')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BACKEND ERROR DISPLAY (If verification fails) */}
          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#991B1B',
              fontSize: '13px'
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>{t('ngo.deliveryWorkflow.verificationError', 'Verification Error')}</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM DELIVERY PROOF */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EAE5DE',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#654B35', letterSpacing: '0.4px', display: 'block' }}>
              {t('ngo.deliveryWorkflow.step3Title', 'Step 3: Confirm Delivery')}
            </label>

            <button
              type="button"
              onClick={handleVerifyAndDeliver}
              disabled={!isFormValid}
              style={{
                backgroundColor: isFormValid ? '#C4622D' : '#D1C8C0',
                color: 'white',
                border: 'none',
                borderRadius: '100px',
                padding: '11px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                boxShadow: isFormValid ? '0 4px 14px rgba(196, 98, 45, 0.25)' : 'none'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {t('ngo.deliveryWorkflow.verifyingDelivered', 'Verifying & Completing...')}
                </>
              ) : (
                <>
                  <Check size={16} /> {t('ngo.deliveryWorkflow.verifyMarkDelivered', 'Verify OTP & Mark Delivered')}
                </>
              )}
            </button>

            {!isFormValid && !submitting && (
              <p style={{ margin: 0, fontSize: '11px', color: '#8C7A6B', textAlign: 'center' }}>
                {otp.trim().length !== 6
                  ? t('validation.enterCompleteCode', 'Please enter the complete 6-digit delivery code')
                  : ''}
              </p>
            )}
          </div>

        </div>
      ) : (
        /* ================= STATUS NOT COLLECTED YET ================= */
        <div style={{
          backgroundColor: '#F7F5F0',
          borderRadius: '10px',
          padding: '14px 16px',
          fontSize: '13px',
          color: '#654B35',
          lineHeight: 1.5
        }}>
          {t('errors.deliveryStatusGate', 'Delivery verification is available once donation status is COLLECTED. Current status: {{status}}', { status: statusUpper })}
        </div>
      )}
    </div>
  );
}
