import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Filter, CheckCircle, Package, Upload, AlertCircle, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { NgoEmptyState, NgoTableSkeleton } from '../../components/ngo/NgoStates';
import NgoButton from '../../components/ngo/NgoButton';
import ImportInventoryModal from '../../components/ngo/ImportInventoryModal';
import EditInventoryModal from '../../components/ngo/EditInventoryModal';
import { translateCategory, translateCondition, translateInventoryStatus } from '../../utils/ngoI18n';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function Inventory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterCondition, setFilterCondition] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const uniqueCategories = ['ALL', ...new Set(items.map(item => item.category_name || item.category || 'General'))];

  const fetchInventoryAndStats = async () => {
    setLoading(true);
    try {
      const [itemsRes, statsRes] = await Promise.all([
        api.getNgoInventory(),
        api.getNgoInventoryStats().catch(() => null)
      ]);
      setItems(itemsRes || []);
      setStats(statsRes || { total_items: 0, ready_to_distribute: 0, allocated: 0, needs_attention: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryAndStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterCondition, filterStatus]);

  const handleImportSuccess = () => {
    fetchInventoryAndStats();
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = (item.item_name || item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.category_name || item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || (item.category_name || item.category || 'General') === filterCategory;
    const matchesCondition = filterCondition === 'ALL' || (item.condition || 'GOOD') === filterCondition;
    const matchesStatus = filterStatus === 'ALL' || (item.status || 'AVAILABLE') === filterStatus;
    
    return matchesSearch && matchesCategory && matchesCondition && matchesStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredItems.length);
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const statCards = [
    { icon: Package, title: t('ngo.inventory.totalUnits'), value: stats?.total_items || 0, subtitle: t('ngo.inventory.inInventory'), color: '#C4622D', bg: '#FDF1EB' },
    { icon: CheckCircle, title: t('ngo.inventory.readyForUse'), value: stats?.ready_to_distribute || 0, subtitle: t('ngo.inventory.goodCondition'), color: '#2F7A4F', bg: '#EBF4ED' },
    { icon: Clock, title: t('ngo.inventory.allocated'), value: stats?.allocated || 0, subtitle: t('ngo.inventory.forUpcomingDrives'), color: '#6366F1', bg: '#EEF2FF' },
    { icon: AlertCircle, title: t('ngo.inventory.needsAttention'), value: stats?.needs_attention || 0, subtitle: t('ngo.inventory.checkCondition'), color: '#F59E0B', bg: '#FEF3C7' },
  ];

  const conditionOptions = ['ALL', 'NEW', 'GOOD', 'FAIR', 'POOR'];
  const statusOptions = ['ALL', 'AVAILABLE', 'ALLOCATED', 'NEEDS_ATTENTION'];

  return (
    <div style={{ paddingBottom: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: 'var(--space-4)' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.ngo', 'NGO'), to: '/ngo' },
            { label: t('navigation.inventory', 'Inventory') }
          ]} />
          <h1 style={{ fontSize: '28px', margin: '0 0 var(--space-1) 0', fontFamily: 'Fraunces, serif' }}>{t('ngo.inventory.title')}</h1>
          <p style={{ color: 'var(--neutral-600)', margin: 0 }}>{t('ngo.inventory.desc')}</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <NgoButton onClick={() => setIsImportModalOpen(true)} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} /> {t('ngo.inventory.importInventory')}
          </NgoButton>
          <NgoButton variant={isFilterOpen ? "primary" : "outline"} onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ padding: '8px 16px' }}>
            <Filter size={16} /> {t('actions.filter')}
          </NgoButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="ngo-stats-row">
        {statCards.map((stat, i) => (
          <div key={i} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{loading ? '-' : stat.value}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#4A3D34', marginBottom: '2px' }}>{stat.title}</div>
              <div style={{ fontSize: '12px', color: '#8C7A6B' }}>{stat.subtitle}</div>
            </div>
          </div>
        ))}
    </div>
    
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: '1 1 auto', maxWidth: '300px', minWidth: '130px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8C7A6B' }} />
          <input 
            type="text" 
            placeholder={t('ngo.inventory.searchItems')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', fontSize: '14px' }}
          />
        </div>
      </div>

      {isFilterOpen && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px', backgroundColor: '#FAFAF9', borderRadius: '12px', border: '1px solid #EAE5DE', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 min(100%, 200px)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#654B35', marginBottom: '6px' }}>{t('ngo.inventory.category')}</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', fontSize: '13px', backgroundColor: '#fff' }}>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? t('ngo.inventory.allCategories') : translateCategory(cat, t)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 min(100%, 200px)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#654B35', marginBottom: '6px' }}>{t('ngo.inventory.status')}</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', fontSize: '13px', backgroundColor: '#fff' }}>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'ALL' ? t('ngo.inventory.allStatuses') : translateInventoryStatus(status, t)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 min(100%, 200px)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#654B35', marginBottom: '6px' }}>{t('ngo.inventory.condition')}</label>
            <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', fontSize: '13px', backgroundColor: '#fff' }}>
              {conditionOptions.map(condition => (
                <option key={condition} value={condition}>
                  {condition === 'ALL' ? t('ngo.inventory.allConditions') : translateCondition(condition, t)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <NgoTableSkeleton rows={6} />
      ) : filteredItems.length === 0 ? (
        <NgoEmptyState 
          icon={Package} 
          title={searchQuery ? t('empty.noMatchingItems') : t('empty.inventoryEmpty')}
          message={searchQuery ? t('empty.adjustSearchItems') : t('empty.itemsAppearAfterAccept')}
          actionLabel={searchQuery ? t('actions.clearSearch') : t('ngo.inventory.importInventory')}
          onAction={() => searchQuery ? setSearchQuery('') : setIsImportModalOpen(true)}
        />
      ) : (
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '12px', 
          border: '1px solid #EAE5DE', 
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(43,29,20,0.02)'
        }}>
          <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#FAFAF9', borderBottom: '1px solid #EAE5DE', zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.inventory.tableItemName')}</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.inventory.category')}</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.inventory.tableAvailableQty')}</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.inventory.condition')}</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.inventory.tableLocation')}</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.inventory.status')}</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>{t('ngo.demands.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #F4F2EE', transition: 'background-color 150ms' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#2B1D14' }}>
                      <div style={{ textTransform: 'capitalize' }}>{item.item_name || item.name}</div>
                      {item.subcategory && (
                        <div style={{ fontSize: '12px', color: '#8C7A6B', marginTop: '2px', fontWeight: 400 }}>
                          {item.subcategory}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#654B35' }}>
                      {translateCategory(item.category_name || item.category || 'General', t)}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#2B1D14' }}>
                      {item.available_quantity || item.available || item.quantity || 0}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#654B35' }}>
                      {translateCondition(item.condition || 'GOOD', t)}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#654B35' }}>
                      {item.storage_location || '-'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        fontSize: '12px', fontWeight: 600, 
                        color: item.status === 'AVAILABLE' ? '#2F7A4F' : item.status === 'ALLOCATED' ? '#4F46E5' : item.status === 'NEEDS_ATTENTION' ? '#B45309' : '#654B35', 
                        backgroundColor: item.status === 'AVAILABLE' ? '#EBF4ED' : item.status === 'ALLOCATED' ? '#EEF2FF' : item.status === 'NEEDS_ATTENTION' ? '#FEF3C7' : '#F4F2EE', 
                        padding: '4px 8px', borderRadius: '6px' 
                      }}>
                        {translateInventoryStatus(item.status || 'IN_STOCK', t)}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => setEditingItem(item)} style={{ backgroundColor: 'transparent', border: '1px solid #EAE5DE', color: '#654B35', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        {t('actions.edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredItems.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              backgroundColor: '#fff',
              borderTop: '1px solid #EAE5DE',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ fontSize: '14px', color: '#654B35', fontWeight: 500 }}>
                {t('common.showingEntries', {
                  defaultValue: `Showing ${filteredItems.length === 0 ? 0 : startIndex + 1} to ${endIndex} of ${filteredItems.length} entries`,
                  start: filteredItems.length === 0 ? 0 : startIndex + 1,
                  end: endIndex,
                  total: filteredItems.length
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #EAE5DE',
                    backgroundColor: '#fff',
                    color: currentPage === 1 ? '#D4C9C1' : '#8C7A6B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      minWidth: '36px',
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: page === currentPage ? 'none' : '1px solid #EAE5DE',
                      backgroundColor: page === currentPage ? '#C4622D' : '#fff',
                      color: page === currentPage ? '#fff' : '#654B35',
                      fontWeight: 600,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: page === currentPage ? '0 2px 4px rgba(196, 98, 45, 0.2)' : 'none',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #EAE5DE',
                    backgroundColor: '#fff',
                    color: (currentPage === totalPages || totalPages === 0) ? '#D4C9C1' : '#8C7A6B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Banner */}
      {!loading && items.length > 0 && (
        <div style={{ marginTop: '24px', backgroundColor: '#EBF4ED', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={20} color="#2F7A4F" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B472E', marginBottom: '4px' }}>{t('ngo.inventory.footerTitle')}</div>
            <div style={{ fontSize: '13px', color: '#2F7A4F' }}>{t('ngo.inventory.footerDesc')}</div>
          </div>
        </div>
      )}

      <ImportInventoryModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={handleImportSuccess} 
      />
      <EditInventoryModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={() => {
          setEditingItem(null);
          fetchInventoryAndStats();
        }}
      />
    </div>
  );
}


