import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Filter, FileText, Clock, Link as LinkIcon, Truck, 
  MapPin, Calendar, ArrowRight, AlertCircle, Box, Heart, Leaf, Check,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { translateDonationStatus } from '../../utils/ngoI18n';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function IncomingDonations() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total_requests: 0, pending_review: 0, matched: 0, ready_for_pickup: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const [data, statsData] = await Promise.all([
          api.getNgoDonationRequests(),
          api.getNgoDonationRequestsStats()
        ]);
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRequests(data);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch requests", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const getStatusInfo = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return { color: '#D97706', bg: '#FEF3C7', label: translateDonationStatus(status, t), iconColor: '#D97706' };
      case 'matched': return { color: '#C4622D', bg: '#FDF1EB', label: translateDonationStatus(status, t), iconColor: '#C4622D' };
      case 'pickup_scheduled': return { color: '#8064D8', bg: '#F3E8FF', label: translateDonationStatus(status, t), iconColor: '#8064D8' };
      case 'collected': return { color: '#2563EB', bg: '#F2F6FE', label: translateDonationStatus(status, t), iconColor: '#2563EB' };
      case 'delivered':
      case 'received':
      case 'acknowledged':
      case 'ngo_received':
      case 'completed': return { color: '#16A34A', bg: '#F0FDF4', label: translateDonationStatus(status, t), iconColor: '#16A34A' };
      default: return { color: '#4B5563', bg: '#F3F4F6', label: translateDonationStatus(status, t), iconColor: '#4B5563' };
    }
  };

  const getFilterLabel = (f) => {
    if (f === 'ALL') return t('ngo.incoming.allRequests');
    if (f === 'PENDING') return t('status.pending');
    if (f === 'MATCHED') return t('status.matched');
    return f;
  };

  const filteredDonations = requests.filter(d => 
    filter === 'ALL' ? true : d.status?.toUpperCase() === filter
  );

  const totalPages = Math.max(1, Math.ceil(filteredDonations.length / itemsPerPage));
  const paginatedDonations = filteredDonations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const CircularProgress = ({ percentage, color = '#2F7A4F' }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '11px', color: '#654B35', marginBottom: '8px', fontWeight: 600 }}>{t('ngo.incoming.matchQuality')}</div>
        <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            <circle cx="28" cy="28" r={radius} stroke="#EAE5DE" strokeWidth="4" fill="none" />
            <circle 
              cx="28" cy="28" r={radius} 
              stroke={color} strokeWidth="4" fill="none" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', fontWeight: 700, fontSize: '14px', color: '#2B1D14' }}>
            {percentage}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="inc-donations-page" style={{ paddingBottom: '40px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="inc-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.ngo', 'NGO'), to: '/ngo' },
            { label: t('navigation.donations', 'Donations') }
          ]} />
          <h1 style={{ fontSize: '36px', margin: '0 0 8px 0', fontFamily: 'Fraunces, serif', color: '#2B1D14', fontWeight: 700 }}>
            {t('ngo.incoming.title', 'Donation Requests')}
          </h1>
          <p style={{ color: '#4A3D34', margin: '0 0 16px 0', fontSize: '16px' }}>
            {t('ngo.incoming.desc', 'Review and accept items matched to your demands.')}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#654B35', fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontSize: '15px' }}>
            <Leaf size={18} color="#2F7A4F" /> 
            <span>{t('ngo.incoming.tagline', 'Every accepted donation helps meet a real community need.')}</span>
            <Heart size={14} strokeWidth={2} color="#C4622D" />
          </div>
        </div>
        
        <div className="inc-filters-row" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'MATCHED'].map(f => (
            <button className="inc-filter-btn"
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '100px',
                border: filter === f ? 'none' : '1px solid #EAE5DE',
                backgroundColor: filter === f ? '#C4622D' : '#FFFDF9',
                color: filter === f ? '#fff' : '#654B35',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {getFilterLabel(f)}
            </button>
          ))}
          <button className="inc-filter-btn" style={{ 
            padding: '8px 16px', borderRadius: '100px', border: '1px solid #EAE5DE', backgroundColor: '#FFFDF9',
            color: '#2B1D14', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}>
            <Filter size={16} /> {t('actions.filter', 'Filter')}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="inc-stats-grid">
        
        {/* Stat 1 */}
        <div className="inc-stat-item">
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14' }}>{stats.total_requests}</span>
              <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>↑ +12%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#654B35', fontWeight: 600 }}>{t('ngo.totalRequests', 'Total Requests')}</span>
              <span style={{ fontSize: '11px', color: '#A3968B' }}>{t('common.vsLastMonth', 'vs last month')}</span>
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="inc-stat-item">
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14' }}>{stats.pending_review}</span>
              <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>↑ +3</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#654B35', fontWeight: 600 }}>{t('ngo.incoming.pendingReview', 'Pending Review')}</span>
              <span style={{ fontSize: '11px', color: '#A3968B' }}>{t('common.vsLastMonth', 'vs last month')}</span>
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="inc-stat-item">
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LinkIcon size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14' }}>{stats.matched}</span>
              <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>↑ +5</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#654B35', fontWeight: 600 }}>{t('status.matched', 'Matched')}</span>
              <span style={{ fontSize: '11px', color: '#A3968B' }}>{t('common.vsLastMonth', 'vs last month')}</span>
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="inc-stat-item">
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#F3E8FF', color: '#8064D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14' }}>{stats.ready_for_pickup}</span>
              <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>↑ +2</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#654B35', fontWeight: 600 }}>{t('ngo.incoming.readyForPickup', 'Ready for Pickup')}</span>
              <span style={{ fontSize: '11px', color: '#A3968B' }}>{t('common.vsLastMonth', 'vs last month')}</span>
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#2B1D14' }}>{t('ngo.recentDonationRequests', 'Recent Donation Requests')}</h2>
        <button style={{ background: 'none', border: 'none', color: '#C4622D', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 }}>
          {t('actions.seeAll', 'See All')} <ArrowRight size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#654B35' }}>{t('ngo.incoming.loadingRequests', 'Loading donation requests...')}</div>
        ) : filteredDonations.length === 0 ? (
          <div style={{ backgroundColor: '#FFFDF9', borderRadius: '16px', border: '1px solid #EAE5DE', padding: '48px', textAlign: 'center' }}>
            <Box size={48} color="#EAE5DE" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#2B1D14' }}>{t('empty.noDonationRequests', 'No donation requests found')}</h3>
            <p style={{ color: '#654B35', margin: '0 0 24px 0', fontSize: '14px' }}>{t('empty.donorsWillAppear', 'Donation requests matched to your needs will appear here.')}</p>
            <button onClick={() => navigate('/ngo/item-requests')} style={{ backgroundColor: '#C4622D', color: '#fff', border: 'none', borderRadius: '100px', padding: '10px 24px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>{t('ngo.incoming.viewItemRequests', 'View Item Requests')}</button>
          </div>
        ) : paginatedDonations.map((donation) => {
          const statusInfo = getStatusInfo(donation.status);
          
          const matchQuality = donation.match_score ? Math.round(donation.match_score) : 0;
          const matchColor = matchQuality > 90 ? '#16A34A' : matchQuality > 80 ? '#2F7A4F' : '#D97706';
          const itemCount = donation.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          
          return (
            <div className="inc-request-card" key={donation.id}>
              {/* Column 1: Info */}
              <div className="inc-request-col1" style={{ display: 'flex', gap: '16px', minWidth: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: statusInfo.bg, color: statusInfo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, flexShrink: 0 }}>
                  {donation.donor_name ? donation.donor_name.charAt(0).toUpperCase() : 'D'}
                </div>
                
                <div className="inc-request-info" style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#2B1D14' }}>{donation.donor_name || t('common.donor')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: statusInfo.bg, padding: '2px 10px', borderRadius: '100px' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusInfo.iconColor }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#654B35', marginBottom: '16px' }}>
                    <MapPin size={14} color="#A3968B" /> Hyderabad, Telangana
                  </div>
                  
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={16} color="#A3968B" /> {t('ngo.incoming.itemsRequested', { count: itemCount })}
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {donation.items?.slice(0, 2).map((item, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F7F3EC', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#4A3D34', fontWeight: 500 }}>
                        <Box size={12} color="#A3968B" />
                        <span style={{ textTransform: 'capitalize' }}>{item.item_name} ({item.quantity})</span>
                      </span>
                    ))}
                    {donation.items?.length > 2 && (
                      <span style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F7F3EC', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#4A3D34', fontWeight: 600 }}>
                        +{donation.items.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: Match Quality */}
              <div className="ngo-incoming-divider">
                 <CircularProgress percentage={matchQuality} color={matchColor} />
              </div>

              {/* Column 3: Status & Action */}
              <div className="inc-request-col3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {donation.status === 'COLLECTED' || donation.status === 'DELIVERED' || donation.status === 'ACKNOWLEDGED' ? (
                     <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ marginTop: '2px' }}><div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Check size={14} /></div></div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14', marginBottom: '2px' }}>{t('status.completed')}</div>
                        <div style={{ fontSize: '12px', color: '#654B35' }}>{new Date(donation.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Calendar size={20} color="#C4622D" />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14', marginBottom: '2px' }}>
                          {donation.status === 'PICKUP_SCHEDULED' ? t('status.pickupScheduled') : t('ngo.incoming.pickupPending')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#654B35' }}>
                          {donation.pickup_scheduled_at 
                            ? new Date(donation.pickup_scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                            : t('ngo.incoming.dateToBeConfirmed')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                     {donation.status === 'collected' ? (
                       <Box size={20} color="#8C7A6B" />
                     ) : (
                       <Truck size={20} color="#8C7A6B" />
                     )}
                     <span style={{ fontSize: '13px', color: '#4A3D34', fontWeight: 500 }}>
                        {donation.status === 'collected' ? t('ngo.incoming.itemsCollected') : donation.status === 'matched' ? t('ngo.incoming.readyForPickupStatus') : t('status.scheduled')}
                     </span>
                  </div>
                </div>
                
                <button className="inc-review-btn"
                  onClick={() => navigate(`/ngo/donations/${donation.id}`)}
                  style={{ 
                    backgroundColor: '#C4622D', color: '#fff', border: 'none', borderRadius: '100px', 
                    padding: '10px 20px', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                    cursor: 'pointer', transition: 'background-color 0.2s'
                  }}
                >
                  {t('actions.review')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {!loading && filteredDonations.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          marginTop: '16px',
          backgroundColor: '#FFFDF9',
          border: '1px solid #EAE5DE',
          borderRadius: '12px',
          fontSize: '13px',
          color: '#654B35'
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
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{
                width: 32, height: 32, borderRadius: '8px',
                border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.4 : 1,
                color: '#654B35'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}


