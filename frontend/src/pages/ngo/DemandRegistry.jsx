import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  PlusCircle, Edit2, Trash2, Search, Filter, MoreVertical, 
  Package, CheckCircle, Clock, AlertCircle, Leaf, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { api } from '../../services/api';
import NgoButton from '../../components/ngo/NgoButton';
import { NgoEmptyState, NgoTableSkeleton } from '../../components/ngo/NgoStates';
import { translateDemandStatus, translateCategory } from '../../utils/ngoI18n';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function DemandRegistry() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    fetchDemands();
  }, []);

  const fetchDemands = async () => {
    try {
      setLoading(true);
      const data = await api.getMyDemands();
      const sorted = (data || []).sort((a, b) => {
         const dateA = new Date(a.created_at || a.datePosted || 0);
         const dateB = new Date(b.created_at || b.datePosted || 0);
         if (dateB.getTime() !== dateA.getTime()) return dateB.getTime() - dateA.getTime();
         if (a.group_id && b.group_id) return a.group_id.localeCompare(b.group_id);
         return 0;
      });
      setDemands(sorted);
    } catch (error) {
      console.error("Failed to fetch demands", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm(t('ngo.demands.deleteConfirm', 'Are you sure you want to delete this demand?'))) {
      try {
        await api.deleteDemand(id);
        setDemands(prev => prev.filter(d => d.id !== id));
      } catch (error) {
        console.error("Failed to delete demand", error);
        alert(t('errors.failedDeleteDemand', 'Failed to delete demand.'));
      }
    }
  };

  const getQty = (d) => parseInt(d.quantity || d.quantity_required || 0, 10) || 0;
  const getFulfilled = (d) => parseInt(d.fulfilled || d.quantity_fulfilled || 0, 10) || 0;

  const activeDemands = demands.filter(d => {
    const s = String(d.status || '').toUpperCase();
    return s !== 'CANCELLED';
  });

  const processedDemands = activeDemands.map(d => {
    let qty = getQty(d);
    let fulfilled = getFulfilled(d);
    const rawStatus = (d.status || '').toUpperCase();
    const isStatusFulfilled = rawStatus === 'FULFILLED' || rawStatus === 'COMPLETED';
    
    if (isStatusFulfilled && fulfilled === 0 && qty > 0) {
      fulfilled = qty;
    }
    
    const percent = qty > 0 ? Math.min(100, Math.round((fulfilled / qty) * 100)) : (isStatusFulfilled ? 100 : 0);
    
    let status = d.status || 'Pending';
    if (status.toUpperCase() === 'OPEN' || status.toLowerCase() === 'active') {
      status = 'Pending';
    }
    if (percent === 100 || isStatusFulfilled) status = 'Fulfilled';
    else if (percent > 0 && percent < 100) status = 'Partially Fulfilled';
    
    return { ...d, _qty: qty, _fulfilled: fulfilled, _percent: percent, _status: status };
  });

  const filteredDemands = processedDemands.filter(d => {
    const matchesSearch = (d.itemType || d.item_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || d._status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDemands.length / itemsPerPage));
  const paginatedDemands = filteredDemands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: processedDemands.length,
    fulfilled: processedDemands.filter(d => d._status === 'Fulfilled').length,
    partiallyFulfilled: processedDemands.filter(d => d._status === 'Partially Fulfilled').length,
    pending: processedDemands.filter(d => d._status === 'Pending').length,
  };

  const tabs = ['All', 'Pending', 'Partially Fulfilled', 'Fulfilled', 'Expired'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Fulfilled': return { bg: '#EBF4ED', text: '#2F7A4F' };
      case 'Partially Fulfilled': return { bg: '#EEF2FF', text: '#6366F1' };
      case 'Pending': return { bg: '#FEF3C7', text: '#B45309' };
      case 'Expired': return { bg: '#FDF3F3', text: '#D14343' };
      default: return { bg: '#F4F2EE', text: '#654B35' };
    }
  };

  const getCategoryColor = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('education') || cat.includes('book')) return { bg: '#EEF2FF', text: '#4F46E5' };
    if (cat.includes('cloth')) return { bg: '#FDF3F8', text: '#DB2777' };
    if (cat.includes('food')) return { bg: '#EBF4ED', text: '#16A34A' };
    if (cat.includes('kid') || cat.includes('toy')) return { bg: '#F3E8FF', text: '#9333EA' };
    if (cat.includes('essential') || cat.includes('blanket')) return { bg: '#FDF1EB', text: '#C4622D' };
    return { bg: '#F4F2EE', text: '#654B35' };
  };

  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('book') || cat.includes('education')) return '📚';
    if (cat.includes('cloth')) return '👕';
    if (cat.includes('food')) return '🥫';
    if (cat.includes('toy') || cat.includes('kid')) return '🧸';
    if (cat.includes('blanket') || cat.includes('essential')) return '🛏️';
    return '📦';
  };

  return (
    <div style={{ padding: '0 0 var(--space-6) 0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.ngo', 'NGO'), to: '/ngo' },
            { label: t('navigation.itemRequests', 'Item Requests') }
          ]} />
          
          <h1 style={{ fontSize: '36px', fontFamily: 'Fraunces, serif', margin: '0 0 8px 0', color: '#2B1D14', fontWeight: 800 }}>
            {t('ngo.demands.title')}
          </h1>
          <p style={{ color: '#4A3D34', fontSize: '15px', margin: '0 0 8px 0' }}>
            {t('ngo.demands.desc')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2F7A4F', fontSize: '13px', fontStyle: 'italic' }}>
            <Leaf size={14} /> {t('ngo.demands.tagline')}
          </div>
        </div>
        
        <NgoButton onClick={() => navigate('/ngo/demands/add')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', backgroundColor: '#C4622D', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
          <PlusCircle size={18} /> {t('ngo.dashboard.createDemand')}
        </NgoButton>
      </div>

      <div className="ngo-stats-row">
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FDF1EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={24} color="#C4622D" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{stats.total}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14' }}>{t('ngo.demands.totalRequests')}</div>
            <div style={{ fontSize: '12px', color: '#8C7A6B' }}>{t('ngo.demands.allItemDemands')}</div>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#EBF4ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={24} color="#2F7A4F" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{stats.fulfilled}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14' }}>{translateDemandStatus('Fulfilled', t)}</div>
            <div style={{ fontSize: '12px', color: '#8C7A6B' }}>{t('ngo.demands.itemsFullyMatched')}</div>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={24} color="#4F46E5" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{stats.partiallyFulfilled}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14' }}>{translateDemandStatus('Partially Fulfilled', t)}</div>
            <div style={{ fontSize: '12px', color: '#8C7A6B' }}>{t('ngo.demands.someQuantityMatched')}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={24} color="#B45309" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{stats.pending}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14' }}>{translateDemandStatus('Pending', t)}</div>
            <div style={{ fontSize: '12px', color: '#8C7A6B' }}>{t('ngo.demands.awaitingMatches')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
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
              {translateDemandStatus(tab, t)}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 auto', minWidth: '130px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8C7A6B' }} />
            <input 
              type="text" 
              placeholder={t('ngo.demands.searchItems')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', fontSize: '14px' }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #EAE5DE', color: '#2B1D14', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            <Filter size={16} /> {t('actions.filter')}
          </button>
        </div>
      </div>

      {loading ? (
        <NgoTableSkeleton rows={5} />
      ) : filteredDemands.length === 0 ? (
        <NgoEmptyState 
          title={searchQuery ? t('empty.noMatchingDemands') : t('empty.noDemandsRegistered')} 
          message={searchQuery ? t('empty.adjustSearchDemands') : t('empty.createFirstDemand')} 
          actionLabel={searchQuery ? t('actions.clearSearch') : t('ngo.dashboard.createDemand')}
          onAction={() => searchQuery ? setSearchQuery('') : navigate('/ngo/demands/add')}
        />
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #EAE5DE', overflow: 'hidden', boxShadow: '0 2px 4px rgba(43,29,20,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead style={{ backgroundColor: '#FAFAF9', borderBottom: '1px solid #EAE5DE' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.demands.tableItem')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.demands.tableCategory')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.demands.tableQuantityNeeded')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.demands.tableFulfillment')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.demands.tableStatus')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('ngo.demands.tablePostedOn')}</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#654B35', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>{t('ngo.demands.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDemands.map((demand, idx) => {
                  const catStyle = getCategoryColor(demand.category);
                  const statusStyle = getStatusBadge(demand._status);
                  const progressColor = demand._percent === 100 ? '#16A34A' : demand._percent > 0 ? '#C4622D' : '#EAE5DE';
                  
                  return (
                    <tr key={demand.id || idx} style={{ borderBottom: '1px solid #F4F2EE', transition: 'background-color 150ms' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '8px', backgroundColor: '#FDF1EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            {getCategoryIcon(demand.category || demand.itemType || demand.item_name)}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>{demand.itemType || demand.item_name}</div>
                            <div style={{ fontSize: '12px', color: '#8C7A6B', maxWidth: '200px', wordBreak: 'break-word' }}>{demand.description || t('ngo.demands.neededForCommunity')}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ backgroundColor: catStyle.bg, color: catStyle.text, padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                          {translateCategory(demand.category || 'General', t)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: '#2B1D14' }}>
                        {demand._qty} {t('common.units')}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flex: 1, width: '100px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#4A3D34', marginBottom: '4px' }}>{demand._fulfilled} / {demand._qty}</div>
                            <div style={{ height: '6px', backgroundColor: '#EAE5DE', borderRadius: '100px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${demand._percent}%`, backgroundColor: progressColor, borderRadius: '100px' }} />
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#8C7A6B', width: '30px', textAlign: 'right' }}>{demand._percent}%</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                          {translateDemandStatus(demand._status, t)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: '#4A3D34' }}>
                        {demand.datePosted ? new Date(demand.datePosted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/ngo/demands/${demand.id}/edit`); }}
                            style={{ background: 'none', border: 'none', color: '#654B35', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EAE5DE'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            title={t('ngo.demands.editRequest')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, demand.id)}
                            style={{ background: 'none', border: 'none', color: '#D14343', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FDF3F3'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            title={t('ngo.demands.deleteRequest')}
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            style={{ background: 'none', border: 'none', color: '#654B35', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EAE5DE'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            title={t('ngo.demands.moreOptions')}
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

      {!loading && filteredDemands.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
          <div style={{ fontSize: '13px', color: '#654B35' }}>
            Showing {filteredDemands.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDemands.length)} of {filteredDemands.length} entries
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
              const totalPages = Math.max(1, Math.ceil(filteredDemands.length / itemsPerPage));
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
              disabled={currentPage >= Math.max(1, Math.ceil(filteredDemands.length / itemsPerPage))}
              onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(filteredDemands.length / itemsPerPage)), p + 1))}
              style={{
                width: 32, height: 32, borderRadius: '8px',
                border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: currentPage >= Math.max(1, Math.ceil(filteredDemands.length / itemsPerPage)) ? 'not-allowed' : 'pointer',
                opacity: currentPage >= Math.max(1, Math.ceil(filteredDemands.length / itemsPerPage)) ? 0.4 : 1,
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


