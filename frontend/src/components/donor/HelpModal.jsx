import React, { useState } from 'react';
import { X, HelpCircle, Send, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HelpModal({ donationId, onClose }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState('Donation status');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const formattedId = donationId ? `DON-${donationId.toString().padStart(3, '0')}` : '';

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(43, 29, 20, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#FDFCFB',
          borderRadius: '24px',
          border: '1px solid #EAE5DE',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: '#F5F2ED', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#654B35'
          }}
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 700, margin: '0 0 8px 0', color: '#2B1D14' }}>
              {t('donor.requestReceivedTitle', 'Request Received!')}
            </h3>
            <p style={{ color: '#654B35', fontSize: '15px', margin: 0, lineHeight: 1.5 }}>
              {t('donor.requestReceivedMsg', { id: formattedId, defaultValue: 'Thank you for reaching out. Our support team will respond to your query regarding {{id}} shortly.' })}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#FEF3E4', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 700, margin: 0, color: '#2B1D14' }}>
                  {t('donor.needHelp', 'Need Help?')}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#8C7A6B' }}>
                  {t('donor.supportRequestFor', { id: formattedId, defaultValue: 'Support request for {{id}}' })}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#2B1D14', marginBottom: '6px' }}>
                {t('donor.whatCanWeHelpWith', 'What can we help you with?')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid #EAE5DE', backgroundColor: 'white',
                  color: '#2B1D14', fontSize: '14px', fontWeight: 500, outline: 'none'
                }}
              >
                <option value="Donation status">{t('donor.catDonationStatus', 'Donation status inquiry')}</option>
                <option value="Pickup issue">{t('donor.catPickupIssue', 'Pickup or timing issue')}</option>
                <option value="NGO issue">{t('donor.catNgoIssue', 'NGO matching inquiry')}</option>
                <option value="Item issue">{t('donor.catItemIssue', 'Item modification inquiry')}</option>
                <option value="Other">{t('donor.catOther', 'Other question')}</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#2B1D14', marginBottom: '6px' }}>
                {t('donor.details', 'Details')}
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('donor.describeIssue', 'Describe your issue or question here...')}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid #EAE5DE', backgroundColor: 'white',
                  color: '#2B1D14', fontSize: '14px', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px', borderRadius: '100px', border: '1px solid #EAE5DE',
                  backgroundColor: 'transparent', color: '#654B35', fontWeight: 600, fontSize: '14px', cursor: 'pointer'
                }}
              >
                {t('actions.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 24px', borderRadius: '100px', border: 'none',
                  backgroundColor: '#C4622D', color: 'white', fontWeight: 600, fontSize: '14px',
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(196, 98, 45, 0.25)'
                }}
              >
                <Send size={15} /> {t('actions.submitRequest', 'Submit Request')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
