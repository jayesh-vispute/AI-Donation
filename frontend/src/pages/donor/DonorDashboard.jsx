import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Camera, Search, ArrowRight, Package, CheckCircle, 
  Hourglass, Gift, ChevronRight, ChevronLeft, Leaf, HeartHandshake,
  ShieldCheck, Droplets, Heart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import './donor-theme.css';

export default function DonorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPage, setRecentPage] = useState(1);
  const recentPerPage = 4;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.getDonorDashboard();
        setData(res);
        setError(null);
      } catch (err) {
        setError(t('donor.errorDashboardLoad', "We couldn't load your dashboard data."));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getStatusDisplay = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'MATCHED': return { label: t('status.matched', 'Matched'), class: 'matched', bg: '#DCFCE7', color: '#16A34A' };
      case 'PACKAGING_NOTIFIED': return { label: t('status.packagingNotified', 'Packaging'), class: 'packaging', bg: '#FEF3C7', color: '#D97706' };
      case 'PICKUP_SCHEDULED': return { label: t('status.pickupScheduled', 'Pickup Scheduled'), class: 'pickup', bg: '#FEF3C7', color: '#D97706' };
      case 'COLLECTED': return { label: t('status.collected', 'Collected'), class: 'collected', bg: '#E0F2FE', color: '#0284C7' };
      case 'DELIVERED': return { label: t('status.delivered', 'Delivered'), class: 'delivered', bg: '#DCFCE7', color: '#16A34A' };
      case 'ACKNOWLEDGED': return { label: t('status.acknowledged', 'Acknowledged'), class: 'acknowledged', bg: '#DCFCE7', color: '#16A34A' };
      default: return { label: status, class: 'packaging', bg: '#F3F4F6', color: '#4B5563' };
    }
  };

  const StatCard = ({ icon: Icon, value, label, subtext, colorScheme }) => (
    <div className="donor-stat-item" style={{ '--stat-bg': colorScheme.bg, '--stat-color': colorScheme.color }}>
      <div className="donor-stat-icon-wrap">
        <Icon size={24} />
      </div>
      <div className="donor-stat-content">
        <div className="donor-stat-val">{value}</div>
        <div className="donor-stat-label">{label}</div>
        <div className="donor-stat-subtext">{subtext}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="donor-dashboard-wrap">
        <div className="skeleton" style={{ height: 180, borderRadius: 16, marginBottom: 24 }}></div>
        <div className="donor-stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="donor-stat-card skeleton" style={{ height: 90 }}></div>)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#2B1D14', paddingBottom: '40px', boxSizing: 'border-box', width: '100%' }}>
      
      {/* Hero Section */}
      <div className="donor-hero-section">
        
        {/* Left: Welcome Text */}
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.donor', 'Donor'), to: '/donor' },
            { label: t('navigation.dashboard', 'Dashboard') }
          ]} />
          <div style={{ fontSize: '15px', color: '#654B35', marginBottom: '4px', fontWeight: 500 }}>{t('donor.welcomeBack', 'Welcome back,')}</div>
          <h1 style={{ 
            fontSize: 'clamp(26px, 2.5vw, 36px)', 
            fontFamily: 'Fraunces, serif', 
            margin: '0 0 12px 0', 
            color: '#2B1D14', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            lineHeight: 1.2,
            wordBreak: 'break-word'
          }}>
            {user?.displayName || user?.email?.split('@')[0] || 'Donor'} <span style={{ fontSize: '28px', flexShrink: 0 }}>👋</span>
          </h1>
          <p style={{ color: '#4A3D34', fontSize: '15px', margin: '0 0 16px 0', lineHeight: 1.5, maxWidth: '440px' }}>
            {t('donor.dashboardSummaryPart1', "You've donated ")}
            <strong style={{ color: '#C4622D' }}>{data?.total_items || 0} {t('common.items', 'items')}</strong>
            {t('donor.dashboardSummaryPart2', " this year, successfully reaching ")}
            <strong style={{ color: '#C4622D' }}>{data?.ngos_reached || 0} {t('common.ngos', 'NGOs')}</strong>
            {t('donor.dashboardSummaryPart3', " in your community.")}
          </p>
          <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '18px', color: '#654B35', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t('donor.dashboardQuote', 'Kindness today, a brighter tomorrow.')} <Heart size={18} strokeWidth={2} style={{ color: '#C4622D' }} />
          </div>
        </div>

        {/* Center: Illustration Placeholder */}
        <div style={{ flex: '0 1 200px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '140px', minWidth: 0 }}>
          <div style={{ position: 'relative', width: '180px', height: '130px' }}>
            {/* Box Back */}
            <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: '80px', backgroundColor: '#D2A679', borderRadius: '4px' }}></div>
            {/* Items inside */}
            <div style={{ position: 'absolute', bottom: '45px', left: '20%', width: '48px', height: '65px', backgroundColor: '#6FA382', borderRadius: '4px', transform: 'rotate(-10deg)' }}></div>
            <div style={{ position: 'absolute', bottom: '55px', right: '20%', width: '40px', height: '55px', backgroundColor: '#C4622D', borderRadius: '50%', transform: 'rotate(15deg)' }}></div>
            <div style={{ position: 'absolute', bottom: '65px', left: '40%', width: '55px', height: '16px', backgroundColor: '#8064D8', borderRadius: '2px', transform: 'rotate(5deg)' }}></div>
            {/* Box Front */}
            <div style={{ position: 'absolute', bottom: 0, left: '5%', width: '90%', height: '65px', backgroundColor: '#E4C39F', borderRadius: '4px', border: '2px solid #D2A679', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#8B6A47', textAlign: 'center', lineHeight: 1.2 }}
                   dangerouslySetInnerHTML={{ __html: t('donor.boxWords', 'DONATE<br/>SHARE<br/>SUPPORT<br/>EMPOWER ♡') }}>
              </div>
            </div>
            <Leaf size={36} color="#2F7A4F" style={{ position: 'absolute', right: '-20px', top: '-10px', zIndex: 20, transform: 'rotate(45deg)' }} />
            <Leaf size={24} color="#6FA382" style={{ position: 'absolute', left: '-15px', top: '15px', zIndex: 5, transform: 'rotate(-30deg)' }} />
          </div>
        </div>

        {/* Right: Quote Badge */}
        <div style={{ flex: '0 1 200px', display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0 }}>
          <div style={{ backgroundColor: '#FDF1EB', borderRadius: '24px', padding: '16px 20px', textAlign: 'center', border: '1px solid #F8E3D8', width: '100%', maxWidth: '200px' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '15px', color: '#2B1D14', lineHeight: 1.3 }}>
              {t('donor.togetherQuote', 'Together we can create a kinder tomorrow.')} <Heart size={14} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', color: '#C4622D' }} />
            </div>
          </div>
        </div>

      </div>

      {/* Stats Row */}
      <div className="donor-stats-grid">
        <StatCard icon={Gift} value={data?.total_donations || 0} label={t('donor.totalDonations', 'Total Donations')} subtext={t('donor.itemsYouDonated', "Items you've donated")} colorScheme={{ bg: '#FDF1EB', color: '#C4622D' }} />
        <StatCard icon={Hourglass} value={data?.pending_pickups || 0} label={t('donor.pendingPickups', 'Pending Pickups')} subtext={t('donor.awaitingCollection', 'Awaiting collection')} colorScheme={{ bg: '#FFF8EB', color: '#B47B1A' }} />
        <StatCard icon={CheckCircle} value={data?.completed_donations || 0} label={t('donor.completed', 'Completed')} subtext={t('donor.successfullyDelivered', 'Successfully delivered')} colorScheme={{ bg: '#F0FDF4', color: '#16A34A' }} />
        <StatCard icon={Package} value={data?.total_items || 0} label={t('donor.itemsDonated', 'Items Donated')} subtext={t('donor.totalItemsShared', 'Total items shared')} colorScheme={{ bg: '#F3E8FF', color: '#8064D8' }} />
      </div>

      {/* Action Buttons Row */}
      <div className="donor-actions-grid">
        
        <Link to="/donate" className="donor-action-card donor-action-card-primary">
          <div className="donor-action-icon-wrap">
            <Camera size={24} />
          </div>
          <div className="donor-action-content">
            <div className="donor-action-title">{t('donor.donateItemTitle', 'Donate an Item')}</div>
            <div className="donor-action-sub">{t('donor.donateItemSub', 'Upload or detect items with AI')}</div>
          </div>
          <ArrowRight size={20} className="donor-action-arrow" />
        </Link>

        <Link to="/detect" className="donor-action-card donor-action-card-secondary">
          <div className="donor-action-icon-wrap">
            <Search size={24} />
          </div>
          <div className="donor-action-content">
            <div className="donor-action-title">{t('donor.aiUploadTitle', 'AI Detection Upload')}</div>
            <div className="donor-action-sub">{t('donor.aiUploadSub', 'Use AI to identify items')}</div>
          </div>
          <ArrowRight size={20} className="donor-action-arrow" />
        </Link>

        <Link to="/donations" className="donor-action-card donor-action-card-tertiary">
          <div className="donor-action-icon-wrap">
            <Package size={24} />
          </div>
          <div className="donor-action-content">
            <div className="donor-action-title">{t('donor.viewDonationsTitle', 'View My Donations')}</div>
            <div className="donor-action-sub">{t('donor.viewDonationsSub', 'Track your impact')}</div>
          </div>
          <ArrowRight size={20} className="donor-action-arrow" />
        </Link>

      </div>

      {/* Main Grid: Donations & Impact */}
      <div className="donor-main-grid">
        
        {/* Recent Donations */}
        <div style={{ backgroundColor: '#FFFDF9', borderRadius: '16px', border: '1px solid #EAE5DE', display: 'flex', flexDirection: 'column', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EAE5DE', flexShrink: 0, gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: 0, color: '#2B1D14', whiteSpace: 'nowrap' }}>{t('donor.recentDonations', 'Recent Donations')}</h2>
            <Link to="/donations" style={{ fontSize: '14px', fontWeight: 700, color: '#C4622D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {t('donor.viewAll', 'View All')} <ArrowRight size={14} style={{ flexShrink: 0 }} />
            </Link>
          </div>
          <div className="recent-donations-scroll" style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {(!data?.recent_donations || data.recent_donations.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px 0' }}>
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <Package size={48} color="#C4622D" strokeWidth={1.5} />
                  {/* Decorative spark lines around the box */}
                  <div style={{ position: 'absolute', top: -10, left: -10, width: 6, height: 2, backgroundColor: '#C4622D', transform: 'rotate(-45deg)', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', top: -16, left: 20, width: 2, height: 6, backgroundColor: '#C4622D', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', top: -10, right: -10, width: 6, height: 2, backgroundColor: '#C4622D', transform: 'rotate(45deg)', borderRadius: 2 }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#2B1D14', margin: '0 0 8px 0' }}>{t('donor.noDonationsYet', 'No donations yet')}</h3>
                <p style={{ fontSize: '15px', color: '#654B35', margin: '0 0 24px 0', textAlign: 'center', maxWidth: '300px', lineHeight: 1.5 }}>
                  {t('donor.noDonationsDesc', "Start by donating items to make a difference in someone's life.")}
                </p>
                <Link to="/donate" style={{ 
                  backgroundColor: '#C4622D', color: '#fff', padding: '12px 24px', borderRadius: '8px', 
                  textDecoration: 'none', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' 
                }}>
                  {t('donor.donateItemTitle', 'Donate an Item')} <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.recent_donations.slice((recentPage - 1) * recentPerPage, recentPage * recentPerPage).map((d) => {
                  const status = getStatusDisplay(d.status);
                  let itemsStr = t('common.items', "Items");
                  if (d.items && d.items.length > 0) {
                    itemsStr = typeof d.items[0] === 'string' 
                      ? d.items.join(', ') 
                      : d.items.map(i => `${i.item_name || i.name || i.title || i.itemType || t('common.item', 'Item')} × ${i.quantity || 1}`).join(', ');
                  }
                  
                  return (
                    <div key={d.id} onClick={() => navigate(`/donations/${d.id}`)} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '12px',
                      padding: '14px 16px', border: '1px solid #EAE5DE', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#FFFFFF',
                      transition: 'all 0.15s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#FDF1EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4622D', flexShrink: 0 }}>
                          <Package size={22} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#2B1D14', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{itemsStr}</div>
                          <div style={{ fontSize: '12px', color: '#8C7A6B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t('donor.toNGO', 'To {{ngo}}', { ngo: d.ngo_name || t('donor.matchedNgo', 'Matched NGO') })} • {new Date(d.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <div style={{ 
                          backgroundColor: status.bg, color: status.color, padding: '5px 10px', 
                          borderRadius: '100px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
                        }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} />
                          {status.label}
                        </div>
                        <ChevronRight size={18} color="#8C7A6B" style={{ flexShrink: 0 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {data?.recent_donations && data.recent_donations.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              borderTop: '1px solid #EAE5DE',
              fontSize: '13px',
              color: '#654B35'
            }}>
              <span>
                Showing {(recentPage - 1) * recentPerPage + 1} to {Math.min(recentPage * recentPerPage, data.recent_donations.length)} of {data.recent_donations.length} entries
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={recentPage <= 1}
                  onClick={() => setRecentPage(p => Math.max(1, p - 1))}
                  style={{
                    width: 32, height: 32, borderRadius: '8px',
                    border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: recentPage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: recentPage <= 1 ? 0.4 : 1,
                    color: '#654B35'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                {(() => {
                  const totalRecentPages = Math.max(1, Math.ceil(data.recent_donations.length / recentPerPage));
                  const maxVisible = 3;
                  const startPage = Math.floor((recentPage - 1) / maxVisible) * maxVisible + 1;
                  const endPage = Math.min(startPage + maxVisible - 1, totalRecentPages);
                  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

                  return visiblePages.map(page => (
                    <button
                      key={page}
                      onClick={() => setRecentPage(page)}
                      style={{
                        width: 32, height: 32, borderRadius: '8px',
                        border: page === recentPage ? 'none' : '1px solid #EAE5DE',
                        backgroundColor: page === recentPage ? '#C4622D' : '#FFFFFF',
                        color: page === recentPage ? '#FFFFFF' : '#654B35',
                        fontWeight: page === recentPage ? 700 : 500,
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
                  disabled={recentPage >= Math.max(1, Math.ceil(data.recent_donations.length / recentPerPage))}
                  onClick={() => setRecentPage(p => Math.min(Math.ceil(data.recent_donations.length / recentPerPage), p + 1))}
                  style={{
                    width: 32, height: 32, borderRadius: '8px',
                    border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: recentPage >= Math.max(1, Math.ceil(data.recent_donations.length / recentPerPage)) ? 'not-allowed' : 'pointer',
                    opacity: recentPage >= Math.max(1, Math.ceil(data.recent_donations.length / recentPerPage)) ? 0.4 : 1,
                    color: '#654B35'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Your Impact */}
        <div style={{ 
          backgroundColor: '#EBF4ED', borderRadius: '16px', padding: '32px 24px', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          position: 'relative', overflow: 'hidden', minWidth: 0, height: '460px', boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2F7A4F', fontWeight: 700, fontSize: '16px', marginBottom: '20px', zIndex: 2 }}>
            <Leaf size={20} /> {t('donor.yourImpact', 'Your Impact')}
          </div>
          <h3 style={{ fontSize: '26px', fontFamily: 'Fraunces, serif', fontWeight: 600, color: '#2B1D14', margin: '0 0 20px 0', lineHeight: 1.3, zIndex: 2 }}
              dangerouslySetInnerHTML={{ __html: t('donor.impactQuote', '"Every donation<br/>creates a ripple<br/>of change."') }}>
          </h3>
          <p style={{ fontSize: '14px', color: '#4A3D34', margin: 0, zIndex: 2, maxWidth: '240px', lineHeight: 1.5 }}>
            {t('donor.impactSub', 'Thank you for being part of a kinder, stronger community.')}
          </p>
          
          {/* Bottom decorative elements */}
          <div style={{ position: 'absolute', bottom: -20, right: -20, zIndex: 1, pointerEvents: 'none' }}>
            <Leaf size={120} color="#C4DECD" fill="#C4DECD" />
          </div>
          <div style={{ position: 'absolute', bottom: -10, left: -20, zIndex: 1, transform: 'rotate(-45deg)', pointerEvents: 'none' }}>
            <Leaf size={80} color="#C4DECD" fill="#C4DECD" />
          </div>
          <div style={{ position: 'absolute', bottom: 30, right: 80, zIndex: 2, pointerEvents: 'none' }}>
            <Heart size={32} color="#C4622D" fill="#C4622D" />
          </div>
        </div>

      </div>

      {/* Footer Strip */}
      <div style={{ 
        marginTop: '32px', backgroundColor: '#FDF9F6', border: '1px solid #F5EAE1', borderRadius: '12px',
        padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center',
        boxSizing: 'border-box', width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#654B35', fontSize: '14px', fontWeight: 500 }}>
          <Leaf size={20} color="#2F7A4F" fill="#2F7A4F" />
          {t('donor.footerMessage', 'Small actions lead to big impacts. Keep making a difference!')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#8C7A6B', fontSize: '13px', fontWeight: 500 }}>
          <span dangerouslySetInnerHTML={{ __html: t('donor.footerDonate', 'Donate') + ' <Heart size="12" style="display:inline" />' }} />
          <span dangerouslySetInnerHTML={{ __html: t('donor.footerShare', 'Share') + ' <Heart size="12" style="display:inline" />' }} />
          <span dangerouslySetInnerHTML={{ __html: t('donor.footerSupport', 'Support') + ' <Heart size="12" style="display:inline" />' }} />
          <span>{t('donor.footerEmpower', 'Empower')}</span>
        </div>
      </div>

    </div>
  );
}
