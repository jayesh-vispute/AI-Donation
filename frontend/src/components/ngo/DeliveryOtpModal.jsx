import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldCheck, AlertCircle, Check, Loader2, Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

export default function DeliveryOtpModal({ show, onHide, donation, onSuccess }) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!show) return null;

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

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError(t('validation.otpSixDigits', 'Please enter the complete 6-digit verification code.'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const donationId = donation?.donation_id || donation?.id;
      const formData = new FormData();
      formData.append('otp', otp);
      if (photoFile) {
        formData.append('file', photoFile);
      }
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const res = await api.verifyDelivery(donationId, formData);
      onSuccess(res?.message || t('success.deliveryVerified', 'Delivery verified successfully!'));
    } catch (err) {
      console.error('Delivery verification failed:', err);
      setError(err.message || t('errors.verificationFailed', 'Verification failed. Please check the code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #EAE5DE',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid #F0ECE6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FDFCFB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#FDF1EB',
              color: '#C4622D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#2B1D14' }}>
                {t('ngo.deliveryOtp.title', 'Delivery OTP Verification')}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#8C7A6B' }}>
                {t('ngo.deliveryOtp.subtitle', 'Verify donor code & confirm delivery')}
              </p>
            </div>
          </div>
          <button
            onClick={onHide}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8C7A6B',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleVerify} style={{ padding: '22px' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#4A3D34', lineHeight: 1.5 }}>
            {t('ngo.deliveryOtp.body', 'Enter the 6-digit delivery OTP code provided by the donor to complete delivery.')}
          </p>

          {/* 1. OTP Input Section */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#654B35', marginBottom: '6px', letterSpacing: '0.4px' }}>
              {t('ngo.deliveryOtp.otpLabel', '6-Digit Delivery OTP Code')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              placeholder={t('ngo.deliveryOtp.otpPlaceholder', '000000')}
              disabled={loading}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '8px',
                padding: '11px 14px',
                backgroundColor: '#FBF9F7',
                border: '2px solid #EAE5DE',
                borderRadius: '12px',
                color: '#2B1D14',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
            />
          </div>

          {/* 2. Photo Upload Section */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#654B35', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{t('ngo.deliveryOtp.photoLabel', 'Delivery Photo')}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#8C7A6B', backgroundColor: '#F5F2ED', padding: '1px 7px', borderRadius: '100px', border: '1px solid #EAE5DE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('common.optional', 'Optional')}
                </span>
              </label>
              <span style={{ fontSize: '11px', color: '#8C7A6B' }}>{t('ngo.deliveryOtp.maxSize', 'Max 5MB (JPG, PNG, WEBP)')}</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handlePhotoSelect}
              disabled={loading}
              style={{ display: 'none' }}
            />

            {!photoPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #D1C8C0',
                  borderRadius: '12px',
                  backgroundColor: '#FDFCFB',
                  padding: '18px 16px',
                  textAlign: 'center',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#FDF1EB',
                  color: '#C4622D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px auto'
                }}>
                  <Camera size={20} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#2B1D14' }}>
                  {t('ngo.deliveryOtp.takePhoto', 'Upload or Take Photo')}
                </div>
                <div style={{ fontSize: '11px', color: '#8C7A6B', marginTop: '2px' }}>
                  {t('ngo.deliveryOtp.photoHint', 'Capture items handed over at delivery (optional)')}
                </div>
              </div>
            ) : (
              <div style={{
                border: '1.5px solid #EAE5DE',
                borderRadius: '12px',
                backgroundColor: '#FBF9F7',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={photoPreview}
                    alt={t('ngo.deliveryOtp.proofPreview', 'Photo Preview')}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #EAE5DE'
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2B1D14', maxWidth: '220px', wordBreak: 'break-word' }}>
                      {photoFile?.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', marginTop: '1px' }}>
                      {formatFileSize(photoFile?.size)} · {t('ngo.deliveryOtp.photoSelected', 'Photo Selected')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={loading}
                  title={t('ngo.deliveryOtp.removePhoto', 'Remove photo')}
                  style={{
                    backgroundColor: '#FEE2E2',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    color: '#DC2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#654B35', marginBottom: '6px' }}>
              {t('ngo.deliveryOtp.handoverNotes', 'Handover Notes (Optional)')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('ngo.deliveryOtp.handoverNotesPlaceholder', 'e.g., Received by security coordinator')}
              disabled={loading}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px',
                fontSize: '13px',
                borderRadius: '10px',
                border: '1px solid #EAE5DE',
                backgroundColor: '#FBF9F7',
                outline: 'none',
                color: '#2B1D14'
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
              color: '#DC2626',
              fontSize: '12px',
              lineHeight: 1.4
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Helper Security Note */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '20px',
            color: '#64748B',
            fontSize: '12px'
          }}>
            <ShieldCheck size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
            <span>{t('ngo.deliveryOtp.securityNote', 'Delivery timestamp and user authorization are recorded securely upon verification.')}</span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              style={{
                backgroundColor: 'white',
                border: '1px solid #EAE5DE',
                borderRadius: '100px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#654B35',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {t('actions.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              style={{
                backgroundColor: (otp.length === 6 && !loading) ? '#C4622D' : '#D1C8C0',
                border: 'none',
                borderRadius: '100px',
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: (otp.length === 6 && !loading) ? 'pointer' : 'not-allowed',
                boxShadow: (otp.length === 6 && !loading) ? '0 2px 8px rgba(196, 98, 45, 0.25)' : 'none'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  {t('ngo.deliveryOtp.verifying', 'Verifying...')}
                </>
              ) : (
                <>
                  <Check size={15} />
                  {t('ngo.deliveryOtp.verifyComplete', 'Verify & Complete Delivery')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
