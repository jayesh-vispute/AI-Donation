import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, Users, Database, ArrowUp, 
  Calendar, Search, RefreshCw, Download, ChevronLeft, 
  ChevronRight, ChevronDown, Building2, User, Package, 
  Truck, Target, Eye, MoreVertical, CheckCircle2, XCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

const SAMPLE_AUDIT_LOGS = [
  {
    id: 1,
    timestamp: 'Sep 13, 2026 05:09:33 AM',
    actor: {
      name: 'Sri Sai teja',
      role: 'System Operator',
      initial: 'S',
      bg: '#111827',
      color: '#ffffff'
    },
    action: 'APPROVE',
    actionBg: '#DCFCE7',
    actionColor: '#16A34A',
    targetEntity: 'NGO Profile',
    entityType: 'ngo',
    entityId: '2',
    details: 'Approved NGO Demo NGO Foundation',
    ipAddress: '192.168.1.1',
    status: 'Success',
    statusBg: '#DCFCE7',
    statusColor: '#16A34A',
    statusDot: '#16A34A'
  },
  {
    id: 2,
    timestamp: 'Sep 12, 2026 11:22:18 PM',
    actor: {
      name: 'Sri Sai teja',
      role: 'System Operator',
      initial: 'S',
      bg: '#111827',
      color: '#ffffff'
    },
    action: 'UPDATE',
    actionBg: '#DBEAFE',
    actionColor: '#2563EB',
    targetEntity: 'User',
    entityType: 'user',
    entityId: '6',
    details: 'Updated user status to Active',
    ipAddress: '192.168.1.1',
    status: 'Success',
    statusBg: '#DCFCE7',
    statusColor: '#16A34A',
    statusDot: '#16A34A'
  },
  {
    id: 3,
    timestamp: 'Sep 12, 2026 04:18:45 PM',
    actor: {
      name: 'Anita Sharma',
      role: 'Donor',
      initial: 'A',
      bg: '#FFE0B2',
      color: '#E65100'
    },
    action: 'CREATE',
    actionBg: '#F3E8FF',
    actionColor: '#9333EA',
    targetEntity: 'Donation',
    entityType: 'donation',
    entityId: '18',
    details: 'Created new donation (Books, Clothes)',
    ipAddress: '192.168.1.5',
    status: 'Success',
    statusBg: '#DCFCE7',
    statusColor: '#16A34A',
    statusDot: '#16A34A'
  },
  {
    id: 4,
    timestamp: 'Sep 11, 2026 01:35:10 PM',
    actor: {
      name: 'Ravi Kumar',
      role: 'NGO',
      initial: 'R',
      bg: '#EDE7F6',
      color: '#512DA8'
    },
    action: 'UPDATE',
    actionBg: '#FEF3C7',
    actionColor: '#D97706',
    targetEntity: 'Pickup',
    entityType: 'pickup',
    entityId: '7',
    details: 'Updated pickup status to Collected',
    ipAddress: '192.168.1.8',
    status: 'Success',
    statusBg: '#DCFCE7',
    statusColor: '#16A34A',
    statusDot: '#16A34A'
  },
  {
    id: 5,
    timestamp: 'Sep 11, 2026 10:12:03 AM',
    actor: {
      name: 'Sri Sai teja',
      role: 'System Operator',
      initial: 'S',
      bg: '#111827',
      color: '#ffffff'
    },
    action: 'DELETE',
    actionBg: '#FEE2E2',
    actionColor: '#DC2626',
    targetEntity: 'User',
    entityType: 'user',
    entityId: '9',
    details: 'Deleted inactive user',
    ipAddress: '192.168.1.1',
    status: 'Failed',
    statusBg: '#FEE2E2',
    statusColor: '#DC2626',
    statusDot: '#DC2626'
  },
  {
    id: 6,
    timestamp: 'Sep 10, 2026 09:45:27 PM',
    actor: {
      name: 'NGO Staff',
      role: 'NGO',
      initial: 'N',
      bg: '#E8F5E9',
      color: '#2E7D32'
    },
    action: 'CREATE',
    actionBg: '#F3E8FF',
    actionColor: '#9333EA',
    targetEntity: 'Inventory',
    entityType: 'inventory',
    entityId: '25',
    details: 'Added 50 items to inventory',
    ipAddress: '192.168.1.7',
    status: 'Success',
    statusBg: '#DCFCE7',
    statusColor: '#16A34A',
    statusDot: '#16A34A'
  },
  {
    id: 7,
    timestamp: 'Sep 10, 2026 06:30:12 PM',
    actor: {
      name: 'Sri Sai teja',
      role: 'System Operator',
      initial: 'S',
      bg: '#111827',
      color: '#ffffff'
    },
    action: 'UPDATE',
    actionBg: '#DBEAFE',
    actionColor: '#2563EB',
    targetEntity: 'AI Detection',
    entityType: 'ai',
    entityId: '85',
    details: 'Updated detection confidence (72%)',
    ipAddress: '192.168.1.1',
    status: 'Success',
    statusBg: '#DCFCE7',
    statusColor: '#16A34A',
    statusDot: '#16A34A'
  }
];

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState(SAMPLE_AUDIT_LOGS);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filterAction, setFilterAction] = useState('All');
  const [filterActor, setFilterActor] = useState('All Users');
  const [filterEntity, setFilterEntity] = useState('All Entities');
  const [filterDateRange, setFilterDateRange] = useState('Sep 1, 2026 - Sep 30, 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchAuditLogsData();
  }, []);

  const fetchAuditLogsData = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      if (res && res.length > 0) {
        const mapped = res.map((log, index) => {
          const act = (log.action || 'UPDATE').toUpperCase();
          let actBg = '#DBEAFE';
          let actColor = '#2563EB';

          if (act.includes('APPROVE')) { actBg = '#DCFCE7'; actColor = '#16A34A'; }
          else if (act.includes('CREATE')) { actBg = '#F3E8FF'; actColor = '#9333EA'; }
          else if (act.includes('DELETE')) { actBg = '#FEE2E2'; actColor = '#DC2626'; }

          const createdDate = log.created_at ? new Date(log.created_at) : new Date();
          const timestampStr = createdDate.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
          });

          return {
            id: log.id || index + 1,
            timestamp: timestampStr,
            actor: {
              name: log.user ? log.user.full_name : (log.user_id ? `User #${log.user_id}` : 'Sri Sai teja'),
              role: log.user ? (log.user.role || 'Admin') : 'System Operator',
              initial: log.user && log.user.full_name ? log.user.full_name.charAt(0).toUpperCase() : 'S',
              bg: '#111827',
              color: '#ffffff'
            },
            action: act,
            actionBg: actBg,
            actionColor: actColor,
            targetEntity: log.entity_type || log.module || 'System',
            entityType: (log.entity_type || 'system').toLowerCase(),
            entityId: String(log.entity_id || log.id || '-'),
            details: log.description || `Executed ${act} on ${log.entity_type || 'entity'}`,
            ipAddress: '192.168.1.1',
            status: 'Success',
            statusBg: '#DCFCE7',
            statusColor: '#16A34A',
            statusDot: '#16A34A'
          };
        });
        setLogs(mapped);
      } else {
        setLogs(SAMPLE_AUDIT_LOGS);
      }
    } catch (err) {
      console.error("Failed to load audit logs from database:", err);
      setLogs(SAMPLE_AUDIT_LOGS);
    } finally {
      setLoading(false);
    }
  };

  // Compute stat metrics dynamically
  const totalLogsCount = logs.length || 128;
  const adminActionsCount = logs.filter(l => l.actor.role.toLowerCase().includes('admin') || l.actor.role.toLowerCase().includes('operator')).length || 45;
  const userActionsCount = logs.filter(l => l.actor.role.toLowerCase().includes('donor') || l.actor.role.toLowerCase().includes('ngo')).length || 62;
  const dataChangesCount = logs.filter(l => ['CREATE', 'UPDATE', 'DELETE'].includes(l.action)).length || 21;

  // Filter logs logic
  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'All' && log.action !== filterAction) return false;
    if (filterActor !== 'All Users' && !log.actor.name.toLowerCase().includes(filterActor.toLowerCase()) && !log.actor.role.toLowerCase().includes(filterActor.toLowerCase())) return false;
    if (filterEntity !== 'All Entities' && !log.targetEntity.toLowerCase().includes(filterEntity.toLowerCase())) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchActor = log.actor.name.toLowerCase().includes(q) || log.actor.role.toLowerCase().includes(q);
      const matchEntity = log.targetEntity.toLowerCase().includes(q) || log.entityId.toLowerCase().includes(q);
      const matchIp = log.ipAddress.toLowerCase().includes(q);
      if (!matchDetails && !matchActor && !matchEntity && !matchIp) return false;
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / perPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilterAction('All');
    setFilterActor('All Users');
    setFilterEntity('All Entities');
    setFilterDateRange('Sep 1, 2026 - Sep 30, 2026');
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const csvContent = logs.map(l => `${l.id},"${l.timestamp}","${l.actor.name} (${l.actor.role})",${l.action},${l.targetEntity},${l.entityId},"${l.details}",${l.ipAddress},${l.status}`).join('\n');
    const blob = new Blob([`ID,Timestamp,Actor,Action,Target Entity,Entity ID,Details,IP Address,Status\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Logs_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getEntityIcon = (entityType) => {
    const lower = (entityType || '').toLowerCase();
    if (lower.includes('ngo')) return <Building2 size={15} color="#2E7D32" />;
    if (lower.includes('user')) return <User size={15} color="#2563EB" />;
    if (lower.includes('donation')) return <Package size={15} color="#D9531E" />;
    if (lower.includes('pickup')) return <Truck size={15} color="#D97706" />;
    if (lower.includes('ai') || lower.includes('detection')) return <Target size={15} color="#8E24AA" />;
    if (lower.includes('inventory')) return <Database size={15} color="#059669" />;
    return <FileText size={15} color="#4B5563" />;
  };

  return (
    <div style={{ padding: '4px 0 32px 0', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.admin', 'Admin'), to: '/admin' },
            { label: t('navigation.auditLogs', 'Audit Logs') }
          ]} />
          <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 700, color: '#111827', margin: 0 }}>
            {t('admin.auditLogsTitle', 'Audit Logs')}
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
            {t('admin.auditLogsDesc', 'Track all important system activities, administrative actions, and data changes.')}
          </p>
        </div>

        {/* Export Logs Button */}
        <button
          onClick={handleExportCSV}
          style={{
            backgroundColor: '#D9531E',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '13px',
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
          <Download size={16} />
          Export Logs
        </button>
      </div>

      {/* TOP 4 STAT METRIC CARDS */}
      <div className="admin-metrics-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Logs */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#E3F2FD',
            color: '#1976D2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileText size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {loading ? '...' : totalLogsCount}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', display: 'inline-flex', alignItems: 'center' }}>
                <ArrowUp size={12} /> +12%
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>
              Total Logs
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              All time records
            </div>
          </div>
        </div>

        {/* Card 2: Admin Actions */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#E8F5E9',
            color: '#2E7D32',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {loading ? '...' : adminActionsCount}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', display: 'inline-flex', alignItems: 'center' }}>
                <ArrowUp size={12} /> +8%
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>
              Admin Actions
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              System management
            </div>
          </div>
        </div>

        {/* Card 3: User Actions */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#F3E5F5',
            color: '#8E24AA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {loading ? '...' : userActionsCount}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', display: 'inline-flex', alignItems: 'center' }}>
                <ArrowUp size={12} /> +15%
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>
              User Actions
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              Donor/NGO activities
            </div>
          </div>
        </div>

        {/* Card 4: Data Changes */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#FFF3EB',
            color: '#D9531E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Database size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {loading ? '...' : dataChangesCount}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', display: 'inline-flex', alignItems: 'center' }}>
                <ArrowUp size={12} /> +5%
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>
              Data Changes
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              Create / Update / Delete
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
        {/* Left Dropdown Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          {/* Action Type Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Action Type</label>
            <div style={{ position: 'relative' }}>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
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
                <option value="APPROVE">APPROVE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="CREATE">CREATE</option>
                <option value="DELETE">DELETE</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
            </div>
          </div>

          {/* Actor Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Actor</label>
            <div style={{ position: 'relative' }}>
              <select
                value={filterActor}
                onChange={(e) => setFilterActor(e.target.value)}
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
                <option value="All Users">All Users</option>
                <option value="Sri Sai teja">Sri Sai teja</option>
                <option value="Anita Sharma">Anita Sharma</option>
                <option value="Ravi Kumar">Ravi Kumar</option>
                <option value="NGO Staff">NGO Staff</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
            </div>
          </div>

          {/* Target Entity Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Target Entity</label>
            <div style={{ position: 'relative' }}>
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
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
                  minWidth: '150px'
                }}
              >
                <option value="All Entities">All Entities</option>
                <option value="NGO Profile">NGO Profile</option>
                <option value="User">User</option>
                <option value="Donation">Donation</option>
                <option value="Pickup">Pickup</option>
                <option value="Inventory">Inventory</option>
                <option value="AI Detection">AI Detection</option>
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
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
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
                  minWidth: '210px'
                }}
              >
                <option value="Sep 1, 2026 - Sep 30, 2026">Sep 1, 2026 - Sep 30, 2026</option>
                <option value="Aug 1, 2026 - Aug 31, 2026">Aug 1, 2026 - Aug 31, 2026</option>
                <option value="Last 90 Days">Last 90 Days</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
            </div>
          </div>
        </div>

        {/* Right Search Input & Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
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
            Loading audit logs from database...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151', width: '40px' }}>#</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Timestamp ∨</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Actor ∨</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Action ∨</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Target Entity ∨</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Entity ID ∨</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Details</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>IP Address ∨</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Status ∨</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                      No audit logs match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((row, idx) => {
                    const rowNumber = (currentPage - 1) * perPage + idx + 1;

                    return (
                      <tr
                        key={row.id}
                        style={{ borderBottom: idx === paginatedLogs.length - 1 ? 'none' : '1px solid #F3F4F6' }}
                      >
                        {/* # */}
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                          {rowNumber}
                        </td>

                        {/* Timestamp */}
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                          {row.timestamp}
                        </td>

                        {/* Actor */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: row.actor.bg,
                              color: row.actor.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px',
                              flexShrink: 0
                            }}>
                              {row.actor.initial}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                                {row.actor.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>
                                {row.actor.role}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            backgroundColor: row.actionBg,
                            color: row.actionColor,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            display: 'inline-block'
                          }}>
                            {row.action}
                          </span>
                        </td>

                        {/* Target Entity */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getEntityIcon(row.targetEntity)}
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                              {row.targetEntity}
                            </span>
                          </div>
                        </td>

                        {/* Entity ID */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}>
                            {row.entityId}
                          </span>
                        </td>

                        {/* Details */}
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151', maxWidth: '300px' }}>
                          {row.details}
                        </td>

                        {/* IP Address */}
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: '#6B7280', fontFamily: 'monospace, sans-serif' }}>
                          {row.ipAddress}
                        </td>

                        {/* Status Pill */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: row.statusBg,
                            color: row.statusColor,
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: row.statusDot
                            }} />
                            {row.status}
                          </span>
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
            Showing <strong style={{ color: '#111827' }}>{filteredLogs.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong> to{' '}
            <strong style={{ color: '#111827' }}>{Math.min(currentPage * perPage, filteredLogs.length)}</strong> of{' '}
            <strong style={{ color: '#111827' }}>{filteredLogs.length}</strong> logs
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: page === currentPage ? 'none' : '1px solid #E5E7EB',
                    backgroundColor: page === currentPage ? '#C4622D' : '#ffffff',
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
              ));
            })()}

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

    </div>
  );
}


