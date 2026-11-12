import React, { useState, useEffect } from 'react';
import { 
  Package, Handshake, Truck, CheckCircle2, PackageCheck, 
  Search, RefreshCw, Eye, MoreVertical, ChevronLeft, 
  ChevronRight, ChevronDown, Calendar, Download, X, 
  User, Building2, MapPin, Clock, FileText, CheckCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

// Initial sample data matching screenshot exactly as fallback/demo
const SAMPLE_DONATIONS = [
  {
    id: 'DON-001',
    rawId: 1,
    donor: {
      name: 'Pallamala Sri sai teja',
      email: 'pallamalasrisaiteja14@gmail.com',
      avatarBg: '#FCE4EC',
      avatarColor: '#C2185B',
      initial: 'P'
    },
    ngo: {
      name: 'Helping Hands NGO',
      code: 'NGO-001',
      iconBg: '#E8F5E9',
      iconColor: '#2E7D32',
      iconType: 'leaf'
    },
    itemsSummary: '5 items',
    itemsDetail: 'Clothes, Books, Toys +2',
    date: 'Sep 13, 2026',
    time: '10:24 AM',
    status: 'Matched',
    rawStatus: 'matched',
    address: 'Hydershakote, Hyderabad, TS',
    items: [
      { name: 'Men Shirts', category: 'Clothing', quantity: 2, condition: 'Gently Used' },
      { name: 'Story Books', category: 'Books', quantity: 1, condition: 'New' },
      { name: 'Plastic Toys', category: 'Toys', quantity: 2, condition: 'Good' }
    ]
  },
  {
    id: 'DON-002',
    rawId: 2,
    donor: {
      name: 'Anita Sharma',
      email: 'anita@example.com',
      avatarBg: '#FFE0B2',
      avatarColor: '#E65100',
      initial: 'A'
    },
    ngo: {
      name: 'Care & Share Foundation',
      code: 'NGO-002',
      iconBg: '#EDE7F6',
      iconColor: '#512DA8',
      iconType: 'building'
    },
    itemsSummary: '3 items',
    itemsDetail: 'Food, Blankets, Essentials',
    date: 'Sep 12, 2026',
    time: '04:18 PM',
    status: 'Pickup Scheduled',
    rawStatus: 'pickup_scheduled',
    address: 'Banjara Hills, Hyderabad, TS',
    items: [
      { name: 'Rice Bags', category: 'Food', quantity: 1, condition: 'Sealed' },
      { name: 'Woolen Blankets', category: 'Essentials', quantity: 2, condition: 'New' }
    ]
  },
  {
    id: 'DON-003',
    rawId: 3,
    donor: {
      name: 'Ravi Kumar',
      email: 'ravi@example.com',
      avatarBg: '#E8EAF6',
      avatarColor: '#283593',
      initial: 'R'
    },
    ngo: {
      name: 'Green Earth Trust',
      code: 'NGO-003',
      iconBg: '#E8F5E9',
      iconColor: '#1B5E20',
      iconType: 'leaf'
    },
    itemsSummary: '2 items',
    itemsDetail: 'Books, Notebooks',
    date: 'Sep 11, 2026',
    time: '09:30 AM',
    status: 'Collected',
    rawStatus: 'collected',
    address: 'Jubilee Hills, Hyderabad, TS',
    items: [
      { name: 'School Textbooks', category: 'Books', quantity: 2, condition: 'Good' }
    ]
  },
  {
    id: 'DON-004',
    rawId: 4,
    donor: {
      name: 'Sneha Reddy',
      email: 'sneha@example.com',
      avatarBg: '#E1F5FE',
      avatarColor: '#0277BD',
      initial: 'S'
    },
    ngo: {
      name: 'Bright Future NGO',
      code: 'NGO-004',
      iconBg: '#E3F2FD',
      iconColor: '#1565C0',
      iconType: 'group'
    },
    itemsSummary: '4 items',
    itemsDetail: 'Clothes, Toys, Stationery',
    date: 'Sep 10, 2026',
    time: '01:45 PM',
    status: 'Delivered',
    rawStatus: 'delivered',
    address: 'Gachibowli, Hyderabad, TS',
    items: [
      { name: 'Kids Clothing', category: 'Clothing', quantity: 2, condition: 'Gently Used' },
      { name: 'Stationery Kit', category: 'Education', quantity: 2, condition: 'New' }
    ]
  },
  {
    id: 'DON-005',
    rawId: 5,
    donor: {
      name: 'Vikram Patel',
      email: 'vikram@example.com',
      avatarBg: '#E8F5E9',
      avatarColor: '#2E7D32',
      initial: 'V'
    },
    ngo: {
      name: 'Hope for All',
      code: 'NGO-005',
      iconBg: '#FCE4EC',
      iconColor: '#C2185B',
      iconType: 'heart'
    },
    itemsSummary: '1 item',
    itemsDetail: 'Wheelchair',
    date: 'Sep 9, 2026',
    time: '11:12 AM',
    status: 'Pending',
    rawStatus: 'pending',
    address: 'Madhapur, Hyderabad, TS',
    items: [
      { name: 'Foldable Wheelchair', category: 'Medical', quantity: 1, condition: 'Good' }
    ]
  }
];

export default function DonationMonitoring() {
  const { t } = useTranslation();
  const [donations, setDonations] = useState(SAMPLE_DONATIONS);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('All Time');
  const [filterDonor, setFilterDonor] = useState('All Donors');
  const [filterNgo, setFilterNgo] = useState('All NGOs');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Selected donation for details modal
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);

  useEffect(() => {
    fetchDonationsData();
  }, []);

  const fetchDonationsData = async () => {
    try {
      setLoading(true);
      const [resDonations, resUsers, resNgos] = await Promise.allSettled([
        api.getAdminDonations(),
        api.getAdminUsers(),
        api.getAdminNgos()
      ]);

      const fetchedDonations = resDonations.status === 'fulfilled' ? resDonations.value : [];
      const fetchedUsers = resUsers.status === 'fulfilled' ? resUsers.value : [];
      const fetchedNgos = resNgos.status === 'fulfilled' ? resNgos.value : [];

      const usersMap = {};
      (fetchedUsers || []).forEach(u => { usersMap[u.id] = u; });

      const ngosMap = {};
      (fetchedNgos || []).forEach(n => { ngosMap[n.id] = n; });

      if (fetchedDonations && fetchedDonations.length > 0) {
        const mapped = fetchedDonations.map((d, index) => {
          const donorUser = usersMap[d.donor_id] || {};
          const matchedNgo = ngosMap[d.ngo_id] || {};

          const donorName = donorUser.full_name || `Donor #${d.donor_id}`;
          const donorEmail = donorUser.email || 'donor@example.com';
          const initial = donorName.charAt(0).toUpperCase();

          const ngoName = matchedNgo.organization_name || (d.ngo_id ? `NGO #${d.ngo_id}` : 'Unmatched NGO');
          const ngoCode = d.ngo_id ? `NGO-${String(d.ngo_id).padStart(3, '0')}` : 'N/A';

          const itemsArr = d.items || [];
          const itemCount = itemsArr.reduce((acc, curr) => acc + (curr.quantity || 1), 0) || itemsArr.length || 1;
          const itemsSummaryText = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
          
          let itemsDetailText = itemsArr.map(i => i.item_name).slice(0, 3).join(', ');
          if (itemsArr.length > 3) {
            itemsDetailText += ` +${itemsArr.length - 3}`;
          }
          if (!itemsDetailText) itemsDetailText = 'General Items';

          const createdAtDate = d.created_at ? new Date(d.created_at) : new Date();
          const dateStr = createdAtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const timeStr = createdAtDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

          const statusFormatted = formatStatus(d.status || 'pending');

          // Palette assignment
          const bgColors = ['#FCE4EC', '#FFE0B2', '#E8EAF6', '#E1F5FE', '#E8F5E9'];
          const textColors = ['#C2185B', '#E65100', '#283593', '#0277BD', '#2E7D32'];
          const paletteIndex = index % bgColors.length;

          return {
            id: `DON-${String(d.id || index + 1).padStart(3, '0')}`,
            rawId: d.id,
            donor: {
              name: donorName,
              email: donorEmail,
              avatarBg: bgColors[paletteIndex],
              avatarColor: textColors[paletteIndex],
              initial: initial
            },
            ngo: {
              name: ngoName,
              code: ngoCode,
              iconBg: '#E8F5E9',
              iconColor: '#2E7D32',
              iconType: 'leaf'
            },
            itemsSummary: itemsSummaryText,
            itemsDetail: itemsDetailText,
            date: dateStr,
            time: timeStr,
            status: statusFormatted,
            rawStatus: (d.status || 'pending').toLowerCase(),
            address: d.pickup_address || d.address || 'Location provided upon match',
            pickup: d.pickup,
            history: d.status_history || [],
            items: itemsArr.length > 0 ? itemsArr.map(i => ({
              name: i.item_name,
              category: i.category || 'General',
              quantity: i.quantity || 1,
              condition: i.condition || 'Good'
            })) : [
              { name: 'Donated Essentials', category: 'General', quantity: itemCount, condition: 'Good' }
            ]
          };
        });

        setDonations(mapped);
      } else {
        setDonations([]);
      }
    } catch (err) {
      console.error("Failed to fetch admin donations", err);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  function formatStatus(st) {
    const s = (st || '').toUpperCase();
    if (['PACKAGING_NOTIFIED', 'PACKAGING_IN_PROGRESS', 'PACKED', 'SEALED'].includes(s)) return 'Packaging';
    if (s === 'AI_DETECTED') return 'AI Detected';
    if (s === 'PICKUP_SCHEDULED') return 'Pickup Scheduled';
    if (s === 'PICKUP_CONFIRMED') return 'Pickup Confirmed';
    if (s === 'COLLECTED') return 'Collected';
    if (s === 'DELIVERED') return 'Delivered';
    if (s === 'RECEIVED') return 'Received';
    if (s === 'MATCHED') return 'Matched';
    return 'Pending';
  }

  // Calculate Metrics dynamically
  const totalCount = donations.length;
  const matchedCount = donations.filter(d => d.status === 'Matched').length;
  const pickupCount = donations.filter(d => d.status === 'Pickup Scheduled').length;
  const collectedCount = donations.filter(d => d.status === 'Collected').length;
  const deliveredCount = donations.filter(d => d.status === 'Delivered').length;

  // Filter donations logic
  const filteredDonations = donations.filter(d => {
    // Status Filter
    if (filterStatus !== 'All' && d.status.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    // Donor Filter
    if (filterDonor !== 'All Donors' && d.donor.name !== filterDonor) {
      return false;
    }
    // NGO Filter
    if (filterNgo !== 'All NGOs' && d.ngo.name !== filterNgo) {
      return false;
    }
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = d.id.toLowerCase().includes(q);
      const matchDonor = d.donor.name.toLowerCase().includes(q) || d.donor.email.toLowerCase().includes(q);
      const matchNgo = d.ngo.name.toLowerCase().includes(q);
      const matchItems = d.itemsDetail.toLowerCase().includes(q) || d.itemsSummary.toLowerCase().includes(q);
      if (!matchId && !matchDonor && !matchNgo && !matchItems) return false;
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDonations.length / perPage) || 1;
  const paginatedDonations = filteredDonations.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilterStatus('All');
    setFilterDate('All Time');
    setFilterDonor('All Donors');
    setFilterNgo('All NGOs');
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Get status pill badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'AI Detected':
        return { bg: '#E8EAF6', color: '#283593', dot: '#3F51B5', label: 'AI Detected' };
      case 'Matched':
        return { bg: '#E8F5E9', color: '#2E7D32', dot: '#4CAF50', label: 'Matched' };
      case 'Packaging':
        return { bg: '#FFF3E0', color: '#E65100', dot: '#FF9800', label: 'Packaging' };
      case 'Pickup Scheduled':
        return { bg: '#E3F2FD', color: '#1565C0', dot: '#2196F3', label: 'Pickup Scheduled' };
      case 'Pickup Confirmed':
        return { bg: '#E1F5FE', color: '#0277BD', dot: '#03A9F4', label: 'Pickup Confirmed' };
      case 'Collected':
        return { bg: '#FFF8E1', color: '#F57F17', dot: '#FBC02D', label: 'Collected' };
      case 'Delivered':
        return { bg: '#F3E5F5', color: '#7B1FA2', dot: '#9C27B0', label: 'Delivered' };
      case 'Received':
        return { bg: '#F0FDF4', color: '#16A34A', dot: '#22C55E', label: 'Received' };
      default: // Pending
        return { bg: '#ECEFF1', color: '#546E7A', dot: '#78909C', label: 'Pending' };
    }
  };

  // Extract unique donors & NGOs for filter dropdowns
  const uniqueDonors = Array.from(new Set(donations.map(d => d.donor.name)));
  const uniqueNgos = Array.from(new Set(donations.map(d => d.ngo.name)));

  return (
    <div style={{ padding: '4px 0 24px 0', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.admin', 'Admin'), to: '/admin' },
            { label: t('navigation.donations', 'Donations') }
          ]} />
          <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 700, color: '#111827', margin: 0 }}>
            {t('admin.donationsTitle', 'Donations Monitoring')}
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
            {t('admin.donationsDesc', 'Track and manage all donations in the platform. View status, matching, pickup and delivery progress.')}
          </p>
        </div>

        <button 
          onClick={() => {
            const csvData = donations.map(d => `${d.id},${d.donor.name},${d.ngo.name},${d.itemsSummary},${d.date},${d.status}`).join('\n');
            const blob = new Blob([`ID,Donor,NGO,Items,Date,Status\n${csvData}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Donations_Export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}
          style={{
            backgroundColor: '#D9531E',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'background-color 150ms'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C2410C'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D9531E'}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
          <Download size={16} />
          Export
        </button>
      </div>

      {/* 5 STAT METRICS CARDS GRID */}
      <div className="admin-metrics-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Donations */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#FFF3EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D9531E',
            flexShrink: 0
          }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '4px' }}>
              {t('admin.totalDonations', 'Total Donations')}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              All time donations
            </div>
          </div>
        </div>

        {/* Card 2: Matched Donations */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#E8F5E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2E7D32',
            flexShrink: 0
          }}>
            <Handshake size={22} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
              {matchedCount}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '4px' }}>
              {t('admin.matchedDonations', 'Matched Donations')}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              With NGOs
            </div>
          </div>
        </div>

        {/* Card 3: Pickup Scheduled */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#FFF8E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F59E0B',
            flexShrink: 0
          }}>
            <Truck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
              {pickupCount}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '4px' }}>
              {t('admin.pickupScheduled', 'Pickup Scheduled')}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              Awaiting collection
            </div>
          </div>
        </div>

        {/* Card 4: Collected Donations */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#F3E5F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8E24AA',
            flexShrink: 0
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
              {collectedCount}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '4px' }}>
              Collected Donations
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              Picked up by NGO
            </div>
          </div>
        </div>

        {/* Card 5: Delivered Donations */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#E3F2FD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1976D2',
            flexShrink: 0
          }}>
            <PackageCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
              {deliveredCount}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '4px' }}>
              Delivered Donations
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              Successfully delivered
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        {/* Left Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          {/* Status Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Status</label>
            <div style={{ position: 'relative' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  appearance: 'none',
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '8px 36px 8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#111827',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '130px'
                }}
              >
                <option value="All">All</option>
                <option value="Matched">Matched</option>
                <option value="Pickup Scheduled">Pickup Scheduled</option>
                <option value="Collected">Collected</option>
                <option value="Delivered">Delivered</option>
                <option value="Pending">Pending</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
            </div>
          </div>

          {/* Date Range Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Date Range</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '12px', color: '#6B7280', pointerEvents: 'none' }} />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  appearance: 'none',
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '8px 36px 8px 32px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#111827',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '130px'
                }}
              >
                <option value="All Time">All Time</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
            </div>
          </div>

          {/* Donor Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Donor</label>
            <div style={{ position: 'relative' }}>
              <select
                value={filterDonor}
                onChange={(e) => setFilterDonor(e.target.value)}
                style={{
                  appearance: 'none',
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '8px 36px 8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#111827',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '140px'
                }}
              >
                <option value="All Donors">All Donors</option>
                {uniqueDonors.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
            </div>
          </div>

          {/* NGO Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>NGO</label>
            <div style={{ position: 'relative' }}>
              <select
                value={filterNgo}
                onChange={(e) => setFilterNgo(e.target.value)}
                style={{
                  appearance: 'none',
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '8px 36px 8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#111827',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '140px'
                }}
              >
                <option value="All NGOs">All NGOs</option>
                {uniqueNgos.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
            </div>
          </div>
        </div>

        {/* Right Search Input & Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Search Input Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder={t('admin.searchDonationId', 'Search by donation ID, items...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                width: '100%',
                backgroundColor: '#ffffff',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '8px 12px 8px 36px',
                fontSize: '13px',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            style={{
              backgroundColor: '#D9531E',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={14} />
            Search
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            style={{
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#6B7280' }}>
            Loading donations monitoring data...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151', width: '40px' }}>#</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Donation ID</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Donor</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Matched NGO</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Items Summary</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Date</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Status</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDonations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                      No donations match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedDonations.map((row, idx) => {
                    const rowNumber = (currentPage - 1) * perPage + idx + 1;
                    const badge = getStatusBadge(row.status);

                    return (
                      <tr 
                        key={row.id} 
                        style={{ borderBottom: idx === paginatedDonations.length - 1 ? 'none' : '1px solid #F3F4F6' }}
                      >
                        {/* # Row Number */}
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                          {rowNumber}
                        </td>

                        {/* Donation ID */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', fontFamily: 'monospace, sans-serif' }}>
                            {row.id}
                          </span>
                        </td>

                        {/* Donor Column */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: row.donor.avatarBg,
                              color: row.donor.avatarColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                              flexShrink: 0
                            }}>
                              {row.donor.initial}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                                {row.donor.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>
                                {row.donor.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Matched NGO Column */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: row.ngo.iconBg,
                              color: row.ngo.iconColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {row.ngo.iconType === 'leaf' && <FileText size={14} />}
                              {row.ngo.iconType === 'building' && <Building2 size={14} />}
                              {row.ngo.iconType === 'group' && <User size={14} />}
                              {row.ngo.iconType === 'heart' && <FileText size={14} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                                {row.ngo.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>
                                {row.ngo.code}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Items Summary Column */}
                        <td style={{ padding: '14px 16px' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                              {row.itemsSummary}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>
                              {row.itemsDetail}
                            </div>
                          </div>
                        </td>

                        {/* Date Column */}
                        <td style={{ padding: '14px 16px' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                              {row.date}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>
                              {row.time}
                            </div>
                          </div>
                        </td>

                        {/* Status Column */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: badge.dot
                            }} />
                            {badge.label}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                            {/* View Details Eye Icon Button */}
                            <button
                              onClick={() => setSelectedDonation(row)}
                              title="View Details"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #E5E7EB',
                                backgroundColor: '#ffffff',
                                color: '#4B5563',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 150ms'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F3F4F6';
                                e.currentTarget.style.color = '#111827';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.color = '#4B5563';
                              }}
                            >
                              <Eye size={15} />
                            </button>

                            {/* More Options Button */}
                            <button
                              onClick={() => setActionMenuOpenId(actionMenuOpenId === row.id ? null : row.id)}
                              title="More Options"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #E5E7EB',
                                backgroundColor: '#ffffff',
                                color: '#4B5563',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 150ms'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F3F4F6';
                                e.currentTarget.style.color = '#111827';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.color = '#4B5563';
                              }}
                            >
                              <MoreVertical size={15} />
                            </button>

                            {/* Action Menu Popover */}
                            {actionMenuOpenId === row.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '38px',
                                width: '170px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                                zIndex: 30,
                                overflow: 'hidden'
                              }}>
                                <div
                                  onClick={() => {
                                    setSelectedDonation(row);
                                    setActionMenuOpenId(null);
                                  }}
                                  style={{ padding: '8px 12px', fontSize: '13px', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <Eye size={14} /> View Details
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff'
        }}>
          {/* Left Text */}
          <div style={{ fontSize: '13px', color: '#6B7280' }}>
            Showing <strong style={{ color: '#111827' }}>{filteredDonations.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong> to{' '}
            <strong style={{ color: '#111827' }}>{Math.min(currentPage * perPage, filteredDonations.length)}</strong> of{' '}
            <strong style={{ color: '#111827' }}>{filteredDonations.length}</strong> donations
          </div>

          {/* Right Page Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Prev Button */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#ffffff',
                color: currentPage === 1 ? '#9CA3AF' : '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: page === currentPage ? 'none' : '1px solid #E5E7EB',
                  backgroundColor: page === currentPage ? '#D9531E' : '#ffffff',
                  color: page === currentPage ? '#ffffff' : '#374151',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            ))}

            {/* Next Button */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#ffffff',
                color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* DONATION DETAILS MODAL */}
      {selectedDonation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #E5E7EB'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAF9F6'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Donation Details — {selectedDonation.id}
                  </h2>
                  <span style={{
                    backgroundColor: getStatusBadge(selectedDonation.status).bg,
                    color: getStatusBadge(selectedDonation.status).color,
                    padding: '2px 10px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {selectedDonation.status}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>
                  Created on {selectedDonation.date} at {selectedDonation.time}
                </p>
              </div>

              <button
                onClick={() => setSelectedDonation(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#ffffff',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Donor & NGO Details Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '16px' }}>
                {/* Donor Box */}
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '16px', border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Donor Information
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                    {selectedDonation.donor.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#4B5563', marginTop: '2px' }}>
                    {selectedDonation.donor.email}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {selectedDonation.address}
                  </div>
                </div>

                {/* NGO Box */}
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '16px', border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Matched NGO
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                    {selectedDonation.ngo.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#4B5563', marginTop: '2px' }}>
                    ID: {selectedDonation.ngo.code}
                  </div>
                  <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> NGO Verified & Active
                  </div>
                </div>
              </div>

              {/* Status History & Pickup Details Box */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '16px', border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Pickup Information
                  </div>
                  {selectedDonation.pickup ? (
                    <>
                      <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '4px' }}><strong>Status:</strong> {selectedDonation.pickup.status}</div>
                      <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '4px' }}><strong>Date:</strong> {new Date(selectedDonation.pickup.date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '13px', color: '#4B5563' }}><strong>Time Slot:</strong> {selectedDonation.pickup.time_slot}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#6B7280', fontStyle: 'italic' }}>Pickup not scheduled yet.</div>
                  )}
                </div>
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '16px', border: '1px solid #F3F4F6', maxHeight: '150px', overflowY: 'auto' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Status History
                  </div>
                  {selectedDonation.history && selectedDonation.history.length > 0 ? (
                    selectedDonation.history.map((h, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#4B5563', padding: '4px 0', borderBottom: i === selectedDonation.history.length - 1 ? 'none' : '1px solid #E5E7EB' }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{h.new_status}</span> - {new Date(h.created_at).toLocaleDateString()}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '13px', color: '#6B7280', fontStyle: 'italic' }}>No history recorded.</div>
                  )}
                  {selectedDonation.status === 'Received' && (
                    <div style={{ fontSize: '12px', color: '#16A34A', padding: '4px 0', fontWeight: 600 }}>
                      Donation Received by NGO.
                    </div>
                  )}
                </div>
              </div>

              {/* Items List Table */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
                  Items Included ({selectedDonation.items.length})
                </h3>
                <div className="table-responsive-wrapper" style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflowX: 'auto', maxWidth: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Item Name</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Category</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Qty</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Condition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDonation.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: i === selectedDonation.items.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>{item.name}</td>
                          <td style={{ padding: '10px 14px', color: '#6B7280' }}>{item.category}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>{item.quantity}</td>
                          <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 500 }}>{item.condition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              backgroundColor: '#F9FAFB',
              borderRadius: '0 0 16px 16px'
            }}>
              <button
                onClick={() => setSelectedDonation(null)}
                style={{
                  backgroundColor: '#D9531E',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

