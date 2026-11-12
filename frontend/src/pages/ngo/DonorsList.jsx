import React, { useState, useEffect } from 'react';
import { Users, Mail, ArrowRight, User, Package, Building2, Heart, Search, Filter, MoreVertical, MapPin, X, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { NgoEmptyState, NgoTableSkeleton } from '../../components/ngo/NgoStates';
import NgoButton from '../../components/ngo/NgoButton';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function DonorsList() {
  const { t } = useTranslation();
  const [donors, setDonors] = useState([]);
  const [stats, setStats] = useState({ total_donors: 0, individuals: 0, organizations: 0, total_donations: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters & State
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Details Modal
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [donorDetails, setDonorDetails] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchDonors();
  }, [activeTab, searchQuery]);

  const fetchStats = async () => {
    try {
      const res = await api.getNgoDonorStats();
      setStats(res || { total_donors: 0, individuals: 0, organizations: 0, total_donations: 0 });
    } catch (err) {
      console.error("Failed to fetch donor stats", err);
    }
  };

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTab !== 'All') {
        params.type = activeTab;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const res = await api.getNgoDonors(params);
      setDonors(res || []);
    } catch (err) {
      console.error("Failed to fetch donors", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (donor) => {
    setSelectedDonor(donor);
    setDetailsLoading(true);
    setDonorDetails(null);
    try {
      const res = await api.getNgoDonorDetails(donor.id);
      setDonorDetails(res);
    } catch (err) {
      console.error("Failed to fetch donor details", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedDonor(null);
    setDonorDetails(null);
  };

  const tabs = [
    t('ngo.donorsList.tabs.all', 'All'),
    t('ngo.donorsList.tabs.individuals', 'Individuals'),
    t('ngo.donorsList.tabs.organizations', 'Organizations'),
    t('ngo.donorsList.tabs.recent', 'Recent Donors')
  ];

  const getStatusStyle = (status) => {
    if (status === 'Active') return { bg: '#EBF4ED', text: '#2F7A4F' };
    if (status === 'Inactive') return { bg: '#FDF3F3', text: '#D14343' };
    return { bg: '#F4F2EE', text: '#654B35' };
  };
  
  const getTypeBadgeStyle = (type) => {
    if (type === 'Individual') return { bg: '#EEF2FF', text: '#4F46E5' };
    if (type === 'Organization') return { bg: '#F3E8FF', text: '#9333EA' };
    return { bg: '#F4F2EE', text: '#654B35' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ padding: '0 0 var(--space-6) 0', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 16px)', marginBottom: 'clamp(16px, 3vw, 24px)' }}>
        <div style={{ flex: '1 1 min-content' }}>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.ngo', 'NGO'), to: '/ngo' },
            { label: t('navigation.donors', 'Donors') }
          ]} />
          
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontFamily: 'Fraunces, serif', margin: '0 0 8px 0', color: '#2B1D14', fontWeight: 800 }}>
            {t('ngo.donorsList.title', 'Our Donors')}
          </h1>
          <p style={{ color: '#4A3D34', fontSize: '15px', margin: '0 0 8px 0' }}>
            {t('ngo.donorsList.description', 'People and organizations contributing to your cause.')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2F7A4F', fontSize: '13px', fontStyle: 'italic' }}>
            <Heart size={14} /> {t('ngo.donorsList.togetherQuote', 'Together, we create stronger communities.')}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="ngo-stats-row">
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: 'clamp(12px, 2vw, 20px)', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'flex-start', gap: 'clamp(8px, 2vw, 16px)' }}>
          <div style={{ width: 'clamp(32px, 8vw, 48px)', height: 'clamp(32px, 8vw, 48px)', borderRadius: '50%', backgroundColor: '#FDF1EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={24} color="#C4622D" />
          </div>
          <div>
            <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{stats.total_donors}</div>
            <div style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 600, color: '#2B1D14' }}>{t('ngo.donorsList.totalDonors', 'Total Donors')}</div>
            <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#8C7A6B' }}>{t('ngo.donorsList.matchedWithNgo', 'Matched with your NGO')}</div>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: 'clamp(12px, 2vw, 20px)', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'flex-start', gap: 'clamp(8px, 2vw, 16px)' }}>
          <div style={{ width: 'clamp(32px, 8vw, 48px)', height: 'clamp(32px, 8vw, 48px)', borderRadius: '50%', backgroundColor: '#EBF4ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={24} color="#2F7A4F" />
          </div>
          <div>
            <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{stats.individuals}</div>
            <div style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 600, color: '#2B1D14' }}>{t('ngo.donorsList.individuals', 'Individuals')}</div>
            <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#8C7A6B' }}>{t('ngo.donorsList.individualDonors', 'Individual donors')}</div>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: 'clamp(12px, 2vw, 20px)', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'flex-start', gap: 'clamp(8px, 2vw, 16px)' }}>
          <div style={{ width: 'clamp(32px, 8vw, 48px)', height: 'clamp(32px, 8vw, 48px)', borderRadius: '50%', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={24} color="#9333EA" />
          </div>
          <div>
            <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{stats.organizations}</div>
            <div style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 600, color: '#2B1D14' }}>{t('ngo.donorsList.organizations', 'Organizations')}</div>
            <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#8C7A6B' }}>{t('ngo.donorsList.organizationalDonors', 'Organizational donors')}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: 'clamp(12px, 2vw, 20px)', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'flex-start', gap: 'clamp(8px, 2vw, 16px)' }}>
          <div style={{ width: 'clamp(32px, 8vw, 48px)', height: 'clamp(32px, 8vw, 48px)', borderRadius: '50%', backgroundColor: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Heart size={24} color="#EAB308" />
          </div>
          <div>
            <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{stats.total_donations}</div>
            <div style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 600, color: '#2B1D14' }}>{t('ngo.donorsList.totalDonations', 'Total Donations')}</div>
            <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#8C7A6B' }}>{t('ngo.donorsList.matchedDonations', 'Matched donations')}</div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '100px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeTab === tab ? 'none' : '1px solid #EAE5DE',
                backgroundColor: activeTab === tab ? '#C4622D' : '#fff',
                color: activeTab === tab ? '#fff' : '#654B35',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flex: '1 1 auto', minWidth: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', flex: '1 1 auto', maxWidth: '300px', minWidth: '130px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8C7A6B' }} />
            <input 
              type="text" 
              placeholder={t('ngo.donorsList.searchPlaceholder', 'Search donors by name, email or location...')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <button style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #EAE5DE', color: '#2B1D14', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            <Filter size={16} /> {t('actions.filter', 'Filter')}
          </button>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <NgoTableSkeleton rows={5} />
      ) : donors.length === 0 ? (
        <NgoEmptyState 
          icon={Users}
          title={searchQuery ? t('ngo.donorsList.noMatchTitle', 'No matching donors found') : t('ngo.donorsList.noDonorsTitle', 'No donors yet')} 
          message={searchQuery ? t('ngo.donorsList.noMatchDesc', 'Try adjusting your search query or filters.') : t('ngo.donorsList.noDonorsDesc', 'Donors will appear here once they complete a donation matching your demands.')} 
        />
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #EAE5DE', overflow: 'hidden', boxShadow: '0 2px 4px rgba(43,29,20,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead style={{ backgroundColor: '#FAFAF9', borderBottom: '1px solid #EAE5DE' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('common.donor', 'Donor')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.donorsList.type', 'Type')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.donorsList.location', 'Location')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.donorsList.totalDonations', 'Total Donations')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.donorsList.lastDonation', 'Last Donation')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('common.status', 'Status')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>{t('actions.title', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {donors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((donor, idx) => {
                  const statusStyle = getStatusStyle(donor.status);
                  const typeStyle = getTypeBadgeStyle(donor.donor_type);
                  
                  return (
                    <tr key={donor.id || idx} style={{ borderBottom: '1px solid #F4F2EE', transition: 'background-color 150ms' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#EAE5DE', color: '#4A3D34', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                            {getInitials(donor.full_name || donor.name)}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{donor.full_name || donor.name}</div>
                            <div style={{ fontSize: '12px', color: '#8C7A6B' }}>{donor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ backgroundColor: typeStyle.bg, color: typeStyle.text, padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                          {donor.donor_type || 'Individual'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4A3D34', fontSize: '13px' }}>
                          <MapPin size={14} color="#8C7A6B" /> {donor.location || t('common.notAvailable', 'Not available')}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#2B1D14' }}>{donor.total_donations || 0} {t('ngo.donorsList.donationsText', 'donations')}</div>
                        <div style={{ fontSize: '12px', color: '#8C7A6B' }}>{donor.total_items || 0} {t('ngo.donorsList.itemsTotal', 'items total')}</div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: '#4A3D34' }}>
                        {formatDate(donor.last_donation)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                          {donor.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            onClick={() => handleViewDetails(donor)}
                            style={{ background: 'none', border: 'none', color: '#654B35', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EAE5DE'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="View Donor Details"
                          >
                            <User size={16} />
                          </button>
                          <button 
                            style={{ background: 'none', border: 'none', color: '#654B35', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EAE5DE'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="More Options"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && donors.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
          <div style={{ fontSize: '13px', color: '#654B35' }}>
            Showing {donors.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, donors.length)} of {donors.length} donors
          </div>
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
              const totalPages = Math.max(1, Math.ceil(donors.length / itemsPerPage));
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
              disabled={currentPage >= Math.max(1, Math.ceil(donors.length / itemsPerPage))}
              onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(donors.length / itemsPerPage)), p + 1))}
              style={{
                width: 32, height: 32, borderRadius: '8px',
                border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: currentPage >= Math.max(1, Math.ceil(donors.length / itemsPerPage)) ? 'not-allowed' : 'pointer',
                opacity: currentPage >= Math.max(1, Math.ceil(donors.length / itemsPerPage)) ? 0.4 : 1,
                color: '#654B35'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Details Slide-over / Modal */}
      {selectedDonor && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(43,29,20,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(2px)' }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#fff', height: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease-out' }}>
            
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #EAE5DE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAF9' }}>
              <div>
                <h2 style={{ fontSize: '20px', margin: '0 0 4px 0', color: '#2B1D14' }}>{t('ngo.donorsList.donorDetails', 'Donor Details')}</h2>
                <div style={{ fontSize: '13px', color: '#654B35' }}>{t('ngo.donorsList.donorDetailsDesc', 'Donation history & relationship')}</div>
              </div>
              <button 
                onClick={closeDetails}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#654B35', borderRadius: '50%' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EAE5DE'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {detailsLoading || !donorDetails ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ height: 100, backgroundColor: '#FAFAF9', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 200, backgroundColor: '#FAFAF9', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Profile Summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#EAE5DE', color: '#4A3D34', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700 }}>
                      {getInitials(donorDetails.full_name)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', margin: '0 0 4px 0', color: '#2B1D14' }}>{donorDetails.full_name}</h3>
                      <div style={{ fontSize: '14px', color: '#654B35', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Mail size={14} /> {donorDetails.email}
                      </div>
                      <div style={{ fontSize: '13px', color: '#8C7A6B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} /> {donorDetails.location}
                      </div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
                    <div style={{ backgroundColor: '#FAFAF9', padding: '16px', borderRadius: '8px', border: '1px solid #EAE5DE' }}>
                      <div style={{ fontSize: '12px', color: '#8C7A6B', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('ngo.donorsList.totalItemsDonated', 'Total Items Donated')}</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14' }}>{donorDetails.total_items}</div>
                    </div>
                    <div style={{ backgroundColor: '#FAFAF9', padding: '16px', borderRadius: '8px', border: '1px solid #EAE5DE' }}>
                      <div style={{ fontSize: '12px', color: '#8C7A6B', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{t('ngo.donorsList.matchedDonationsCard', 'Matched Donations')}</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14' }}>{donorDetails.total_donations}</div>
                    </div>
                  </div>

                  {/* Donation History */}
                  <div>
                    <h4 style={{ fontSize: '15px', color: '#2B1D14', margin: '0 0 16px 0', fontWeight: 700, borderBottom: '1px solid #EAE5DE', paddingBottom: '8px' }}>
                      {t('ngo.donorsList.donationHistory', 'Donation History')}
                    </h4>
                    
                    {donorDetails.donations && donorDetails.donations.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {donorDetails.donations.map((don, i) => (
                          <div key={don.id || i} style={{ border: '1px solid #EAE5DE', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14', marginBottom: '4px' }}>{don.title}</div>
                                <div style={{ fontSize: '12px', color: '#8C7A6B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Calendar size={12} /> {formatDate(don.donation_date)}
                                </div>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '100px', backgroundColor: '#EBF4ED', color: '#2F7A4F' }}>
                                {don.status}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px dashed #EAE5DE' }}>
                              <div style={{ fontSize: '13px', color: '#4A3D34' }}>
                                <span style={{ fontWeight: 600 }}>{don.items_count}</span> {t('ngo.donorsList.itemsTotalLower', 'items total')}
                              </div>
                              <div style={{ fontSize: '13px', color: '#4A3D34' }}>
                                <span style={{ fontWeight: 600, color: '#C4622D' }}>{don.matched_items_count}</span> {t('ngo.donorsList.itemsMatched', 'items matched')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px', color: '#8C7A6B', textAlign: 'center', padding: '24px' }}>
                        {t('ngo.donorsList.noHistory', 'No donation history available.')}
                      </div>
                    )}
                  </div>
                  
                </div>
              )}
            </div>
            
            <style>
              {`
                @keyframes slideIn {
                  from { transform: translateX(100%); }
                  to { transform: translateX(0); }
                }
              `}
            </style>
          </div>
        </div>
      )}

    </div>
  );
}


