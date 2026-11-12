import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, Package, Check } from 'lucide-react';
import { api } from '../../services/api';
import { translateCondition } from '../../utils/ngoI18n';

const CONDITION_OPTIONS = ['NEW', 'GOOD', 'FAIR', 'POOR'];

const ReceiptVerificationModal = ({ show, onHide, donation, onSuccess }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (donation && donation.items) {
      setItems(
        donation.items.map((item) => ({
          donation_item_id: item.id,
          name: item.item_name || t('ngo.receipt.unnamedItem'),
          category: item.category,
          subcategory: item.subcategory || item.subcategory_id,
          expected_quantity: item.quantity,
          received_quantity: item.quantity,
          condition: 'GOOD', // default
        }))
      );
    }
  }, [donation, t]);

  if (!show) return null;


  const handleQuantityChange = (id, value) => {
    const val = parseInt(value, 10);
    setItems((prev) =>
      prev.map((item) => {
        if (item.donation_item_id === id) {
          return {
            ...item,
            received_quantity: isNaN(val) ? 0 : Math.min(Math.max(0, val), item.expected_quantity),
          };
        }
        return item;
      })
    );
  };

  const handleConditionChange = (id, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.donation_item_id === id ? { ...item, condition: value } : item
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) return;
    
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        items: items.map(i => ({
          donation_item_id: i.donation_item_id,
          expected_quantity: i.expected_quantity,
          received_quantity: i.received_quantity,
          condition: i.condition
        })),
        notes: notes || null
      };
      
      const realDonationId = donation.donation_id || donation.id;
      await api.confirmDonationReceipt(realDonationId, payload);
      onSuccess(t('success.receiptConfirmedShort'));
    } catch (err) {
      console.error('Confirm receipt error:', err);
      
      let errorMsg = err.message || t('errors.unableConfirmReceipt');
      
      if (err.response) {
        const detail = err.response.data?.detail;
        switch (err.response.status) {
          case 400:
            errorMsg = detail || t('validation.invalidReceiptRequest');
            break;
          case 401:
            errorMsg = t('errors.pleaseLoginAgain');
            break;
          case 403:
            errorMsg = t('errors.notAuthorizedReceipt');
            break;
          case 404:
            errorMsg = t('errors.donationNotFoundShort');
            break;
          case 409:
            errorMsg = detail || t('errors.receiptAlreadyConfirmed');
            break;
          case 422:
            errorMsg = t('validation.checkReceivedQuantities');
            break;
          case 500:
            errorMsg = detail || t('errors.unableConfirmReceipt');
            break;
          default:
            errorMsg = detail || errorMsg;
        }
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const allItemsFullyReceived = items.every(i => i.received_quantity === i.expected_quantity);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '24px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EAE5DE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#2B1D14' }}>{t('ngo.receipt.title')}</h2>
          <button onClick={onHide} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A6B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <p style={{ color: '#654B35', margin: '0 0 24px 0', fontSize: '14px' }}>
            {t('ngo.receipt.desc')}
          </p>

          {donation && (
            <div style={{ backgroundColor: '#FAFAF9', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #EAE5DE' }}>
              <div style={{ fontWeight: 700, color: '#2B1D14', marginBottom: '8px' }}>
                {t('ngo.receipt.donationLabel', { id: donation.donation_id || donation.id })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', color: '#654B35' }}>
                <div><strong>{t('ngo.receipt.donorLabel')}</strong> {donation.donor_name || t('common.anonymous')}</div>
                <div><strong>{t('ngo.receipt.ngoLabel')}</strong> {donation.ngo_name || t('common.yourNgo')}</div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: '#FDF3F3', color: '#D14343', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="table-responsive-wrapper" style={{ border: '1px solid #EAE5DE', borderRadius: '12px', overflowX: 'auto', maxWidth: '100%', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAFAF9', borderBottom: '1px solid #EAE5DE' }}>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#2B1D14' }}>{t('ngo.receipt.tableItem')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#2B1D14', textAlign: 'center' }}>{t('ngo.receipt.tableExpected')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#2B1D14', width: '120px' }}>{t('ngo.receipt.tableReceived')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#2B1D14', width: '140px' }}>{t('ngo.receipt.tableCondition')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.donation_item_id} style={{ borderBottom: idx !== items.length - 1 ? '1px solid #EAE5DE' : 'none' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#2B1D14', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={16} />
                          </div>
                          <div>
                            <div style={{ textTransform: 'capitalize' }}>{item.name}</div>
                            {(item.category || item.subcategory) && (
                              <div style={{ fontSize: '12px', color: '#8C7A6B', marginTop: '2px' }}>
                                {item.category}{item.subcategory ? ` / ${item.subcategory}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#654B35', textAlign: 'center', fontWeight: 600 }}>{item.expected_quantity}</td>
                      <td style={{ padding: '16px' }}>
                        <input
                          type="number"
                          min="0"
                          max={item.expected_quantity}
                          value={item.received_quantity}
                          onChange={(e) => handleQuantityChange(item.donation_item_id, e.target.value)}
                          required
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #EAE5DE', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                        />
                      </td>
                      <td style={{ padding: '16px' }}>
                        <select
                          value={item.condition}
                          onChange={(e) => handleConditionChange(item.donation_item_id, e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #EAE5DE', borderRadius: '8px', outline: 'none', fontSize: '14px', backgroundColor: '#fff' }}
                        >
                          {CONDITION_OPTIONS.map((condition) => (
                            <option key={condition} value={condition}>
                              {translateCondition(condition, t)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!allItemsFullyReceived && (
              <div style={{ backgroundColor: '#FFFBEB', color: '#B45309', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> {t('validation.partialQuantityNotes')}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#2B1D14', marginBottom: '8px' }}>{t('ngo.receipt.notesLabel')}</label>
              <textarea
                rows={3}
                placeholder={t('ngo.receipt.notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #EAE5DE', borderRadius: '8px', outline: 'none', fontSize: '14px', resize: 'vertical' }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '32px' }}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                required
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#C4622D' }}
              />
              <span style={{ fontSize: '14px', color: '#2B1D14', lineHeight: 1.5 }}>
                {t('ngo.receipt.confirmCheckbox')}
              </span>
            </label>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #EAE5DE', paddingTop: '24px' }}>
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #EAE5DE', backgroundColor: '#fff', color: '#2B1D14', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {t('actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={!confirmed || loading}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: (!confirmed || loading) ? '#F5F5F5' : '#C4622D', color: (!confirmed || loading) ? '#A3A3A3' : '#fff', fontSize: '14px', fontWeight: 600, cursor: (!confirmed || loading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {loading ? t('ngo.receipt.confirming') : (
                  <>
                    <Check size={16} /> {t('ngo.receipt.confirmReceipt')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReceiptVerificationModal;
