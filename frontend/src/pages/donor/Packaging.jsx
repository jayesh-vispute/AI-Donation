import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, Check, CheckCircle2, AlertCircle, 
  Loader2, Lock, Unlock, Truck, BoxSelect, Shield, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { DonorSkeleton, DonorErrorState } from '../../components/donor/DonorStates';
import { useTranslation } from 'react-i18next';

const STATUS_STEPS = [
  { key: 'IN_PROGRESS', label: 'donor.statusInProgress', icon: BoxSelect },
  { key: 'PACKED', label: 'donor.statusPacked', icon: Package },
  { key: 'SEALED', label: 'donor.statusSealed', icon: Shield },
  { key: 'PICKUP_READY', label: 'donor.statusReadyForPickup', icon: Truck }
];

function getStatusIndex(status, donationStatus) {
  const s = (status || '').toUpperCase();
  const ds = (donationStatus || '').toUpperCase();
  if (ds === 'PICKUP_SCHEDULED' || ds === 'COLLECTED' || ds === 'DELIVERED') return 3;
  if (s === 'SEALED' || ds === 'SEALED') return 2;
  if (s === 'PACKED' || ds === 'PACKED') return 1;
  return 0;
}

export default function Packaging() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [donation, setDonation] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null); // item id being saved
  const [actionLoading, setActionLoading] = useState(null); // 'pack' | 'seal'
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [donationData, checklistData] = await Promise.all([
        api.getDonation(id),
        api.getPackagingChecklist(id)
      ]);
      setDonation(donationData);
      setChecklist(checklistData);
    } catch (err) {
      setError(err.message || t('donor.failedToLoadPackagingData', 'Failed to load packaging data.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handleToggleItem = async (itemId, currentValue) => {
    setSaving(itemId);
    try {
      const updated = await api.updatePackagingItem(id, itemId, { is_completed: !currentValue });
      setChecklist(updated);
    } catch (err) {
      showToast(err.message || t('donor.failedToSaveProgress', 'Failed to save progress.'), 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleMarkPacked = async () => {
    setActionLoading('pack');
    try {
      await api.markPacked(id);
      showToast(t('donor.donationMarkedPacked', 'Donation marked as packed!'), 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || t('donor.cannotMarkPacked', 'Cannot mark as packed. Check all required items.'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkSealed = async () => {
    setActionLoading('seal');
    try {
      await api.markSealed(id);
      showToast(t('donor.donationSealedReady', 'Donation sealed and ready for pickup!'), 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || t('donor.cannotMarkSealed', 'Cannot mark as sealed.'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px 48px' }}>
        <DonorSkeleton type="card" />
        <div style={{ marginTop: '24px' }}><DonorSkeleton type="card" /></div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px 48px' }}>
        <DonorErrorState message={error || t('donor.donationNotFound', 'Donation not found')} onRetry={fetchData} />
      </div>
    );
  }

  const items = checklist?.items || [];
  const requiredItems = items.filter(i => i.is_required);
  const completedRequired = requiredItems.filter(i => i.is_completed).length;
  const totalCompleted = items.filter(i => i.is_completed).length;
  const progress = items.length > 0 ? Math.round((totalCompleted / items.length) * 100) : 0;
  const currentStatusIdx = getStatusIndex(checklist?.status, donation?.status);
  const donationStatus = (donation?.status || '').toUpperCase();

  const allRequiredDone = completedRequired === requiredItems.length && requiredItems.length > 0;
  const sealingItems = items.filter(i => i.item_instruction.toLowerCase().includes('seal'));
  const nonSealRequired = requiredItems.filter(i => !i.item_instruction.toLowerCase().includes('seal'));
  const nonSealDone = nonSealRequired.every(i => i.is_completed);

  const canPack = nonSealDone && (donationStatus !== 'PACKED' && donationStatus !== 'SEALED' && donationStatus !== 'PICKUP_SCHEDULED');
  const canSeal = allRequiredDone && (donationStatus === 'PACKED');
  const canGoToPickup = donationStatus === 'SEALED' || donationStatus === 'PICKUP_SCHEDULED' || donationStatus === 'COLLECTED' || donationStatus === 'DELIVERED';

  const formattedId = donation?.id ? `DON-${donation.id.toString().padStart(3, '0')}` : '';

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#2B1D14', maxWidth: '820px', margin: '0 auto', padding: '16px 16px 60px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1100,
          backgroundColor: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4',
          color: toast.type === 'error' ? '#DC2626' : '#16A34A',
          border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#DCFCE7'}`,
          padding: '14px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.donor', 'Donor'), to: '/donor' },
        { label: t('navigation.myDonations', 'My Donations'), to: '/donations' },
        { label: t('donor.packagingChecklist', 'Packaging Checklist') }
      ]} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <button 
          onClick={() => navigate(`/donations/${id}`)}
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            backgroundColor: 'white', border: '1px solid #EAE5DE', borderRadius: '100px', 
            padding: '8px 16px', fontSize: '14px', fontWeight: 600, color: '#654B35', cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> {t('actions.back', 'Back')}
        </button>
      </div>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, margin: '0 0 4px 0' }}>
          {t('donor.packagingChecklist', 'Packaging Checklist')}
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#8C7A6B' }}>
          {formattedId} — {t('donor.packagingChecklistDesc', 'Prepare your items for pickup following these requirements.')}
        </p>
      </div>

      {/* Status Pipeline */}
      <div style={{
        backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '20px',
        padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ color: '#C4622D' }}><Package size={22} /></div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 700, margin: 0 }}>{t('donor.packagingStatus', 'Packaging Status')}</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0', position: 'relative', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
          {STATUS_STEPS.map((step, idx) => {
            const isActive = idx <= currentStatusIdx;
            const isCurrent = idx === currentStatusIdx;
            const Icon = step.icon;
            return (
              <React.Fragment key={step.key}>
                {idx > 0 && (
                  <div style={{
                    flex: 1, height: '3px',
                    backgroundColor: isActive ? '#C4622D' : '#EAE5DE',
                    transition: 'background-color 0.4s ease'
                  }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    backgroundColor: isActive ? '#C4622D' : '#F7F5F0',
                    border: isCurrent ? '3px solid #C4622D' : isActive ? '3px solid #C4622D' : '2px solid #EAE5DE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isActive ? 'white' : '#A39284',
                    transition: 'all 0.4s ease',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(196, 98, 45, 0.15)' : 'none'
                  }}>
                    {isActive && idx < currentStatusIdx ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: isCurrent ? 700 : 500,
                    color: isActive ? '#C4622D' : '#A39284',
                    marginTop: '8px', textAlign: 'center', wordBreak: 'break-word'
                  }}>
                    {t(step.label)}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Donation Items Summary */}
      <div style={{
        backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '20px',
        padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ color: '#C4622D' }}><Package size={22} /></div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 700, margin: 0 }}>{t('donor.donationItems', 'Donation Items')}</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {donation.items?.map((item, idx) => (
            <div key={idx} style={{
              padding: '10px 16px', borderRadius: '12px',
              backgroundColor: 'white', border: '1px solid #EAE5DE',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#2B1D14', textTransform: 'capitalize' }}>
                {item.item_name}
              </span>
              <span style={{ fontSize: '12px', color: '#8C7A6B' }}>×{item.quantity}</span>
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
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div style={{
        backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '20px',
        padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: '#C4622D' }}><CheckCircle2 size={22} /></div>
            <div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 700, margin: 0 }}>{t('donor.packagingRequirements', 'Packaging Requirements')}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#8C7A6B' }}>
                {t('donor.completeRequiredBeforePacking', 'Complete all required items before packing.')}
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            backgroundColor: progress === 100 ? '#F0FDF4' : '#FDF1EB',
            padding: '8px 16px', borderRadius: '100px',
            border: `1px solid ${progress === 100 ? '#DCFCE7' : '#FEF3E4'}`
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: progress === 100 ? '#16A34A' : '#C4622D' }}>
              {t('donor.completedCount', '{{completed}}/{{total}} completed', { completed: totalCompleted, total: items.length })}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: '8px', backgroundColor: '#F7F5F0', borderRadius: '100px',
          marginBottom: '24px', overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            backgroundColor: progress === 100 ? '#16A34A' : '#C4622D',
            borderRadius: '100px', transition: 'width 0.4s ease'
          }} />
        </div>

        {/* Checklist Items — grouped by category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(() => {
            // Parse [Category] prefix from each item and group
            const groups = [];
            let currentGroup = null;
            for (const item of items) {
              const match = item.item_instruction.match(/^\[(.+?)\]\s*(.+)$/);
              const category = match ? match[1] : null;
              const label = match ? match[2] : item.item_instruction;

              if (category && (!currentGroup || currentGroup.category !== category)) {
                currentGroup = { category, items: [] };
                groups.push(currentGroup);
              } else if (!category && (!currentGroup || currentGroup.category !== '__general__')) {
                currentGroup = { category: '__general__', items: [] };
                groups.push(currentGroup);
              }
              currentGroup.items.push({ ...item, displayLabel: label });
            }

            return groups.map((group, gIdx) => (
              <div key={gIdx}>
                {/* Section Header */}
                {group.category !== '__general__' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: '10px', paddingBottom: '8px',
                    borderBottom: '1px solid #F0EBE4'
                  }}>
                    <span style={{
                      backgroundColor: '#FDF1EB', color: '#C4622D',
                      padding: '4px 12px', borderRadius: '100px',
                      fontSize: '12px', fontWeight: 700, letterSpacing: '0.3px'
                    }}>
                      {t(`categories.${group.category.toLowerCase()}`, group.category)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#A39284' }}>
                      {t('donor.doneCount', '{{done}}/{{total}} done', { done: group.items.filter(i => i.is_completed).length, total: group.items.length })}
                    </span>
                  </div>
                )}
                {group.category === '__general__' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: '10px', paddingBottom: '8px',
                    borderBottom: '1px solid #F0EBE4'
                  }}>
                    <span style={{
                      backgroundColor: '#F7F5F0', color: '#654B35',
                      padding: '4px 12px', borderRadius: '100px',
                      fontSize: '12px', fontWeight: 700, letterSpacing: '0.3px'
                    }}>
                      {t('donor.finalSealing', 'Final Sealing')}
                    </span>
                  </div>
                )}

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.items.map((item) => {
                    const isSaving = saving === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => !isSaving && handleToggleItem(item.id, item.is_completed)}
                        style={{
                          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px',
                          padding: '14px 18px', borderRadius: '14px',
                          backgroundColor: item.is_completed ? '#F0FDF4' : 'white',
                          border: `1px solid ${item.is_completed ? '#DCFCE7' : '#EAE5DE'}`,
                          cursor: isSaving ? 'wait' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: isSaving ? 0.7 : 1
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 26, height: 26, borderRadius: '8px', flexShrink: 0,
                          backgroundColor: item.is_completed ? '#C4622D' : 'white',
                          border: item.is_completed ? '2px solid #C4622D' : '2px solid #D1C4B3',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}>
                          {isSaving ? (
                            <Loader2 size={14} color={item.is_completed ? 'white' : '#C4622D'} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : item.is_completed ? (
                            <Check size={16} color="white" strokeWidth={3} />
                          ) : null}
                        </div>

                        {/* Label */}
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: '14px', fontWeight: 600,
                            color: item.is_completed ? '#16A34A' : '#2B1D14',
                            textDecoration: item.is_completed ? 'line-through' : 'none'
                          }}>
                            {item.displayLabel}
                          </span>
                          {item.completed_at && (
                            <div style={{ fontSize: '11px', color: '#8C7A6B', marginTop: '2px' }}>
                              {t('donor.completedAt', 'Completed {{date}}', { date: new Date(item.completed_at).toLocaleString() })}
                            </div>
                          )}
                        </div>

                        {/* Required badge */}
                        {item.is_required ? (
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px',
                            backgroundColor: item.is_completed ? '#DCFCE7' : '#FEF3E4',
                            color: item.is_completed ? '#16A34A' : '#B45309'
                          }}>
                            {t('donor.required', 'Required')}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '100px',
                            backgroundColor: '#F7F5F0', color: '#8C7A6B'
                          }}>
                            {t('donor.optional', 'Optional')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '20px',
        padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ color: '#C4622D' }}><Truck size={22} /></div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 700, margin: 0 }}>{t('actions.title', 'Actions')}</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Mark Packed */}
          <button
            onClick={handleMarkPacked}
            disabled={!canPack || actionLoading === 'pack'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              width: '100%', padding: '14px 24px', borderRadius: '14px', fontSize: '15px', fontWeight: 700,
              border: 'none', cursor: canPack ? 'pointer' : 'not-allowed',
              backgroundColor: canPack ? '#2B1D14' : '#F7F5F0',
              color: canPack ? 'white' : '#A39284',
              boxShadow: canPack ? '0 4px 16px rgba(43,29,20,0.2)' : 'none',
              transition: 'all 0.2s ease', opacity: actionLoading === 'pack' ? 0.7 : 1
            }}
          >
            {actionLoading === 'pack' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Package size={18} />}
            {donationStatus === 'PACKED' || donationStatus === 'SEALED' ? t('donor.packedStatus', '✓ Packed') : t('actions.markAsPacked', 'Mark as Packed')}
            {!canPack && donationStatus !== 'PACKED' && donationStatus !== 'SEALED' && <Lock size={14} />}
          </button>

          {/* Mark Sealed */}
          <button
            onClick={handleMarkSealed}
            disabled={!canSeal || actionLoading === 'seal'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              width: '100%', padding: '14px 24px', borderRadius: '14px', fontSize: '15px', fontWeight: 700,
              border: 'none', cursor: canSeal ? 'pointer' : 'not-allowed',
              backgroundColor: canSeal ? '#C4622D' : '#F7F5F0',
              color: canSeal ? 'white' : '#A39284',
              boxShadow: canSeal ? '0 4px 16px rgba(196,98,45,0.3)' : 'none',
              transition: 'all 0.2s ease', opacity: actionLoading === 'seal' ? 0.7 : 1
            }}
          >
            {actionLoading === 'seal' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={18} />}
            {donationStatus === 'SEALED' ? t('donor.sealedStatus', '✓ Sealed') : t('actions.markAsSealed', 'Mark as Sealed')}
            {!canSeal && donationStatus !== 'SEALED' && <Lock size={14} />}
          </button>

          {/* Continue to Pickup */}
          <button
            onClick={() => {
              console.log("[Packaging] navigating to pickup for donation:", id);
              navigate(`/pickup/${id}`);
            }}
            disabled={!canGoToPickup}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              width: '100%', padding: '14px 24px', borderRadius: '14px', fontSize: '15px', fontWeight: 700,
              border: 'none', cursor: canGoToPickup ? 'pointer' : 'not-allowed',
              backgroundColor: canGoToPickup ? '#16A34A' : '#F7F5F0',
              color: canGoToPickup ? 'white' : '#A39284',
              boxShadow: canGoToPickup ? '0 4px 16px rgba(22,163,74,0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Truck size={18} />
            {t('actions.continueToPickup', 'Continue to Pickup')}
            {!canGoToPickup && <Lock size={14} />}
          </button>

        </div>

        {/* Helpful hint */}
        {!canGoToPickup && (
          <div style={{
            marginTop: '16px', padding: '12px 16px', borderRadius: '12px',
            backgroundColor: '#FFFBEB', border: '1px solid #FEF3C7',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '13px', color: '#92400E'
          }}>
            <AlertCircle size={16} />
            {donationStatus === 'PACKED' 
              ? t('donor.completeSealingForPickup', 'Complete the sealing step to enable pickup scheduling.')
              : t('donor.completeAllForSealing', 'Complete all required checklist items and mark as packed, then sealed to proceed.')
            }
          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
