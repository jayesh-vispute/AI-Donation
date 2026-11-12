import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, CheckCircle2, Clock, XCircle, Search, UserPlus,
  ChevronDown, ChevronLeft, ChevronRight, ArrowUp, Minus,
  Eye, MoreVertical, MapPin, Mail, Phone, RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function NgoManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [sortBy, setSortBy] = useState('Newest First');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        setLoading(true);
        const res = await api.getAdminNgos();
        const mapped = (res || []).map((n, idx) => ({
          id: n.id || idx + 1,
          name: n.organization_name || t('common.unknownNgo', 'Unknown NGO'),
          description: n.description || 'Support. Share. Empower.',
          ngoId: `NGO-${String(n.id || idx + 1).padStart(3, '0')}`,
          email: n.email || '',
          phone: n.phone || '',
          city: n.city || '',
          state: n.state || '',
          status: (n.verification_status || 'pending').toLowerCase(),
          activeDemands: 0, // will be enriched if available
          joinDate: n.created_at
            ? new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A',
          joinDaysAgo: n.created_at
            ? Math.floor((Date.now() - new Date(n.created_at).getTime()) / 86400000)
            : 0,
          logoUrl: n.logo_url || null,
        }));
        setNgos(mapped);
      } catch (err) {
        console.error('Failed to fetch NGOs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNgos();
  }, []);

  // Stats from real data
  const totalNgos = ngos.length;
  const verifiedCount = ngos.filter(n => n.status === 'approved' || n.status === 'verified').length;
  const pendingCount = ngos.filter(n => n.status === 'pending').length;
  const rejectedCount = ngos.filter(n => n.status === 'rejected').length;

  // Growth badge helper
  const growthBadge = (count) => {
    if (count === 0) return (
      <span style={{
        backgroundColor: '#F4F1EC', color: '#8A7F72', fontSize: '11px', fontWeight: 600,
        padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '2px'
      }}>
        <Minus size={10} strokeWidth={2.5} /> 0%
      </span>
    );
    return (
      <span style={{
        backgroundColor: '#E8F8F0', color: '#2F7A4F', fontSize: '11px', fontWeight: 600,
        padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '2px'
      }}>
        <ArrowUp size={10} strokeWidth={2.5} /> +100%
      </span>
    );
  };

  // Filters
  const filtered = ngos.filter(n => {
    if (filterStatus !== 'All') {
      const fs = filterStatus.toLowerCase();
      if (fs === 'verified' && n.status !== 'approved' && n.status !== 'verified') return false;
      if (fs === 'pending' && n.status !== 'pending') return false;
      if (fs === 'rejected' && n.status !== 'rejected') return false;
    }
    if (filterLocation !== 'All' && n.city !== filterLocation && n.state !== filterLocation) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !n.name.toLowerCase().includes(q) &&
        !n.email.toLowerCase().includes(q) &&
        !n.city.toLowerCase().includes(q) &&
        !n.state.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'Newest First') return b.id - a.id;
    if (sortBy === 'Oldest First') return a.id - b.id;
    if (sortBy === 'Name A-Z') return a.name.localeCompare(b.name);
    return 0;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Unique locations for filter
  const locations = [...new Set(ngos.map(n => n.city).filter(Boolean))];

  // Status display
  const getStatusDisplay = (status) => {
    const normalized = status === 'approved' ? 'verified' : status;
    const config = {
      verified: { color: '#2F7A4F', bg: '#E8F8F0', label: 'Approved', sub: 'Verified NGO' },
      pending: { color: '#C4622D', bg: '#FFEFE7', label: 'Pending', sub: 'Under review' },
      rejected: { color: '#D14343', bg: '#FDECEA', label: 'Rejected', sub: 'Not approved' },
    };
    const c = config[normalized] || config.pending;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', backgroundColor: c.color, display: 'inline-block'
        }}></span>
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: c.color }}>{c.label}</div>
          <div style={{ fontSize: '10.5px', color: '#8A7F72' }}>{c.sub}</div>
        </div>
      </div>
    );
  };

  // NGO avatar/logo
  const getNgoAvatar = (ngo) => {
    const initial = ngo.name?.[0]?.toUpperCase() || 'N';
    const isPending = ngo.status === 'pending';
    return (
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        backgroundColor: isPending ? '#FFEFE7' : '#E8F8F0',
        color: isPending ? '#C4622D' : '#2F7A4F',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '16px', flexShrink: 0
      }}>
        {initial}
      </div>
    );
  };

  // Select dropdown shared style
  const selectStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2DCD5',
    borderRadius: '8px',
    padding: '8px 32px 8px 12px',
    fontSize: '13px',
    color: '#1C1611',
    fontWeight: 500,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23776E65' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    minWidth: '120px'
  };

  const resetFilters = () => {
    setFilterStatus('All');
    setFilterLocation('All');
    setSortBy('Newest First');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div style={{ maxWidth: 1480, margin: '0 auto', width: '100%' }}>

      {/* ===== Page Header ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.admin', 'Admin'), to: '/admin' },
            { label: t('navigation.ngos', 'Verified NGOs') }
          ]} />
          <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 700, color: '#1C1611', margin: '0 0 6px 0' }}>
            {t('admin.ngosTitle', 'NGOs')}
          </h1>
          <p style={{ fontSize: '14px', color: '#8A7F72', margin: 0 }}>
            {t('admin.ngosDesc', 'Manage and verify NGO partners. Review applications, monitor demands and track their contribution.')}
          </p>
        </div>
        <button
          onClick={() => {}}
          style={{
            backgroundColor: '#C4622D',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(196, 98, 45, 0.3)',
            transition: 'background-color 0.15s ease',
            wordBreak: 'break-word'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A85022'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C4622D'}
        >
          <UserPlus size={15} /> {t('actions.addNgo', 'Add NGO')}
        </button>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="admin-metrics-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total NGOs */}
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #ECE7E1',
          padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', backgroundColor: '#E8F8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Building2 size={22} color="#2F7A4F" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#1C1611' }}>{totalNgos}</span>
              {growthBadge(totalNgos)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#221D17' }}>Total NGOs</div>
            <div style={{ fontSize: '11px', color: '#8A7F72' }}>All registered NGOs</div>
          </div>
        </div>

        {/* Verified NGOs */}
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #ECE7E1',
          padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', backgroundColor: '#E8F8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle2 size={22} color="#2F7A4F" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#1C1611' }}>{verifiedCount}</span>
              {growthBadge(verifiedCount)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#221D17' }}>{t('admin.verifiedNgos', 'Verified NGOs')}</div>
            <div style={{ fontSize: '11px', color: '#8A7F72' }}>Approved and active</div>
          </div>
        </div>

        {/* Pending NGOs */}
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #ECE7E1',
          padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FFEFE7',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Clock size={22} color="#C4622D" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#1C1611' }}>{pendingCount}</span>
              {growthBadge(pendingCount)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#221D17' }}>Pending NGOs</div>
            <div style={{ fontSize: '11px', color: '#8A7F72' }}>Awaiting verification</div>
          </div>
        </div>

        {/* Rejected NGOs */}
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #ECE7E1',
          padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FDECEA',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <XCircle size={22} color="#D14343" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#1C1611' }}>{rejectedCount}</span>
              {growthBadge(rejectedCount)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#221D17' }}>Rejected NGOs</div>
            <div style={{ fontSize: '11px', color: '#8A7F72' }}>Not approved</div>
          </div>
        </div>
      </div>

      {/* ===== Filters & Search Bar ===== */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #ECE7E1',
        padding: '16px 20px', marginBottom: '20px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        {/* Left: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A7F72', marginBottom: '4px' }}>Verification Status</div>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} style={selectStyle}>
              <option>All</option>
              <option>Verified</option>
              <option>Pending</option>
              <option>Rejected</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A7F72', marginBottom: '4px' }}>Location</div>
            <select value={filterLocation} onChange={e => { setFilterLocation(e.target.value); setCurrentPage(1); }} style={selectStyle}>
              <option>All</option>
              {locations.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A7F72', marginBottom: '4px' }}>Sort By</div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Right: Search + buttons */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF',
            border: '1px solid #E2DCD5', borderRadius: '8px', padding: '7px 12px',
            gap: '8px', width: '260px'
          }}>
            <Search size={15} color="#8A7F72" />
            <input
              type="text"
              placeholder={t('admin.searchNgos', 'Search NGOs by name, email, or location...')}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                border: 'none', outline: 'none', fontSize: '13px', color: '#1C1611',
                width: '100%', backgroundColor: 'transparent'
              }}
            />
          </div>
          <button
            onClick={() => {}}
            style={{
              backgroundColor: '#C4622D', color: '#FFFFFF', border: 'none', borderRadius: '8px',
              padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A85022'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C4622D'}
          >
            <Search size={14} /> Search
          </button>
          <button
            onClick={resetFilters}
            style={{
              backgroundColor: '#FFFFFF', color: '#1C1611', border: '1px solid #E2DCD5',
              borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F5F0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* ===== NGO Data Table ===== */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #ECE7E1',
        overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ECE7E1', backgroundColor: '#FAF8F5' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left', width: '40px' }}>#</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left' }}>NGO Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left' }}>Contact Info</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left' }}>Location</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left' }}>Active Demands</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left' }}>Joined On</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#8A7F72' }}>
                    Loading NGOs...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#8A7F72' }}>
                    No NGOs found matching your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((ngo, idx) => (
                  <tr
                    key={ngo.id}
                    style={{ borderBottom: '1px solid #F3EFEA', transition: 'background-color 0.12s ease' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAF8F5'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Row # */}
                    <td style={{ padding: '14px 16px', color: '#8A7F72', fontWeight: 600 }}>
                      {(currentPage - 1) * perPage + idx + 1}
                    </td>

                    {/* NGO Name: Avatar + Name + Description + NGO ID */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {getNgoAvatar(ngo)}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1611' }}>{ngo.name}</div>
                          <div style={{ fontSize: '11px', color: '#8A7F72', marginTop: '1px' }}>{ngo.description}</div>
                          <div style={{
                            fontSize: '10.5px', fontWeight: 600, color: '#C4622D',
                            backgroundColor: '#FFEFE7', padding: '1px 6px', borderRadius: '4px',
                            display: 'inline-block', marginTop: '3px'
                          }}>
                            {ngo.ngoId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td style={{ padding: '14px 16px' }}>
                      {ngo.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#554E45', marginBottom: '4px' }}>
                          <Mail size={13} color="#8A7F72" /> {ngo.email}
                        </div>
                      )}
                      {ngo.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#554E45' }}>
                          <Phone size={13} color="#8A7F72" /> {ngo.phone}
                        </div>
                      )}
                      {!ngo.email && !ngo.phone && (
                        <span style={{ fontSize: '12px', color: '#8A7F72' }}>N/A</span>
                      )}
                    </td>

                    {/* Location */}
                    <td style={{ padding: '14px 16px' }}>
                      {(ngo.city || ngo.state) ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12.5px', color: '#554E45' }}>
                          <MapPin size={14} color="#8A7F72" style={{ marginTop: 1, flexShrink: 0 }} />
                          <div>
                            <div>{ngo.city || ''}{ngo.city && ngo.state ? ',' : ''}</div>
                            <div style={{ color: '#8A7F72' }}>{ngo.state || ''}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#8A7F72' }}>N/A</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      {getStatusDisplay(ngo.status)}
                    </td>

                    {/* Active Demands */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1C1611' }}>{ngo.activeDemands}</div>
                      <div style={{ fontSize: '10.5px', color: '#8A7F72' }}>item requests</div>
                    </td>

                    {/* Joined On */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '12.5px', color: '#554E45' }}>{ngo.joinDate}</div>
                      <div style={{ fontSize: '10.5px', color: '#8A7F72', marginTop: '2px' }}>
                        {ngo.joinDaysAgo === 0 ? 'Today' : `${ngo.joinDaysAgo} day${ngo.joinDaysAgo !== 1 ? 's' : ''} ago`}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {ngo.status === 'pending' ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/ngo-approvals?id=${ngo.id}`); }}
                            style={{
                              backgroundColor: '#C4622D', color: '#FFFFFF', border: 'none',
                              borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A85022'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C4622D'}
                          >
                            Review
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/ngo-approvals?id=${ngo.id}`); }}
                            style={{
                              backgroundColor: '#FFFFFF', color: '#554E45', border: '1px solid #E2DCD5',
                              borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F5F0'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                          >
                            <Eye size={13} /> View
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); alert('More options coming soon'); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px', borderRadius: '6px', color: '#776E65',
                            transition: 'background-color 0.12s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F4EFEA'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===== Pagination Footer ===== */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
          padding: '14px 20px', borderTop: '1px solid #ECE7E1', fontSize: '13px', color: '#8A7F72'
        }}>
          <span>
            Showing {sorted.length === 0 ? 0 : (currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, sorted.length)} of {sorted.length} NGOs
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{
                width: 32, height: 32, borderRadius: '8px', border: '1px solid #E2DCD5',
                backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.4 : 1, color: '#776E65'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  width: 32, height: 32, borderRadius: '8px',
                  border: page === currentPage ? 'none' : '1px solid #E2DCD5',
                  backgroundColor: page === currentPage ? '#C4622D' : '#FFFFFF',
                  color: page === currentPage ? '#FFFFFF' : '#776E65',
                  fontWeight: page === currentPage ? 700 : 500, fontSize: '13px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{
                width: 32, height: 32, borderRadius: '8px', border: '1px solid #E2DCD5',
                backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.4 : 1, color: '#776E65'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


