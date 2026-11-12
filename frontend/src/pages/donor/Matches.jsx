import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  MapPin, 
  Bell, 
  RefreshCw, 
  Heart, 
  Search, 
  Users, 
  PackageOpen, 
  Leaf, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import donationBoxImg from '../../assets/donation_box.jpg';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export default function Matches() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [donationData, setDonationData] = useState(null);
  const [itemList, setItemList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectingId, setSelectingId] = useState(null);
  const [selectedSuccess, setSelectedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Item-level allocation quantity inputs and validation errors
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [allocationErrors, setAllocationErrors] = useState({});

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const searchParams = new URLSearchParams(location.search);
      let donationId = location.state?.donation?.id || searchParams.get('donation_id') || searchParams.get('id');
      
      if (!donationId) {
        const donations = await api.getDonorDonations('all');
        if (!donations || donations.length === 0) {
          setDonationData(null);
          setItemList([]);
          return;
        }
        // Find the newest donation that is still in PENDING or MATCHED and has unallocated items
        const pendingDonation = donations.find(d => {
          const st = (d.status || '').toUpperCase();
          if (st === 'PENDING') return true;
          if (st === 'MATCHED') {
            const hasUnallocated = d.items?.some(it => (it.allocated_quantity || 0) < (it.quantity || 1));
            return hasUnallocated;
          }
          return false;
        }) || donations.find(d => {
          const st = (d.status || '').toUpperCase();
          return st === 'PENDING' || st === 'MATCHED';
        });

        if (!pendingDonation) {
          setDonationData(null);
          setItemList([]);
          return;
        }
        donationId = pendingDonation.id;
      }
      
      const res = await api.getDonationItemMatches(donationId);
      
      if (res && res.items) {
        setDonationData(res);
        setItemList(res.items);

        // Pre-fill quantity inputs for each NGO match
        const initialQuantities = {};
        res.items.forEach(item => {
          const itemId = item.item_id || item.id;
          const currentAllocations = item.allocations || [];
          const otherAllocated = currentAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
          const remainingAvailable = Math.max(0, item.donated_quantity - otherAllocated);

          (item.matches || []).forEach(match => {
            const ngoId = match.ngo_id;
            const key = `${itemId}_${ngoId}`;
            const existingAlloc = currentAllocations.find(a => a.ngo_id === ngoId);

            if (existingAlloc) {
              initialQuantities[key] = existingAlloc.allocated_quantity;
            } else {
              initialQuantities[key] = Math.min(match.requested_quantity || match.matched_quantity || 1, remainingAvailable || 1);
            }
          });
        });
        setSelectedQuantities(initialQuantities);
      } else if (Array.isArray(res)) {
        setDonationData(null);
        setItemList(res);
      } else {
        setDonationData(null);
        setItemList([]);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(t('donor.matchesLoadError', 'Unable to load NGO matches. Please check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const getItemIcon = (name, category) => {
    const n = (name || category || '').toLowerCase();
    if (n.includes('laptop') || n.includes('computer')) return '💻';
    if (n.includes('book')) return '📚';
    if (n.includes('keyboard')) return '⌨';
    if (n.includes('cup') || n.includes('mug') || n.includes('coffee') || n.includes('tea')) return '☕';
    if (n.includes('dining table') || n.includes('table') || n.includes('desk')) return '🪑';
    if (n.includes('chair') || n.includes('seat') || n.includes('stool')) return '🪑';
    if (n.includes('cloth') || n.includes('shirt') || n.includes('pant') || n.includes('dress')) return '👕';
    if (n.includes('shoe') || n.includes('sneaker')) return '👟';
    return '📦';
  };

  const handleQuantityChange = (item, match, rawVal) => {
    const qty = parseInt(rawVal, 10);
    const itemId = item.item_id || item.id;
    const ngoId = match.ngo_id;
    const key = `${itemId}_${ngoId}`;
    const donatedQty = item.donated_quantity || item.quantity || 1;

    const currentAllocations = item.allocations || [];
    const otherAllocated = currentAllocations
      .filter(a => a.ngo_id !== ngoId)
      .reduce((sum, a) => sum + a.allocated_quantity, 0);

    const availableForThisNgo = donatedQty - otherAllocated;

    setSelectedQuantities(prev => ({ ...prev, [key]: isNaN(qty) ? '' : qty }));

    if (isNaN(qty) || qty <= 0) {
      setAllocationErrors(prev => ({
        ...prev,
        [key]: t('donor.quantityMinError', 'Allocated quantity must be at least 1.')
      }));
    } else if (qty > availableForThisNgo) {
      setAllocationErrors(prev => ({
        ...prev,
        [key]: t('donor.quantityExceededError', `Cannot allocate ${qty} items to ${match.ngo_name || 'this NGO'}. Only ${availableForThisNgo} unallocated ${item.item_name} remaining (Total detected: ${donatedQty}).`)
      }));
    } else {
      setAllocationErrors(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const handleAllocate = async (item, match) => {
    const itemId = item.item_id || item.id;
    const ngoId = match.ngo_id;
    const key = `${itemId}_${ngoId}`;
    const donatedQty = item.donated_quantity || item.quantity || 1;

    const currentAllocations = item.allocations || [];
    const otherAllocated = currentAllocations
      .filter(a => a.ngo_id !== ngoId)
      .reduce((sum, a) => sum + a.allocated_quantity, 0);

    const availableForThisNgo = donatedQty - otherAllocated;
    const qtyToAllocate = Number(selectedQuantities[key]);

    if (!qtyToAllocate || qtyToAllocate <= 0) {
      setAllocationErrors(prev => ({
        ...prev,
        [key]: t('donor.quantityMinError', 'Please enter a valid quantity of at least 1.')
      }));
      return;
    }

    if (qtyToAllocate > availableForThisNgo) {
      setAllocationErrors(prev => ({
        ...prev,
        [key]: t('donor.quantityExceededError', `Cannot allocate ${qtyToAllocate} items to ${match.ngo_name || 'this NGO'}. Only ${availableForThisNgo} unallocated ${item.item_name} remaining (Total detected: ${donatedQty}).`)
      }));
      return;
    }

    try {
      setSelectingId(key);
      const res = await api.allocateItemNgo(itemId, {
        ngo_id: ngoId,
        allocated_quantity: qtyToAllocate,
        match_id: match.match_id || null
      });

      setSuccessMessage(res.message || t('donor.ngoAllocatedSuccess', `Successfully allocated ${qtyToAllocate} × ${item.item_name} to ${match.ngo_name}`));
      setSelectedSuccess(true);
      await fetchMatches();
      setTimeout(() => setSelectedSuccess(false), 4000);
    } catch (err) {
      console.error('Error allocating item to NGO:', err);
      const errDetail = err.detail || err.message || t('donor.allocateFailed', 'Failed to allocate items to NGO.');
      setAllocationErrors(prev => ({ ...prev, [key]: errDetail }));
    } finally {
      setSelectingId(null);
    }
  };

  const handleRemoveAllocation = async (item, ngoId) => {
    const itemId = item.item_id || item.id;
    const key = `${itemId}_${ngoId}`;
    try {
      setSelectingId(key);
      await api.allocateItemNgo(itemId, {
        ngo_id: ngoId,
        allocated_quantity: 0
      });
      setSuccessMessage(t('donor.allocationRemoved', 'Item allocation updated successfully.'));
      setSelectedSuccess(true);
      await fetchMatches();
      setTimeout(() => setSelectedSuccess(false), 3000);
    } catch (err) {
      console.error('Error removing allocation:', err);
      alert(err.detail || err.message || t('donor.removeAllocFailed', 'Failed to update allocation.'));
    } finally {
      setSelectingId(null);
    }
  };

  const handleFinishAllocations = () => {
    navigate('/donations', { state: { message: t('donor.allAllocationsComplete', 'Your item-level NGO allocations have been confirmed successfully!') } });
  };

  return (
    <div style={{ 
      fontFamily: 'Inter, sans-serif',
      color: '#2B1D14',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 16px 80px 16px'
    }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.donor', 'Donor'), to: '/donor' },
            { label: t('navigation.ngoMatches', 'NGO Matches') }
          ]} />

          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontFamily: 'Fraunces, serif', margin: '0 0 8px 0', color: '#2B1D14', fontWeight: 700 }}>
            {t('donor.ngoRecommendations', 'NGO Recommendations')}
          </h1>
          <p style={{ color: '#4A3D34', fontSize: '16px', margin: 0 }}>
            {t('donor.itemLevelMatchingDesc', 'Select and allocate NGOs independently for each detected item in your donation.')}
          </p>
        </div>

        {/* Decorative Quote */}
        <div style={{ textAlign: 'right', color: '#654B35', paddingTop: '16px' }}
             dangerouslySetInnerHTML={{ __html: t('donor.togetherWeCanQuote', '<h3 style="font-size: clamp(16px, 2vw, 24px); font-family: Fraunces, serif; font-style: italic; margin: 0; font-weight: 500">Together</h3><h3 style="font-size: clamp(16px, 2vw, 24px); font-family: Fraunces, serif; font-style: italic; margin: 0; font-weight: 500">we can create</h3><h3 style="font-size: clamp(16px, 2vw, 24px); font-family: Fraunces, serif; font-style: italic; margin: 0; font-weight: 500">brighter tomorrows. ♡</h3>') }}>
        </div>
      </div>

      {/* Success Notification Banner */}
      {selectedSuccess && (
        <div style={{ 
          backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', 
          padding: '16px 24px', borderRadius: '12px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600 
        }}>
          <CheckCircle2 size={22} color="#059669" /> {successMessage}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '18px', fontWeight: 600, color: '#C4622D', padding: '40px 0' }}>
            {t('donor.findingMatches', 'Finding NGO matches...')}
          </div>
          {[1,2,3].map(i => (
             <div key={i} style={{ height: '240px', backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '24px', borderRadius: '16px', textAlign: 'center', marginBottom: '32px' }}>
          <AlertCircle size={32} style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>{t('donor.unableToLoadMatches', 'Unable to load NGO matches.')}</p>
          <button onClick={fetchMatches} style={{ padding: '10px 20px', backgroundColor: '#991B1B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>{t('actions.retry', 'Retry')}</button>
        </div>
      ) : itemList.length === 0 ? (
        /* Empty State */
        <div style={{ 
          backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '24px', 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          overflow: 'hidden', marginBottom: '32px', alignItems: 'stretch'
        }}>
          {/* Left Illustration */}
          <div style={{ 
            backgroundColor: '#FDF1EB', position: 'relative', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', padding: '24px', 
            boxSizing: 'border-box', overflow: 'hidden', minHeight: '380px'
          }}>
            <img src={donationBoxImg} alt="Donation Box" style={{ width: '100%', height: '100%', maxHeight: '340px', objectFit: 'contain' }} />
          </div>
          
          {/* Right Content */}
          <div style={{ 
            padding: '28px 32px', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', textAlign: 'center', justifyContent: 'center',
            boxSizing: 'border-box', minHeight: '380px'
          }}>
            <div style={{ marginBottom: '12px', color: '#2B1D14' }}>
               <PackageOpen size={42} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '24px', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: '0 0 12px 0', color: '#2B1D14' }}>
              {t('donor.noMatchingNgos', 'No matching NGOs found yet.')}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#4A3D34', lineHeight: 1.5, maxWidth: '420px' }}>
              {t('donor.noMatchingNgosDesc', "We couldn't find an immediate NGO demand matching these specific item subcategories, but NGO requirements update daily.")}
            </p>

            <button 
              onClick={() => alert(t('donor.notifyMatchAlert', 'You will be notified when a new NGO match is created for your items.'))}
              style={{
                backgroundColor: '#C4622D', color: 'white', border: 'none',
                borderRadius: '12px', padding: '12px 24px', fontWeight: 600, fontSize: '15px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                cursor: 'pointer', transition: 'background-color 0.2s ease', width: '100%', maxWidth: '340px'
              }}
            >
              <Bell size={18} /> {t('donor.notifyMe', 'Notify me when matched')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* DONATION Header Summary */}
          <div style={{
            backgroundColor: '#FFFDF9',
            border: '1px solid #EAE5DE',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#C4622D', letterSpacing: '1px', textTransform: 'uppercase' }}>
                DONATION {donationData?.donation_id ? `#D00${donationData.donation_id}` : ''}
              </span>
              <h2 style={{ fontSize: '22px', fontFamily: 'Fraunces, serif', margin: '4px 0 0 0', color: '#2B1D14', fontWeight: 700 }}>
                {t('donor.detectedItemsHeader', 'Detected Donation Items')}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ backgroundColor: '#FDF1EB', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', color: '#C4622D', fontWeight: 600 }}>
                {itemList.length} {t('donor.totalItems', 'Total Items')}
              </div>
              {donationData?.fully_matched_items > 0 && (
                <div style={{ backgroundColor: '#E4F4EC', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', color: '#2F7A4F', fontWeight: 600 }}>
                  {donationData.fully_matched_items} {t('donor.matched', 'Fully Matched')}
                </div>
              )}
              {donationData?.partially_matched_items > 0 && (
                <div style={{ backgroundColor: '#FEF3E4', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', color: '#B45309', fontWeight: 600 }}>
                  {donationData.partially_matched_items} {t('donor.partiallyMatched', 'Partially Matched')}
                </div>
              )}
            </div>
          </div>

          {/* ITEM-LEVEL MATCHES LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
            {itemList.map((item, idx) => {
              const itemId = item.item_id || item.id;
              const itemName = item.item_name || item.name || 'Donated Item';
              const donatedQty = item.donated_quantity || item.quantity || 1;
              const rawMatches = item.matches || [];
              const seenNgoIds = new Set();
              const matchesList = [];
              for (const m of rawMatches) {
                if (m.ngo_id && !seenNgoIds.has(m.ngo_id)) {
                  seenNgoIds.add(m.ngo_id);
                  matchesList.push(m);
                }
              }
              const allocationsList = item.allocations || [];
              const totalAllocated = allocationsList.reduce((sum, a) => sum + a.allocated_quantity, 0);
              const remainingQty = item.remaining_quantity ?? Math.max(0, donatedQty - totalAllocated);
              const matchStatus = item.matching_status || (totalAllocated >= donatedQty ? 'FULLY_MATCHED' : (totalAllocated > 0 ? 'PARTIALLY_MATCHED' : 'UNMATCHED'));

              return (
                <div key={itemId || idx} style={{
                  backgroundColor: '#FFFDF9',
                  borderRadius: '20px',
                  border: '1px solid #EAE5DE',
                  boxShadow: '0 4px 16px rgba(43, 29, 20, 0.04)',
                  padding: '24px',
                  transition: 'all 0.2s ease'
                }}>
                  
                  {/* Item Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '32px', lineHeight: 1 }}>
                        {getItemIcon(itemName, item.category)}
                      </span>
                      <div>
                        <h3 style={{ fontSize: '22px', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: 0, color: '#2B1D14' }}>
                          {itemName} ×{donatedQty}
                        </h3>
                        {item.category && (
                          <span style={{ fontSize: '13px', color: '#654B35', fontWeight: 500, marginTop: '2px', display: 'inline-block' }}>
                            {t(`categories.${(item.category || '').toLowerCase()}`, item.category)} {item.subcategory ? `• ${item.subcategory}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge & Allocation Stats */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: '#654B35', fontWeight: 600 }}>
                        Allocated: <strong style={{ color: totalAllocated > 0 ? '#2F7A4F' : '#2B1D14' }}>{totalAllocated}</strong> / {donatedQty}
                      </span>

                      {matchStatus === 'FULLY_MATCHED' ? (
                        <span style={{ backgroundColor: '#E4F4EC', color: '#2F7A4F', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={14} /> {t('donor.fullyMatched', 'Fully Matched')}
                        </span>
                      ) : matchStatus === 'PARTIALLY_MATCHED' ? (
                        <span style={{ backgroundColor: '#FEF3E4', color: '#B45309', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={14} /> {t('donor.partiallyMatched', 'Partially Matched')}
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#F7F3EC', color: '#8C7A6B', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                          {t('donor.noMatchingNgo', 'No matching NGO')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Divider Line */}
                  <div style={{ height: '1px', backgroundColor: '#EAE5DE', margin: '0 0 20px 0' }} />

                  {/* Existing Active Allocations Summary for this Item */}
                  {allocationsList.length > 0 && (
                    <div style={{
                      backgroundColor: '#F4F9F6',
                      border: '1px solid #C8E6C9',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      marginBottom: '20px'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#2F7A4F', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Active Allocations for {itemName}:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {allocationsList.map(alloc => (
                          <div key={alloc.allocation_id || alloc.ngo_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#1B472E' }}>
                            <div>
                              <strong style={{ color: '#2F7A4F' }}>{alloc.ngo_name}</strong>: <strong>{alloc.allocated_quantity}</strong> units allocated
                            </div>
                            <button
                              onClick={() => handleRemoveAllocation(item, alloc.ngo_id)}
                              disabled={selectingId === `${itemId}_${alloc.ngo_id}`}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#991B1B',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              Remove / Reallocate
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fully Allocated Banner */}
                  {remainingQty === 0 && (
                    <div style={{
                      backgroundColor: '#E4F4EC',
                      border: '1px solid #A7F3D0',
                      color: '#166534',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <CheckCircle2 size={18} color="#166534" />
                      <span>
                        All {donatedQty} units of <strong>{itemName}</strong> are allocated! Click <strong>Proceed with Donation Allocations</strong> below when you are ready.
                      </span>
                    </div>
                  )}

                  {/* Sub-Header: Matching NGO / Matching NGOs / No matching NGO */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px 0' }}>
                      {matchesList.length > 1 
                        ? t('donor.matchingNgosHeader', 'Matching NGOs')
                        : matchesList.length === 1 
                        ? t('donor.matchingNgoHeader', 'Matching NGO')
                        : t('donor.noMatchingNgoHeader', 'No matching NGO')}
                    </h4>

                    {matchesList.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
                        {matchesList.map((match) => {
                          const ngoName = match.ngo_name || match.ngo?.organization_name || 'NGO Partner';
                          const reqQty = match.requested_quantity ?? match.demand?.quantity_required ?? donatedQty;
                          const matchedQty = match.matched_quantity ?? donatedQty;
                          const scorePercent = match.overall_score ? Math.round(match.overall_score * 100) : null;
                          const ngoId = match.ngo_id;
                          const key = `${itemId}_${ngoId}`;
                          const isAllocating = selectingId === key;

                          const currentAlloc = allocationsList.find(a => a.ngo_id === ngoId);
                          const inputQty = selectedQuantities[key] ?? Math.min(reqQty, remainingQty + (currentAlloc ? currentAlloc.allocated_quantity : 0));
                          const errorMsg = allocationErrors[key];

                          return (
                            <div key={match.match_id || ngoId} style={{
                              backgroundColor: '#FDFCFB',
                              border: errorMsg ? '1px solid #EF4444' : currentAlloc ? '2px solid #2F7A4F' : '1px solid #EAE5DE',
                              borderRadius: '14px',
                              padding: '18px',
                              display: 'flex',
                              flexDirection: 'column',
                              justify: 'space-between',
                              gap: '14px',
                              transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                            }}
                            >
                              <div>
                                {/* NGO Title & Distance / Score */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#E4F4EC', color: '#2F7A4F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <Building2 size={20} />
                                    </div>
                                    <div>
                                      <h5 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0', color: '#2B1D14' }}>
                                        {ngoName}
                                      </h5>
                                      {match.distance_km != null ? (
                                        <div style={{ fontSize: '12px', color: '#654B35', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <MapPin size={12} /> {match.distance_km} km away
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: '12px', color: '#8C7A6B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <MapPin size={12} /> Verified NGO
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {currentAlloc && (
                                      <span style={{ backgroundColor: '#E4F4EC', color: '#2F7A4F', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        <CheckCircle2 size={12} /> {currentAlloc.allocated_quantity} allocated
                                      </span>
                                    )}
                                    {scorePercent && (
                                      <span style={{ backgroundColor: '#FDF1EB', color: '#C4622D', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        <Sparkles size={12} /> {scorePercent}%
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Needs & Matched Quantities */}
                                <div style={{ backgroundColor: '#FFFDF9', border: '1px dashed #EAE5DE', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0' }}>
                                  <div style={{ color: '#4A3D34' }}>
                                    <strong>{t('donor.needsLabel', 'Needs:')}</strong> {itemName} ×{reqQty}
                                  </div>
                                  <div style={{ color: '#2F7A4F', fontWeight: 700 }}>
                                    <strong>{t('donor.matchedLabel', 'Matched:')}</strong> {matchedQty}
                                  </div>
                                  {match.match_reason && (
                                    <div style={{ fontSize: '12px', color: '#654B35', fontStyle: 'italic', marginTop: '2px' }}>
                                      "{match.match_reason}"
                                    </div>
                                  )}
                                </div>

                                {/* Quantity Allocation Selector Stepper/Input */}
                                <div style={{ marginTop: '12px' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4A3D34', marginBottom: '6px' }}>
                                    {t('donor.quantityToAllocate', 'Quantity to Allocate:')}
                                  </label>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(item, match, Math.max(1, (Number(inputQty) || 1) - 1))}
                                      style={{
                                        width: 34, height: 34, borderRadius: '8px', border: '1px solid #EAE5DE',
                                        backgroundColor: '#FFFDF9', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: '#2B1D14'
                                      }}
                                    >
                                      <Minus size={14} />
                                    </button>

                                    <input
                                      type="number"
                                      value={inputQty}
                                      min={1}
                                      max={donatedQty}
                                      onChange={(e) => handleQuantityChange(item, match, e.target.value)}
                                      style={{
                                        width: '60px',
                                        textAlign: 'center',
                                        padding: '6px',
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        borderRadius: '8px',
                                        border: errorMsg ? '2px solid #EF4444' : '1px solid #EAE5DE',
                                        outline: 'none'
                                      }}
                                    />

                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(item, match, (Number(inputQty) || 0) + 1)}
                                      style={{
                                        width: 34, height: 34, borderRadius: '8px', border: '1px solid #EAE5DE',
                                        backgroundColor: '#FFFDF9', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: '#2B1D14'
                                      }}
                                    >
                                      <Plus size={14} />
                                    </button>

                                    <span style={{ fontSize: '12px', color: '#8C7A6B' }}>
                                      / max {donatedQty}
                                    </span>
                                  </div>

                                  {/* Inline Validation Error Message */}
                                  {errorMsg && (
                                    <div style={{
                                      backgroundColor: '#FEF2F2',
                                      border: '1px solid #FCA5A5',
                                      color: '#B91C1C',
                                      padding: '8px 10px',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      marginTop: '8px',
                                      lineHeight: 1.3
                                    }}>
                                      ⚠️ {errorMsg}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Button */}
                              <button
                                onClick={() => handleAllocate(item, match)}
                                disabled={isAllocating || !!errorMsg}
                                style={{
                                  width: '100%',
                                  backgroundColor: isAllocating || !!errorMsg ? '#D1C7BD' : currentAlloc ? '#2F7A4F' : '#C4622D',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '10px',
                                  padding: '10px 16px',
                                  fontWeight: 700,
                                  fontSize: '14px',
                                  cursor: isAllocating || !!errorMsg ? 'not-allowed' : 'pointer',
                                  transition: 'background-color 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justify: 'center',
                                  gap: '6px'
                                }}
                              >
                                {isAllocating ? t('donor.allocating', 'Allocating...') : currentAlloc ? t('donor.updateAllocation', 'Update Allocation') : t('donor.selectNgoBtn', 'Select NGO')}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* No NGO Matched Card */
                      <div style={{
                        backgroundColor: '#FDFCFB',
                        border: '1px dashed #D1C7BD',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <PackageOpen size={22} color="#8C7A6B" />
                          <span style={{ fontSize: '14px', color: '#654B35', fontWeight: 500 }}>
                            {t('donor.noMatchingNgoForThisItem', 'No active NGO demand matches this item at the moment.')}
                          </span>
                        </div>
                        <button
                          onClick={() => alert(t('donor.notifyItemAlert', 'We will notify you when an NGO requests this item.'))}
                          style={{
                            backgroundColor: '#FFFDF9',
                            color: '#C4622D',
                            border: '1px solid #C4622D',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Bell size={14} /> {t('donor.notifyMe', 'Notify Me')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Remaining Quantity Badge */}
                  {remainingQty > 0 && matchesList.length > 0 && (
                    <div style={{
                      marginTop: '16px',
                      backgroundColor: '#FEF3E4',
                      border: '1px solid #FDE68A',
                      color: '#B45309',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between'
                    }}>
                      <span>
                        {t('donor.remainingLabel', 'Remaining:')} <strong>{remainingQty}</strong> {itemName}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 400, color: '#92400E' }}>
                        {t('donor.remainingDesc', 'Still available for allocation to other matching NGOs')}
                      </span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer to confirm overall donation allocations */}
          <div style={{
            backgroundColor: '#FFFDF9',
            border: '1px solid #EAE5DE',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#2B1D14' }}>
                {t('donor.readyToProceed', 'Ready with your item allocations?')}
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#654B35' }}>
                {t('donor.confirmAllocationsDesc', 'All NGO selections are attached directly to each specific donation item.')}
              </p>
            </div>

            <button
              onClick={handleFinishAllocations}
              style={{
                backgroundColor: '#2F7A4F',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(47, 122, 79, 0.2)'
              }}
            >
              {t('donor.confirmAllAllocations', 'Proceed with Donation Allocations')} <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {/* How NGO Matching Works Section */}
      <div style={{ backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '24px', padding: '32px 40px', marginTop: '32px' }}>
        <h2 style={{ fontSize: '24px', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: '0 0 32px 0', color: '#2B1D14' }}>
          {t('donor.howNgoRecommendationWorks', 'How NGO Recommendation Works')}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '24px', position: 'relative', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PackageOpen size={24} /></div>
             <div>
               <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#2B1D14' }}>{t('donor.hwkStep1', '1. You Donate')}</h4>
               <p style={{ margin: 0, fontSize: '13px', color: '#654B35', lineHeight: 1.4 }}>{t('donor.hwkStep1Desc', 'AI recognizes subcategory & quantity')}</p>
             </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#E4F4EC', color: '#2F7A4F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Search size={24} /></div>
             <div>
               <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#2B1D14' }}>{t('donor.hwkStep2', '2. AI Matches Needs')}</h4>
               <p style={{ margin: 0, fontSize: '13px', color: '#654B35', lineHeight: 1.4 }}>{t('donor.hwkStep2Desc', 'Matches subcategories & NGO demands')}</p>
             </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#F2E8FA', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={24} /></div>
             <div>
               <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#2B1D14' }}>{t('donor.hwkStep3', '3. NGOs Review')}</h4>
               <p style={{ margin: 0, fontSize: '13px', color: '#654B35', lineHeight: 1.4 }}>{t('donor.hwkStep3Desc', 'Verified NGOs review and accept')}</p>
             </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FCE7F3', color: '#BE185D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Heart size={24} /></div>
             <div>
               <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#2B1D14' }}>{t('donor.hwkStep4', '4. Impact Created')}</h4>
               <p style={{ margin: 0, fontSize: '13px', color: '#654B35', lineHeight: 1.4 }}>{t('donor.hwkStep4Desc', 'Donations reach communities in need')}</p>
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E9F5EF', padding: '16px 24px', borderRadius: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Leaf color="#2F7A4F" size={20} />
            <span style={{ fontSize: '14px', color: '#1B472E', fontWeight: 500 }}>
              {t('donor.changeALifeQuote', 'Every item you donate has the potential to change a life. Thank you for being a part of this journey!')}
            </span>
          </div>
          <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '18px', color: '#2B1D14' }}>
            {t('donor.kindnessCreatesChange', 'Kindness Creates Change. ♡')}
          </div>
        </div>
      </div>

    </div>
  );
}
