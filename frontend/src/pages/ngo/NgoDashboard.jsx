import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, PackagePlus, AlertCircle, ArrowRight, User, Heart, 
  Package, Truck, Users, Leaf, Calendar, ChevronRight, ChevronLeft, Search, Filter, BarChart3
} from 'lucide-react';
import NgoButton from '../../components/ngo/NgoButton';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { translateDonationStatus } from '../../utils/ngoI18n';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function NgoDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentCurrentPage, setRecentCurrentPage] = useState(1);
  const recentPerPage = 4;

  const StatCard = ({ icon: Icon, value, label, trend, trendLabel, colorScheme }) => (
    <div className="dash-stat-card" style={{
      backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '16px',
      padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
      boxSizing: 'border-box', width: '100%'
    }}>
      <div className="dash-stat-icon" style={{ 
        width: 48, height: 48, borderRadius: '50%', backgroundColor: colorScheme.bg, 
        color: colorScheme.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
      }}>
        <Icon size={24} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div className="dash-stat-val" style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14' }}>{value}</div>
        </div>
        <div style={{ fontSize: '13px', color: '#654B35', fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: trend.startsWith('+') && !trend.includes('2') ? '#16A34A' : '#D97706' }}>
          {trend.includes('2') && trend.length === 2 ? `↑ ${trend}` : `↑ ${trend}`} 
        </div>
        <div style={{ fontSize: '10px', color: '#8C7A6B' }}>{trendLabel}</div>
      </div>
    </div>
  );

  const getStatusStyle = (status) => {
    const label = translateDonationStatus(status, t);
    switch(status) {
      case 'MATCHED': return { bg: '#DCFCE7', color: '#16A34A', label };
      case 'PICKUP_SCHEDULED': return { bg: '#FEF3C7', color: '#D97706', label };
      case 'COLLECTED': return { bg: '#E0F2FE', color: '#0284C7', label };
      case 'IN_REVIEW': return { bg: '#F3E8FF', color: '#9333EA', label };
      case 'PENDING': return { bg: '#FEF3C7', color: '#D97706', label };
      case 'DELIVERED': return { bg: '#DCFCE7', color: '#16A34A', label };
      default: return { bg: '#F3F4F6', color: '#4B5563', label };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [requestsData, analyticsData] = await Promise.all([
          api.getNgoDonationRequests(),
          api.getNgoAnalytics()
        ]);
        
        // Sort descending
        requestsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRequests(requestsData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute urgent demands from analytics or defaults to 0 if not detailed
  const urgentDemands = analytics ? analytics.activeNeeds : 0;
  
  // Compute impact from analytics
  const impact = analytics ? analytics.monthlyBreakdown.reduce((sum, m) => sum + m.impact, 0) : 0;
  
  // We can use totalDonationsReceived or another metric if donor count isn't returned
  const totalDonors = analytics ? analytics.totalDonationsReceived : 0;

  const recentDonations = requests.slice(0, 5).map(req => ({
    id: req.id,
    initial: req.donor_name ? req.donor_name.charAt(0).toUpperCase() : 'D',
    bg: '#FDF1EB',
    color: '#C4622D',
    name: req.donor_name || t('common.donor', 'Donor'),
    items: req.items?.map(i => `${i.item_name || i.name || i.title || i.itemType || t('common.item', 'Item')} (${i.quantity || 1})`).join(', ') || t('common.items', 'Items'),
    date: new Date(req.created_at).toLocaleDateString(),
    status: req.status
  }));

  return (
    <div className="ngo-dash-container" style={{ fontFamily: 'Inter, sans-serif', color: '#2B1D14' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.ngo', 'NGO'), to: '/ngo' },
            { label: t('navigation.dashboard', 'Dashboard') }
          ]} />
          <div style={{ fontSize: '16px', color: '#654B35', marginBottom: '4px' }}>{t('ngo.welcomeBack', 'Welcome back,')}</div>
          <h1 style={{ fontSize: '42px', fontFamily: 'Fraunces, serif', margin: '0 0 8px 0', color: '#2B1D14', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t('ngo.ngoDashboard', 'NGO Dashboard')}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12L10 12" stroke="#C4622D" strokeWidth="3" strokeLinecap="round"/>
              <path d="M18 4L14 10" stroke="#C4622D" strokeWidth="3" strokeLinecap="round"/>
              <path d="M22 10L16 14" stroke="#C4622D" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </h1>
          <p style={{ color: '#4A3D34', fontSize: '15px', margin: 0 }}>
            {t('ngo.dashboardDesc', 'Together we can support more lives and stronger communities.')}
          </p>
        </div>

        {/* Decorative Quote */}
        <div style={{ textAlign: 'right', color: '#654B35', position: 'relative', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '20px', fontFamily: 'Fraunces, serif', fontStyle: 'italic', margin: 0, fontWeight: 500, zIndex: 2, position: 'relative' }}>{t('ngo.realChange', 'Real Change')}</h3>
          <h3 style={{ fontSize: '20px', fontFamily: 'Fraunces, serif', fontStyle: 'italic', margin: 0, fontWeight: 500, zIndex: 2, position: 'relative' }}>{t('ngo.happensTogether', 'Happens Together. ♡')}</h3>
          {/* Smudge background approximation */}
          <div style={{ position: 'absolute', top: '10px', right: '-10px', width: '220px', height: '50px', backgroundColor: '#FDF1EB', borderRadius: '40%', transform: 'rotate(-4deg)', zIndex: 1, filter: 'blur(8px)' }} />
          <div style={{ position: 'absolute', top: '-10px', right: '-40px', color: '#2F7A4F', zIndex: 3, transform: 'rotate(15deg)' }}><Leaf size={32} strokeWidth={1.5} /></div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="ngo-stats-row">
        <StatCard icon={Package} value={requests.length} label={t('ngo.totalRequests', 'Total Requests')} trend={analytics ? '↑' : ''} trendLabel={t('ngo.allTime', 'All time')} colorScheme={{ bg: '#FDF1EB', color: '#C4622D' }} />
        <StatCard icon={Truck} value={requests.filter(r => r.status === 'PICKUP_SCHEDULED').length} label={t('ngo.pendingPickup', 'Pending Pickup')} trend={analytics ? '↑' : ''} trendLabel={t('ngo.current', 'Current')} colorScheme={{ bg: '#F0FDF4', color: '#16A34A' }} />
        <StatCard icon={Users} value={totalDonors} label={t('navigation.donors', 'Donors')} trend={analytics ? '↑' : ''} trendLabel={t('ngo.totalReceived', 'Total received')} colorScheme={{ bg: '#F0F9FF', color: '#0284C7' }} />
        <StatCard icon={Heart} value={impact} label={t('ngo.livesImpacted', 'Lives Impacted')} trend={analytics ? '↑' : ''} trendLabel={t('ngo.totalImpact', 'Total impact')} colorScheme={{ bg: '#FAF5FF', color: '#9333EA' }} />
      </div>

      {/* Urgent Demands Banner */}
      <div className="dash-urgent-banner" style={{ 
        backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '4px solid #F59E0B',
        borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#B45309', fontWeight: 600, fontSize: '15px' }}>
          <AlertCircle size={20} />
          {t('ngo.urgentDemandsWarning', 'You have {{count}} urgent demands expiring within 7 days.', { count: urgentDemands })}
        </div>
        <button className="dash-review-btn"
          onClick={() => navigate('/ngo/item-requests')}
          style={{
          background: 'transparent', border: '1px solid #D97706', borderRadius: '8px',
          padding: '8px 16px', color: '#D97706', fontWeight: 600, fontSize: '14px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {t('ngo.reviewNow', 'Review Now')} <ArrowRight size={16} />
        </button>
      </div>

      {/* Action Row */}
      <div className="ngo-dash-action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div className="ngo-dash-action-btns" style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', flexShrink: 0 }}>
          <button className="dash-action-btn"
            onClick={() => navigate('/ngo/demands/add')}
            style={{
            backgroundColor: '#C4622D', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 14px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap'
          }}>
            <PlusCircle size={16} /> {t('ngo.createDemand', 'Create Demand')}
          </button>
          <button className="dash-action-btn"
            onClick={() => navigate('/ngo/donations')}
            style={{
            backgroundColor: '#2F7A4F', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 14px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap'
          }}>
            <PackagePlus size={16} /> {t('ngo.viewRequests', 'View Requests')}
          </button>
        </div>

        <div className="ngo-dash-search-filter" style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', flex: '1 1 auto', justifyContent: 'flex-end', minWidth: '220px' }}>
          <div style={{ position: 'relative', flex: '1 1 auto', maxWidth: '300px', minWidth: '130px' }}>
            <Search size={16} color="#8C7A6B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="dash-search-input"
              type="text" 
              placeholder={t('ngo.searchDonationRequests', 'Search donation requests...')} 
              style={{
                width: '100%', padding: '10px 12px 10px 32px', borderRadius: '8px',
                border: '1px solid #EAE5DE', backgroundColor: '#FFFDF9', fontSize: '13px', outline: 'none', boxSizing: 'border-box', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }} 
            />
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Filter size={16} color="#2B1D14" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <select className="dash-filter-select" style={{
              appearance: 'none', padding: '10px 30px 10px 32px', borderRadius: '8px',
              border: '1px solid #EAE5DE', backgroundColor: '#FFFDF9', fontSize: '13px', fontWeight: 500, color: '#2B1D14', outline: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              <option>{t('status.allStatus', 'All Status')}</option>
              <option>{translateDonationStatus('MATCHED', t)}</option>
              <option>{translateDonationStatus('PENDING', t)}</option>
            </select>
            <ChevronRight size={16} color="#8C7A6B" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '32px' }}>
        
        {/* Left Column: Recent Requests */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#2B1D14' }}>{t('ngo.recentDonationRequests', 'Recent Donation Requests')}</h2>
            <button onClick={() => navigate('/ngo/donations')} style={{ background: 'none', border: 'none', color: '#C4622D', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              {t('ngo.seeAll', 'See All')} <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentDonations.length === 0 && !loading && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#654B35', border: '1px dashed #EAE5DE', borderRadius: '12px' }}>
                {t('empty.noRecentRequests', 'No recent donation requests.')}
              </div>
            )}
            {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#654B35' }}>{t('common.loading', 'Loading...')}</div>}
            {(() => {
              const totalRecentPages = Math.max(1, Math.ceil(recentDonations.length / recentPerPage));
              const paginatedRecent = recentDonations.slice((recentCurrentPage - 1) * recentPerPage, recentCurrentPage * recentPerPage);
              return paginatedRecent.map((donation) => {
                const style = getStatusStyle(donation.status);
                return (
                  <div className="dash-recent-card" key={donation.id} 
                    onClick={() => navigate(`/ngo/donations/${donation.id}`)}
                    style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
                    padding: '16px 24px', backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE',
                    borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                      <div className="dash-recent-avatar" style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: donation.bg, color: donation.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>
                        {donation.initial}
                      </div>
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#2B1D14' }}>{donation.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#654B35' }}>
                          <Package size={14} /> {donation.items}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8C7A6B' }}>
                          <Calendar size={14} /> {donation.date}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ 
                        backgroundColor: style.bg, color: style.color, 
                        padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        </div>
                        {style.label}
                      </div>
                      <ChevronRight size={20} color="#8C7A6B" />
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Pagination Footer */}
          {!loading && recentDonations.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              marginTop: '12px',
              backgroundColor: '#FFFDF9',
              border: '1px solid #EAE5DE',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#654B35'
            }}>
              <span>
                Showing {recentDonations.length === 0 ? 0 : (recentCurrentPage - 1) * recentPerPage + 1} to {Math.min(recentCurrentPage * recentPerPage, recentDonations.length)} of {recentDonations.length} entries
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={recentCurrentPage <= 1}
                  onClick={() => setRecentCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    width: 32, height: 32, borderRadius: '8px',
                    border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: recentCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: recentCurrentPage <= 1 ? 0.4 : 1,
                    color: '#654B35'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                {(() => {
                  const totalRecentPages = Math.max(1, Math.ceil(recentDonations.length / recentPerPage));
                  const maxVisible = 3;
                  const startPage = Math.floor((recentCurrentPage - 1) / maxVisible) * maxVisible + 1;
                  const endPage = Math.min(startPage + maxVisible - 1, totalRecentPages);
                  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

                  return visiblePages.map(page => (
                    <button
                      key={page}
                      onClick={() => setRecentCurrentPage(page)}
                      style={{
                        width: 32, height: 32, borderRadius: '8px',
                        border: page === recentCurrentPage ? 'none' : '1px solid #EAE5DE',
                        backgroundColor: page === recentCurrentPage ? '#C4622D' : '#FFFFFF',
                        color: page === recentCurrentPage ? '#FFFFFF' : '#654B35',
                        fontWeight: page === recentCurrentPage ? 700 : 500,
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
                  disabled={recentCurrentPage >= Math.max(1, Math.ceil(recentDonations.length / recentPerPage))}
                  onClick={() => setRecentCurrentPage(p => Math.min(Math.ceil(recentDonations.length / recentPerPage), p + 1))}
                  style={{
                    width: 32, height: 32, borderRadius: '8px',
                    border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: recentCurrentPage >= Math.max(1, Math.ceil(recentDonations.length / recentPerPage)) ? 'not-allowed' : 'pointer',
                    opacity: recentCurrentPage >= Math.max(1, Math.ceil(recentDonations.length / recentPerPage)) ? 0.4 : 1,
                    color: '#654B35'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions & Banner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="dash-qa-container" style={{ backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: '#2B1D14' }}>{t('ngo.quickActions', 'Quick Actions')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              
              <button 
                onClick={() => navigate('/ngo/demands/add')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid #EAE5DE', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, color: '#2B1D14' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlusCircle size={16} /></div>
                  {t('ngo.createNewDemand', 'Create New Demand')}
                </div>
                <ChevronRight size={16} color="#8C7A6B" />
              </button>

              <button 
                onClick={() => navigate('/ngo/inventory')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid #EAE5DE', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, color: '#2B1D14' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} /></div>
                  {t('ngo.manageInventory', 'Manage Inventory')}
                </div>
                <ChevronRight size={16} color="#8C7A6B" />
              </button>

              <button 
                onClick={() => navigate('/ngo/donors')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid #EAE5DE', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, color: '#2B1D14' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} /></div>
                  {t('ngo.viewDonors', 'View Donors')}
                </div>
                <ChevronRight size={16} color="#8C7A6B" />
              </button>

              <button 
                onClick={() => navigate('/ngo/reports')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, color: '#2B1D14' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={16} /></div>
                  {t('ngo.generateReport', 'Generate Report')}
                </div>
                <ChevronRight size={16} color="#8C7A6B" />
              </button>

            </div>
          </div>

          <div className="dash-bottom-card" style={{ backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '16px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '24px', fontFamily: 'Fraunces, serif', fontStyle: 'italic', margin: '0 0 16px 0', color: '#2B1D14', whiteSpace: 'pre-line' }}>
              {t('ngo.togetherKinder', 'Together for a Kinder Tomorrow. ♡')}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#654B35', zIndex: 2, whiteSpace: 'pre-line' }}>
              {t('ngo.workCreatesImpact', 'Your work creates real impact in communities.')}
            </p>
            <div style={{ position: 'absolute', bottom: -10, right: -10, color: '#FDF1EB', zIndex: 1 }}>
               <Heart size={120} fill="#FDF1EB" stroke="none" />
            </div>
            {/* Adding the hands holding heart as requested */}
            <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
              <div style={{ color: '#C4622D', marginBottom: '-8px' }}><Heart size={24} fill="currentColor" /></div>
              <div style={{ color: '#2F7A4F' }}><Leaf size={48} fill="currentColor" /></div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}


