import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Search, ChevronDown, CheckCircle, Clock, Users, Truck, Heart, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../../services/api';
import donationBoxImg from '../../assets/donation_box.jpg';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export default function DonationHistory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All'); // 'All', 'Active', 'Completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDonorDonations();
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setDonations(data);
    } catch (err) {
      setError(t('donor.unableToLoadDonationHistory', 'Unable to load donation history. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const isDonationCompleted = (status) => {
    const s = status?.toLowerCase() || '';
    return s === 'completed' || s === 'delivered' || s === 'acknowledged' || s === 'received' || s === 'ngo_received';
  };

  const activeDonations = donations.filter(d => !isDonationCompleted(d.status));
  const completedDonations = donations.filter(d => isDonationCompleted(d.status));

  const filteredDonations = donations.filter(d => {
    const isCompleted = isDonationCompleted(d.status);
    
    // Tab filter
    if (filter === 'Completed' && !isCompleted) return false;
    if (filter === 'Active' && isCompleted) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const itemsMatch = d.items?.some(i => (i.item_name || i.category || '').toLowerCase().includes(query));
      const ngoMatch = (d.ngo_name || d.ngo_id?.toString() || '').toLowerCase().includes(query);
      if (!itemsMatch && !ngoMatch) return false;
    }
    
    return true;
  });

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'pending';
    const statusLabel = status ? t(`status.${s}`, status) : t('status.pending', 'Pending');
    if (s === 'delivered' || s === 'completed' || s === 'acknowledged' || s === 'received' || s === 'ngo_received') {
      return { bg: '#E9F5EF', text: '#2F7A4F', icon: <CheckCircle size={14} />, label: statusLabel };
    }
    if (s === 'matched') {
      return { bg: '#F2E8FA', text: '#6D28D9', icon: <Users size={14} />, label: statusLabel }; 
    }
    if (s === 'collected') {
      return { bg: '#E0F2FE', text: '#0284C7', icon: <Truck size={14} />, label: statusLabel }; 
    }
    if (s === 'pickup scheduled' || s === 'pending') {
      return { bg: '#FEF3E4', text: '#B45309', icon: <Clock size={14} />, label: statusLabel }; 
    }
    return { bg: '#FDF1EB', text: '#C4622D', icon: <Package size={14} />, label: statusLabel }; 
  };

  return (
    <div style={{ 
      fontFamily: 'Inter, sans-serif',
      color: '#2B1D14'
    }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.donor', 'Donor'), to: '/donor' },
            { label: t('navigation.myDonations', 'My Donations') }
          ]} />

          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontFamily: 'Fraunces, serif', margin: '0 0 8px 0', color: '#2B1D14', fontWeight: 700 }}>{t('navigation.myDonations', 'My Donations')}</h1>
          <p style={{ color: '#4A3D34', fontSize: '16px', margin: 0 }}>
            {t('donor.myDonationsDesc', 'Track your past and current donations. Every contribution makes a difference.')}
          </p>
        </div>

        {/* Decorative Quote */}
        <div style={{ textAlign: 'right', color: '#654B35', paddingTop: '16px' }}
             dangerouslySetInnerHTML={{ __html: t('donor.giveTodayQuote', '<h3 style="font-size: clamp(16px, 2vw, 24px); font-family: Fraunces, serif; font-style: italic; margin: 0; font-weight: 500">Give Today</h3><h3 style="font-size: clamp(16px, 2vw, 24px); font-family: Fraunces, serif; font-style: italic; margin: 0; font-weight: 500">For a Brighter</h3><h3 style="font-size: clamp(16px, 2vw, 24px); font-family: Fraunces, serif; font-style: italic; margin: 0; font-weight: 500">Tomorrow. ♡</h3>') }}>
        </div>
      </div>

      {/* Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '100px', padding: '4px', overflowX: 'auto' }}>
          {[
            { id: 'All', label: `${t('donor.filterAll', 'All')} (${donations.length})` },
            { id: 'Active', label: `${t('donor.filterActive', 'Active')} (${activeDonations.length})` },
            { id: 'Completed', label: `${t('donor.filterCompleted', 'Completed')} (${completedDonations.length})` }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '10px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 600,
                border: 'none',
                backgroundColor: filter === f.id ? '#C4622D' : 'transparent',
                color: filter === f.id ? 'white' : '#654B35',
                cursor: 'pointer', transition: 'all 0.2s ease',
                flexShrink: 0, whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ 
            position: 'relative', display: 'flex', alignItems: 'center',
            backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '8px',
            padding: '10px 16px', flex: '1 1 200px'
          }}>
            <Search size={18} color="#8C7A6B" style={{ position: 'absolute' }} />
            <input 
              type="text" 
              placeholder={t('donor.searchDonations', 'Search donations...')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', paddingLeft: '28px', fontSize: '14px', color: '#2B1D14' }}
            />
          </div>
          <button style={{
             display: 'flex', alignItems: 'center', gap: '8px',
             backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '8px',
             padding: '10px 16px', fontSize: '14px', fontWeight: 500, color: '#2B1D14', cursor: 'pointer'
          }}>
            {t('donor.sortByNewest', 'Sort by: Newest')} <ChevronDown size={16} color="#8C7A6B" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1,2,3].map(i => (
             <div key={i} style={{ height: '96px', backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
          {error} <br/>
          <button onClick={fetchDonations} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#991B1B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{t('actions.retry', 'Retry')}</button>
        </div>
      ) : donations.length === 0 ? (
        /* Empty State */
        <div style={{ 
          backgroundColor: '#FDFCFB', border: '2px dashed #EAE5DE', borderRadius: '24px', 
          padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', marginTop: '24px'
        }}>
          <img src={donationBoxImg} alt="No Donations" style={{ width: '200px', height: 'auto', marginBottom: '32px', objectFit: 'contain' }} />
          <h3 style={{ fontSize: '28px', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: '0 0 12px 0', color: '#2B1D14' }}>
            {t('donor.noDonationsYet', 'No donations yet')}
          </h3>
          <p style={{ margin: '0 0 32px 0', fontSize: '16px', color: '#654B35', maxWidth: '400px', lineHeight: 1.5 }}>
            {t('donor.noDonationsYetDesc', "You haven't made any donations. Start by photographing items you'd like to give to those in need.")}
          </p>
          <button 
            onClick={() => navigate('/donate')}
            style={{
              backgroundColor: '#C4622D', color: 'white', border: 'none',
              borderRadius: '12px', padding: '16px 32px', fontWeight: 600, fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', transition: 'background-color 0.2s ease'
            }}
          >
            {t('donor.donateAnItem', 'Donate an Item')} &rarr;
          </button>
        </div>
      ) : (
        /* List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {filteredDonations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#654B35' }}>{t('donor.noDonationsMatchFilters', 'No donations match your filters.')}</div>
          ) : (
            filteredDonations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((donation) => {
              const badge = getStatusBadge(donation.status);
              const dateStr = new Date(donation.created_at).toISOString().split('T')[0];
              
              return (
                <div key={donation.id} style={{ 
                  backgroundColor: '#FFFDF9', 
                  border: '1px solid #EAE5DE', borderRadius: '16px',
                  padding: '20px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
                  transition: 'all 0.2s ease', cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 24px rgba(43, 29, 20, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                onClick={() => navigate(`/donations/${donation.id}`)}
                >
                  
                  {/* Thumbnail Placeholder */}
                  <div style={{ 
                    width: 72, height: 72, borderRadius: '12px', 
                    backgroundColor: '#FDF1EB', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', color: '#C4622D',
                    flexShrink: 0
                  }}>
                    <Package size={32} strokeWidth={1.5} />
                  </div>
  
                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#2B1D14' }}>
                      {donation.items?.map(i => `${i.item_name || i.name || i.title || i.itemType || t('donor.item', 'Item')} × ${i.quantity || 1}`).join(', ') || t('donor.donationItems', 'Donation Items')}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#654B35' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#8C7A6B' }}>🏛️</span> 
                        {donation.ngo_name ? donation.ngo_name : (donation.ngo_id ? t('donor.toNgoId', 'To {{id}}', { id: donation.ngo_id }) : t('donor.awaitingMatch', 'Awaiting Match'))}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#8C7A6B' }}>📅</span> 
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={{ 
                    padding: '8px 16px', borderRadius: '100px', fontSize: '13px', 
                    fontWeight: 600, color: badge.text, backgroundColor: badge.bg,
                    display: 'flex', alignItems: 'center', gap: '6px',
                    width: '160px', justifyContent: 'center'
                  }}>
                    {badge.icon} {badge.label}
                  </div>

                  {/* Action */}
                  <button style={{
                    backgroundColor: 'transparent', border: '1px solid #EAE5DE', color: '#C4622D',
                    borderRadius: '8px', padding: '10px 16px', fontWeight: 600, fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0
                  }}>
                    {t('donor.viewDetails', 'View Details')} <ChevronRight size={16} />
                  </button>
  
                </div>
              );
            })
          )}

          {/* Pagination Footer */}
          {filteredDonations.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#FFFDF9',
              border: '1px solid #EAE5DE',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#654B35',
              marginTop: '8px'
            }}>
              <span>
                Showing {filteredDonations.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDonations.length)} of {filteredDonations.length} entries
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    width: 32, height: 32, borderRadius: '8px',
                    border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage <= 1 ? 0.4 : 1,
                    color: '#654B35'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(filteredDonations.length / itemsPerPage));
                  const maxVisible = 3;
                  const startPage = Math.floor((currentPage - 1) / maxVisible) * maxVisible + 1;
                  const endPage = Math.min(startPage + maxVisible - 1, totalPages);
                  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

                  return visiblePages.map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: 32, height: 32, borderRadius: '8px',
                        border: page === currentPage ? 'none' : '1px solid #EAE5DE',
                        backgroundColor: page === currentPage ? '#C4622D' : '#FFFFFF',
                        color: page === currentPage ? '#FFFFFF' : '#654B35',
                        fontWeight: page === currentPage ? 700 : 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {page}
                    </button>
                  ));
                })()}
                <button
                  disabled={currentPage >= Math.max(1, Math.ceil(filteredDonations.length / itemsPerPage))}
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredDonations.length / itemsPerPage), p + 1))}
                  style={{
                    width: 32, height: 32, borderRadius: '8px',
                    border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: currentPage >= Math.max(1, Math.ceil(filteredDonations.length / itemsPerPage)) ? 'not-allowed' : 'pointer',
                    opacity: currentPage >= Math.max(1, Math.ceil(filteredDonations.length / itemsPerPage)) ? 0.4 : 1,
                    color: '#654B35'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Banner for when donations exist */}
          {donations.length > 0 && (
            <div style={{ 
              backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '16px', 
              padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: '16px', flexWrap: 'wrap', gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', flex: '1 1 300px' }}>
                 <div style={{ width: '100px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                   <img src={donationBoxImg} alt="Keep Giving" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                 </div>
                 <div style={{ flex: '1 1 200px' }}>
                    <h3 style={{ fontSize: '18px', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: '0 0 6px 0', color: '#2B1D14' }}>
                      {t('donor.keepMakingDifference', 'Keep Making a Difference')}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#654B35', maxWidth: '400px', lineHeight: 1.5 }}>
                      {t('donor.keepMakingDifferenceDesc', 'Together, we can build stronger, kinder communities. Your next donation can create a brighter tomorrow.')}
                    </p>
                 </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => navigate('/donate')}
                  style={{
                    backgroundColor: '#C4622D', color: 'white', border: 'none',
                    borderRadius: '10px', padding: '12px 24px', fontWeight: 600, fontSize: '15px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    cursor: 'pointer', transition: 'background-color 0.2s ease'
                  }}
                >
                  <Heart size={16} /> {t('donor.donateAnItem', 'Donate an Item')}
                </button>
                <div style={{ textAlign: 'center', fontFamily: 'Fraunces, serif', color: '#654B35', fontStyle: 'italic', fontSize: '16px' }}
                     dangerouslySetInnerHTML={{ __html: t('donor.kindnessTomorrowQuote', 'Kindness<br/>Creates a Brighter<br/>Tomorrow. ♡') }}>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
