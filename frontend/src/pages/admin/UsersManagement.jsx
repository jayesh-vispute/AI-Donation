import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Building2, ShieldCheck, Eye, Edit3, MoreVertical, 
  Search, UserPlus, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, Trash2, AlertCircle, CheckCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function UsersManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All Roles');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterDate, setFilterDate] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #E2DCD5',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.getAdminUsers();
        const mapped = (res || []).map((u, idx) => ({
          id: u.id || idx + 1,
          name: u.full_name || t('common.unknownUser', 'Unknown User'),
          email: u.email || '',
          role: (u.role || 'donor').toUpperCase(),
          status: u.is_active !== false ? 'Active' : 'Suspended',
          joinDate: u.created_at
            ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Sep 13, 2026',
          lastActivityDate: u.updated_at
            ? new Date(u.updated_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
              })
            : 'N/A',
          lastActivityAction: getActivityLabel(u.role),
        }));
        setUsers(mapped);
      } catch (err) {
        console.error('Failed to fetch users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [addingUser, setAddingUser] = useState(false);
  const [newUserFormData, setNewUserFormData] = useState({
    full_name: '', email: '', password: '', phone: '', role: 'DONOR', status: 'Active',
    organization_name: '', description: '', address: '', registration_number: ''
  });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (type, message) => setToast({ type, message });

  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const payload = {
        full_name: editingUser.name,
        role: editingUser.role,
        is_active: editingUser.status === 'Active'
      };
      await api.updateAdminUser(editingUser.id, payload);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
      showToast('success', t('success.userUpdated', 'User updated successfully.'));
    } catch (err) {
      console.error('Failed to update user', err);
      showToast('error', err.message || t('errors.failedUpdateUser', 'Failed to update user.'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddUserClick = () => {
    setNewUserFormData({
      full_name: '', email: '', password: '', phone: '', role: 'DONOR', status: 'Active',
      organization_name: '', description: '', address: '', registration_number: ''
    });
    setAddingUser(true);
  };

  const handleSaveNewUser = async () => {
    if (!newUserFormData.full_name || !newUserFormData.email || !newUserFormData.password) {
      showToast('error', t('validation.requiredFields', 'Please fill in all required fields.'));
      return;
    }
    if (newUserFormData.role === 'NGO' && !newUserFormData.organization_name) {
      showToast('error', 'Organization Name is required for NGO role.');
      return;
    }
    setSaving(true);
    try {
      await api.createAdminUser(newUserFormData);
      setAddingUser(false);
      showToast('success', 'User created successfully.');
      // Refetch users to update list and stats
      const res = await api.getAdminUsers();
      const mapped = (res || []).map((u, idx) => ({
        id: u.id || idx + 1,
        name: u.full_name || 'Unknown User',
        email: u.email || '',
        role: (u.role || 'donor').toUpperCase(),
        status: u.is_active !== false ? 'Active' : 'Suspended',
        joinDate: u.created_at
          ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Sep 13, 2026',
        lastActivityDate: u.updated_at
          ? new Date(u.updated_at).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true
            })
          : 'N/A',
        lastActivityAction: getActivityLabel(u.role),
      }));
      setUsers(mapped);
    } catch (err) {
      console.error('Failed to create user', err);
      showToast('error', err.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await api.toggleAdminUserStatus(user.id);
      const newStatus = res.is_active ? 'Active' : 'Suspended';
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      showToast('success', res.message || `User ${newStatus.toLowerCase()} successfully.`);
    } catch (err) {
      console.error('Failed to toggle user status', err);
      showToast('error', err.message || 'Failed to change user status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently remove this user account? This action cannot be undone.')) return;
    try {
      const res = await api.deleteAdminUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('success', res.message || 'User deleted successfully.');
    } catch (err) {
      console.error('Failed to delete user', err);
      const msg = err?.message || 'Failed to delete user. Please try again.';
      showToast('error', msg);
    }
  };

  function getActivityLabel(role) {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'Logged in';
    if (r === 'donor') return 'Created donation';
    if (r === 'ngo') return 'Updated profile';
    return 'Active';
  }

  // Compute stats from real data
  const totalUsers = users.length;
  const donorCount = users.filter(u => u.role === 'DONOR').length;
  const ngoCount = users.filter(u => u.role === 'NGO').length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;

  // Apply filters
  const filtered = users.filter(u => {
    if (filterRole !== 'All Roles') {
      if (filterRole === 'Donor' && u.role !== 'DONOR') return false;
      if (filterRole === 'NGO' && u.role !== 'NGO') return false;
      if (filterRole === 'Admin' && u.role !== 'ADMIN') return false;
    }
    if (filterStatus !== 'All Status') {
      if (filterStatus === 'Active' && u.status !== 'Active') return false;
      if (filterStatus === 'Suspended' && u.status !== 'Suspended') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Role badge colors matching screenshot
  const getRoleBadge = (role) => {
    const config = {
      ADMIN: { bg: '#3D2B1F', color: '#FFFFFF' },
      DONOR: { bg: '#C4622D', color: '#FFFFFF' },
      NGO: { bg: '#2F7A4F', color: '#FFFFFF' },
    };
    const c = config[role] || config.DONOR;
    return (
      <span style={{
        backgroundColor: c.bg,
        color: c.color,
        fontSize: '11px',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: '4px',
        letterSpacing: '0.5px',
        display: 'inline-block'
      }}>
        {role}
      </span>
    );
  };

  // Avatar initial with role-based color
  const getAvatar = (user) => {
    const initial = user.name?.[0]?.toUpperCase() || '?';
    const colors = {
      ADMIN: { bg: '#F2EEFF', color: '#8064D8' },
      DONOR: { bg: '#FFEFE7', color: '#C4622D' },
      NGO: { bg: '#E8F8F0', color: '#2F7A4F' },
    };
    const c = colors[user.role] || colors.DONOR;
    return (
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: c.bg,
        color: c.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '14px',
        flexShrink: 0
      }}>
        {initial}
      </div>
    );
  };

  // Shared select dropdown style
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

  return (
    <div style={{ width: '100%', position: 'relative' }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 20px', borderRadius: '12px',
          backgroundColor: toast.type === 'success' ? '#E8F8F0' : '#FEF0F0',
          border: `1px solid ${toast.type === 'success' ? '#B1E5C8' : '#FECACA'}`,
          color: toast.type === 'success' ? '#166534' : '#991B1B',
          fontSize: '13px', fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          animation: 'slideInRight 0.3s ease'
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '16px', marginLeft: '8px', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ===== Page Header ===== */}
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.admin', 'Admin'), to: '/admin' },
        { label: t('navigation.users', 'Users') }
      ]} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 700, color: '#1C1611', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
          {t('admin.usersTitle', 'Users')}
        </h1>
        <p style={{ fontSize: '14px', color: '#8A7F72', margin: 0 }}>
          {t('admin.usersDesc', 'Manage all users in the Donation AI platform. View, search, filter and manage donor, NGO and admin accounts.')}
        </p>
      </div>

      {/* ===== Stats Cards Grid ===== */}
      <div className="admin-metrics-grid">
        {/* Total Users */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#FFEFE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={21} color="#C4622D" />
            </div>
            <div style={{ backgroundColor: '#E8F8F0', color: '#2F7A4F', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUp size={11} strokeWidth={2.5} />
              <span>+20%</span>
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#1C1611', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{totalUsers}</div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#221D17', marginTop: '4px' }}>{t('admin.totalUsers', 'Total Users')}</div>
            <div style={{ fontSize: '11.5px', color: '#8A7F72', marginTop: '2px' }}>{t('uiTemplates.allRegisteredUsers', 'Registered user accounts')}</div>
          </div>
        </div>

        {/* Donors */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#E8F8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={21} color="#2F7A4F" />
            </div>
            <div style={{ backgroundColor: '#E8F8F0', color: '#2F7A4F', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUp size={11} strokeWidth={2.5} />
              <span>+100%</span>
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#1C1611', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{donorCount}</div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#221D17', marginTop: '4px' }}>{t('navigation.donors', 'Donors')}</div>
            <div style={{ fontSize: '11.5px', color: '#8A7F72', marginTop: '2px' }}>{t('uiTemplates.activeDonors', 'Active donors in system')}</div>
          </div>
        </div>

        {/* NGO Partners */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#FFEFE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={21} color="#C4622D" />
            </div>
            <div style={{ backgroundColor: '#E8F8F0', color: '#2F7A4F', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUp size={11} strokeWidth={2.5} />
              <span>+100%</span>
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#1C1611', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{ngoCount}</div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#221D17', marginTop: '4px' }}>{t('uiTemplates.ngoPartners', 'NGO Partners')}</div>
            <div style={{ fontSize: '11.5px', color: '#8A7F72', marginTop: '2px' }}>{t('admin.verifiedNgos', 'Verified and pending NGOs')}</div>
          </div>
        </div>

        {/* Admins */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#F2EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={21} color="#8064D8" />
            </div>
            <div style={{ backgroundColor: '#F4EFEA', color: '#8A7F72', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <span>— 0%</span>
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#1C1611', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{adminCount}</div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#221D17', marginTop: '4px' }}>{t('common.admin', 'Admin')}</div>
            <div style={{ fontSize: '11.5px', color: '#8A7F72', marginTop: '2px' }}>{t('uiTemplates.systemAdministrators', 'System administrators')}</div>
          </div>
        </div>
      </div>

      {/* ===== Filters & Search Bar ===== */}
      <div className="admin-card" style={{
        padding: '14px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 auto' }}>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="admin-control-select">
            <option>All Roles</option>
            <option>Donor</option>
            <option>NGO</option>
            <option>Admin</option>
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="admin-control-select">
            <option>All Status</option>
            <option>Active</option>
            <option>Suspended</option>
          </select>

          <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="admin-control-select">
            <option>All Time</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
          </select>
        </div>

        {/* Right: Search & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2DCD5',
            borderRadius: '8px',
            padding: '0 12px',
            gap: '8px',
            height: '38px',
            width: 'min(100%, 240px)',
            boxSizing: 'border-box'
          }}>
            <Search size={15} color="#8A7F72" />
            <input
              type="text"
              placeholder={t('admin.searchByNameEmail', 'Search by name or email...')}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                color: '#1C1611',
                width: '100%',
                backgroundColor: 'transparent'
              }}
            />
          </div>

          <button
            onClick={() => setCurrentPage(1)}
            className="admin-btn-primary"
          >
            <Search size={14} /> {t('actions.search', 'Search')}
          </button>
          
          <button
            onClick={handleAddUserClick}
            className="admin-btn-primary"
          >
            <UserPlus size={14} /> {t('actions.addUser', 'Add User')}
          </button>
        </div>
      </div>

      {/* ===== Users Data Table ===== */}
      <div className="admin-table-wrapper">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ECE7E1', backgroundColor: '#FAF8F5' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left', width: '40px' }}>#</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left' }}>{t('uiTemplates.user')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left' }}>{t('uiTemplates.role')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left' }}>{t('admin.status', 'Status')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t('uiTemplates.joinedDate')} <ChevronDown size={13} />
                  </div>
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t('uiTemplates.lastActivity')} <ChevronDown size={13} />
                  </div>
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#8A7F72', textAlign: 'center' }}>{t('uiTemplates.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#8A7F72' }}>
                    {t('uiTemplates.loadingUsers')}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#8A7F72' }}>
                    {t('uiTemplates.noUsersFound')}
                  </td>
                </tr>
              ) : (
                paginated.map((user, idx) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #F3EFEA',
                      transition: 'background-color 0.12s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAF8F5'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Row Number */}
                    <td style={{ padding: '14px 16px', color: '#8A7F72', fontWeight: 600 }}>
                      {(currentPage - 1) * perPage + idx + 1}
                    </td>

                    {/* User Avatar + Name + Email */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {getAvatar(user)}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1611' }}>{user.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#8A7F72' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      {getRoleBadge(user.role)}
                    </td>

                    {/* Status with Green Dot */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: user.status === 'Active' ? '#2F7A4F' : '#D14343',
                          display: 'inline-block'
                        }}></span>
                        <span style={{
                          fontSize: '12.5px',
                          fontWeight: 500,
                          color: user.status === 'Active' ? '#2F7A4F' : '#D14343'
                        }}>
                          {user.status}
                        </span>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td style={{ padding: '14px 16px', color: '#554E45', fontSize: '12.5px' }}>
                      {user.joinDate}
                    </td>

                    {/* Last Activity */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '12.5px', color: '#554E45' }}>{user.lastActivityDate}</div>
                      <div style={{ fontSize: '11px', color: '#8A7F72', marginTop: '2px' }}>
                        • {user.lastActivityAction}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', position: 'relative' }}>
                        <button
                          title={t('uiTemplates.viewUser')}
                          onClick={() => setSelectedUser(user)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px', borderRadius: '6px', color: '#776E65',
                            transition: 'background-color 0.12s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F4EFEA'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          title={t('uiTemplates.editUser')}
                          onClick={() => setEditingUser({ ...user })}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px', borderRadius: '6px', color: '#776E65',
                            transition: 'background-color 0.12s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F4EFEA'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          title="More Options"
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === user.id ? null : user.id); }}
                          style={{
                            background: activeMenuId === user.id ? '#F4EFEA' : 'none',
                            border: 'none', cursor: 'pointer',
                            padding: '6px', borderRadius: '6px', color: '#776E65',
                            transition: 'background-color 0.12s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F4EFEA'}
                          onMouseLeave={e => { if (activeMenuId !== user.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* More Options Popover Dropdown */}
                        {activeMenuId === user.id && (
                          <div 
                            onClick={e => e.stopPropagation()}
                            style={{
                              position: 'absolute', right: 0, top: '100%', zIndex: 50,
                              backgroundColor: '#FFFFFF', borderRadius: '10px',
                              border: '1px solid #ECE7E1', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                              minWidth: '160px', padding: '6px', textAlign: 'left'
                            }}
                          >
                            <button
                              onClick={() => { setSelectedUser(user); setActiveMenuId(null); }}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#2B1D14' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAF8F5'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Eye size={14} /> View Details
                            </button>
                            <button
                              onClick={() => { setEditingUser({ ...user }); setActiveMenuId(null); }}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#2B1D14' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAF8F5'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Edit3 size={14} /> Edit User
                            </button>
                            <button
                              onClick={() => { handleToggleStatus(user); setActiveMenuId(null); }}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: user.status === 'Active' ? '#B45309' : '#16A34A' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAF8F5'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <ShieldCheck size={14} /> {user.status === 'Active' ? 'Suspend User' : 'Activate User'}
                            </button>
                            <div style={{ height: '1px', backgroundColor: '#ECE7E1', margin: '4px 0' }} />
                            <button
                              onClick={() => { handleDeleteUser(user.id); setActiveMenuId(null); }}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#D14343' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF0F0'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 size={14} /> Delete User
                            </button>
                          </div>
                        )}
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '16px',
          padding: '14px 20px',
          borderTop: '1px solid #ECE7E1',
          fontSize: '13px',
          color: '#8A7F72'
        }}>
          <span>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filtered.length)} of {filtered.length} users
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{
                width: 32, height: 32, borderRadius: '8px',
                border: '1px solid #E2DCD5', backgroundColor: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.4 : 1,
                color: '#776E65'
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
                    border: page === currentPage ? 'none' : '1px solid #E2DCD5',
                    backgroundColor: page === currentPage ? '#C4622D' : '#FFFFFF',
                    color: page === currentPage ? '#FFFFFF' : '#776E65',
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
                border: '1px solid #E2DCD5', backgroundColor: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.4 : 1,
                color: '#776E65'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== View User Details Modal ===== */}
      {selectedUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(28, 22, 17, 0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%',
            padding: '24px', border: '1px solid #ECE7E1', boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1C1611' }}>{t('admin.userProfileDetails', 'User Profile Details')}</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#8A7F72' }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              {getAvatar(selectedUser)}
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 700, color: '#1C1611' }}>{selectedUser.name}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#8A7F72' }}>{selectedUser.email}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '12px', backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#8A7F72', fontWeight: 600 }}>Role</div>
                <div style={{ marginTop: '4px' }}>{getRoleBadge(selectedUser.role)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#8A7F72', fontWeight: 600 }}>Status</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: selectedUser.status === 'Active' ? '#2F7A4F' : '#D14343', marginTop: '4px' }}>{selectedUser.status}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#8A7F72', fontWeight: 600 }}>Joined Date</div>
                <div style={{ fontSize: '13px', color: '#1C1611', marginTop: '4px' }}>{selectedUser.joinDate}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#8A7F72', fontWeight: 600 }}>Last Activity</div>
                <div style={{ fontSize: '13px', color: '#1C1611', marginTop: '4px' }}>{selectedUser.lastActivityDate}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedUser(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2DCD5', backgroundColor: '#fff', color: '#1C1611', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              <button onClick={() => { setEditingUser({ ...selectedUser }); setSelectedUser(null); }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#C4622D', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Edit User</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit User Modal ===== */}
      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(28, 22, 17, 0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%',
            padding: '24px', border: '1px solid #ECE7E1', boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1C1611' }}>{t('admin.editUserAccount', 'Edit User Account')}</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#8A7F72' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8A7F72', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2DCD5', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8A7F72', marginBottom: '6px' }}>Role</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2DCD5', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}
                >
                  <option value="DONOR">DONOR</option>
                  <option value="NGO">NGO</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8A7F72', marginBottom: '6px' }}>Status</label>
                <select
                  value={editingUser.status}
                  onChange={e => setEditingUser({ ...editingUser, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2DCD5', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingUser(null)} disabled={saving} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2DCD5', backgroundColor: '#fff', color: '#1C1611', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>Cancel</button>
              <button onClick={handleSaveEditUser} disabled={saving} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#C4622D', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
      {/* ===== Add User Modal ===== */}
      {addingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(28, 22, 17, 0.4)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '480px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: '#1C1611' }}>{t('admin.addNewUser', 'Add New User')}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#221D17', marginBottom: '6px' }}>Full Name *</div>
              <input type="text"
                value={newUserFormData.full_name}
                onChange={e => setNewUserFormData({...newUserFormData, full_name: e.target.value})}
                style={inputStyle}
                placeholder="e.g. John Doe"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#221D17', marginBottom: '6px' }}>Email *</div>
              <input type="email"
                value={newUserFormData.email}
                onChange={e => setNewUserFormData({...newUserFormData, email: e.target.value})}
                style={inputStyle}
                placeholder="e.g. john@example.com"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#221D17', marginBottom: '6px' }}>Password *</div>
              <input type="password"
                value={newUserFormData.password}
                onChange={e => setNewUserFormData({...newUserFormData, password: e.target.value})}
                style={inputStyle}
                placeholder="Enter password"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#221D17', marginBottom: '6px' }}>Phone Number</div>
              <input type="tel"
                value={newUserFormData.phone}
                onChange={e => setNewUserFormData({...newUserFormData, phone: e.target.value})}
                style={inputStyle}
                placeholder="e.g. +1 234 567 8900"
              />
            </div>
            
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#221D17', marginBottom: '6px' }}>Role *</div>
                <select 
                  value={newUserFormData.role}
                  onChange={e => setNewUserFormData({...newUserFormData, role: e.target.value})}
                  style={{...inputStyle, width: '100%'}}
                >
                  <option value="DONOR">DONOR</option>
                  <option value="NGO">NGO</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#221D17', marginBottom: '6px' }}>Status *</div>
                <select 
                  value={newUserFormData.status}
                  onChange={e => setNewUserFormData({...newUserFormData, status: e.target.value})}
                  style={{...inputStyle, width: '100%'}}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            {newUserFormData.role === 'NGO' && (
              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                backgroundColor: '#FAF8F5', 
                borderRadius: '8px',
                border: '1px solid #ECE7E1'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#1C1611' }}>NGO Details</h4>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#221D17', marginBottom: '6px' }}>Organization Name *</div>
                  <input type="text"
                    value={newUserFormData.organization_name}
                    onChange={e => setNewUserFormData({...newUserFormData, organization_name: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#221D17', marginBottom: '6px' }}>Registration Number</div>
                  <input type="text"
                    value={newUserFormData.registration_number}
                    onChange={e => setNewUserFormData({...newUserFormData, registration_number: e.target.value})}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#221D17', marginBottom: '6px' }}>Address</div>
                  <input type="text"
                    value={newUserFormData.address}
                    onChange={e => setNewUserFormData({...newUserFormData, address: e.target.value})}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#221D17', marginBottom: '6px' }}>Description</div>
                  <textarea
                    value={newUserFormData.description}
                    onChange={e => setNewUserFormData({...newUserFormData, description: e.target.value})}
                    style={{...inputStyle, minHeight: '60px', resize: 'vertical'}}
                  />
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={() => setAddingUser(false)}
                style={{ padding: '8px 16px', backgroundColor: '#FFFFFF', border: '1px solid #ECE7E1', borderRadius: '8px', color: '#5C5449', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNewUser}
                disabled={saving}
                style={{ padding: '8px 16px', backgroundColor: '#C4622D', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', fontSize: '13px', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}




