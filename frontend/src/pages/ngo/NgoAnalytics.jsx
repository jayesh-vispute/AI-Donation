import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, CheckCircle, ClipboardList, TrendingUp, AlertTriangle, 
  Calendar as CalendarIcon, Users, ArrowUpRight, ChevronRight, Search, X, FileText
} from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { translateCategory } from '../../utils/ngoI18n';
import Breadcrumbs from '../../components/common/Breadcrumbs';

const PALETTE = [
  '#C4622D', // Warm Terracotta Primary
  '#2F7A4F', // Forest Green Secondary
  '#3B82F6', // Vibrant Blue
  '#8B5CF6', // Purple Accent
  '#F59E0B', // Amber / Gold
  '#EC4899', // Coral Pink
  '#06B6D4', // Cyan / Teal
  '#10B981', // Emerald Green
  '#E11D48', // Crimson Red
  '#84CC16', // Lime
];

const CATEGORY_COLORS = {
  'Clothing': '#F97316',
  'Apparel': '#F97316',
  'Books': '#3B82F6',
  'Books & Education': '#3B82F6',
  'Education': '#3B82F6',
  'Food': '#10B981',
  'Groceries': '#10B981',
  'Toys': '#FBBF24',
  'Toys & Games': '#FBBF24',
  'Furniture': '#C4622D',
  'Home & Living': '#C4622D',
  'Essentials': '#8B5CF6',
  'Electronics': '#06B6D4',
  'Medical': '#EC4899',
  'Health': '#EC4899',
  'Others': '#8B8176'
};

const getCategoryColor = (name, index) => {
  if (name && CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  const lower = (name || '').toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }
  return PALETTE[index % PALETTE.length];
};

export default function NgoAnalytics() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Search states
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.getNgoAnalytics();
      setData(response);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError(t('errors.failedLoadAnalytics', 'Failed to load analytics data.'));
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity) => {
    const targetId = activity.request_id || activity.donation_id;
    if (targetId) {
      navigate(`/ngo/donations/${targetId}`);
    } else {
      navigate('/ngo/donations');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #F9DFCC', borderTopColor: '#E86A33', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#8C7A6B', fontWeight: 500 }}>{t('ngo.loadingAnalytics', 'Loading analytics...')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px', textAlign: 'center' }}>
        <AlertTriangle size={48} color="#EF4444" />
        <h3 style={{ color: '#2B1D14', fontSize: '20px' }}>{t('errors.somethingWentWrong', 'Something went wrong')}</h3>
        <p style={{ color: '#8C7A6B' }}>{error}</p>
        <button onClick={fetchAnalytics} style={{ padding: '10px 20px', backgroundColor: '#E86A33', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{t('actions.retry', 'Try Again')}</button>
      </div>
    );
  }

  const filteredActivities = (data.recentActivity || []).filter(act => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (act.title && act.title.toLowerCase().includes(query)) ||
      (act.subtitle && act.subtitle.toLowerCase().includes(query)) ||
      (act.date && act.date.toLowerCase().includes(query))
    );
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.ngo', 'NGO'), to: '/ngo' },
            { label: t('navigation.reports', 'Reports') }
          ]} />
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A1A1A', marginBottom: '8px', fontFamily: '"Playfair Display", serif' }}>{t('ngo.analytics', 'Analytics')}</h1>
          <p style={{ color: '#666', fontSize: '16px' }}>{t('ngo.analyticsDesc', "Track your organization's donation metrics and measure your impact.")}</p>
          <p style={{ color: '#10B981', fontSize: '14px', fontStyle: 'italic', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
             {t('ngo.analyticsQuote', 'Data-driven compassion. A stronger tomorrow.')}
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #EAE5DE', cursor: 'pointer' }}>
          <CalendarIcon size={16} color="#8C7A6B" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14' }}>{t('ngo.last6Months', 'Last 6 Months')}</span>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="ngo-stats-row">
        
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} color="#3B82F6" />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1A1A1A' }}>{data.totalDonationsReceived}</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>{t('ngo.totalDonations', 'Total Donations')}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1A1A1A' }}>{data.totalItemsReceived}</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>{t('ngo.itemsReceived', 'Items Received')}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={24} color="#F59E0B" />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1A1A1A' }}>{data.activeNeeds}</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>{t('ngo.activeNeeds', 'Active Needs')}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#9333EA" />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1A1A1A' }}>{data.fulfilledNeeds}</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>{t('ngo.fulfilledNeeds', 'Fulfilled Needs')}</div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Monthly Activity Chart */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #EAE5DE', minWidth: 0, width: '100%' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>{t('ngo.monthlyActivity', 'Monthly Activity')}</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>{t('ngo.monthlyActivityDesc', 'Donations and items received over the last 6 months.')}</p>
          
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8C7A6B', fontSize: 12 }} dy={10} tickFormatter={(value) => t(`months.${value.toLowerCase()}`, value)} />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#F97316', fontSize: 12 }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#10B981', fontSize: 12 }} dx={10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#F9FAFB' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="donations" name={t('ngo.chartDonations', 'Donations')} barSize={32} fill="#FDBA74" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="items" name={t('ngo.chartItemsReceived', 'Items Received')} stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #EAE5DE', display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', boxShadow: '0 4px 16px rgba(43,29,20,0.03)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2B1D14', marginBottom: '20px', fontFamily: 'Fraunces, serif' }}>{t('ngo.itemCategoryDistribution', 'Item Category Distribution')}</h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.itemCategoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={92}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.itemCategoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '10px', border: '1px solid #EAE5DE', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', padding: '10px 14px' }}
                  formatter={(value, name) => [value, translateCategory(name, t)]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#2B1D14' }}>
                {data.totalItemsReceived || data.itemCategoryDistribution.reduce((sum, item) => sum + (item.value || 0), 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#8C7A6B', fontWeight: 600 }}>{t('ngo.items', 'Items')}</div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '10px', marginTop: '20px' }}>
            {data.itemCategoryDistribution.map((item, idx) => {
              const color = getCategoryColor(item.name, idx);
              const totalSum = data.totalItemsReceived || data.itemCategoryDistribution.reduce((acc, curr) => acc + (curr.value || 0), 0);
              const percentage = totalSum > 0 ? Math.round((item.value / totalSum) * 100) : 0;

              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FAF8F5', borderRadius: '8px', border: '1px solid #F0ECE6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0, boxShadow: `0 2px 4px ${color}50` }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2B1D14' }}>{translateCategory(item.name, t)}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: color }}>
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px' }}>
        
        {/* Monthly Breakdown Table */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #EAE5DE', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #EAE5DE' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>{t('ngo.monthlyBreakdown', 'Monthly Breakdown')}</h3>
          </div>
          <div className="table-responsive-wrapper" style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead style={{ backgroundColor: '#F9FAFB' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{t('ngo.month', 'Month')}</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{t('navigation.donations', 'Donations')}</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{t('ngo.itemsReceived', 'Items Received')}</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{t('ngo.fulfilledNeeds', 'Fulfilled Needs')}</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{t('ngo.impactPeople', 'Impact (People)')}</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyBreakdown.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: idx !== data.monthlyBreakdown.length - 1 ? '1px solid #EAE5DE' : 'none' }}>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{t(`months.${row.month.toLowerCase()}`, row.month)}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#4B5563' }}>{row.donations}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#4B5563' }}>{row.itemsReceived}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#4B5563' }}>{row.fulfilledNeeds}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#4B5563' }}>{row.impact}</td>
                </tr>
              ))}
              {data.monthlyBreakdown.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#8C7A6B' }}>{t('ngo.noHistoricalData', 'No historical data available yet.')}</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #EAE5DE', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #EAE5DE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>{t('ngo.recentActivity', 'Recent Activity')}</h3>
            <button
              onClick={() => setShowAllModal(true)}
              style={{
                background: 'none', border: 'none', fontSize: '14px', color: '#E86A33', fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}
            >
              {t('ngo.viewAll', 'View All')} <ChevronRight size={16} />
            </button>
          </div>
          
          <div style={{ padding: '16px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                onClick={() => handleActivityClick(activity)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px', borderRadius: '10px', cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FDF1EB';
                  e.currentTarget.style.borderColor = '#FCD34D';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: activity.type === 'received' ? '#ECFDF5' : '#F3E8FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {activity.type === 'received' && <Package size={20} color="#10B981" />}
                  {activity.type !== 'received' && <CheckCircle size={20} color="#9333EA" />}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '2px' }}>{activity.title}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activity.subtitle}</div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{activity.date}</div>
                  <div style={{ fontSize: '11px', color: '#C4622D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end', marginTop: '2px' }}>
                    {t('ngo.viewReceipt', 'View Receipt')} <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            ))}

            {data.recentActivity.length === 0 && (
              <div style={{ textAlign: 'center', color: '#8C7A6B', padding: '20px 0' }}>{t('ngo.noRecentActivity', 'No recent activity to display.')}</div>
            )}
          </div>
        </div>

      </div>

      {/* ===== ALL RECENT ACTIVITY & RECEIPTS MODAL ===== */}
      {showAllModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #EAE5DE',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)', width: '100%', maxWidth: '640px',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid #F0ECE6',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#FDFCFB'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2B1D14', fontFamily: 'Fraunces, serif' }}>
                  {t('ngo.allRecentActivity', 'All Recent Receipts & Activity')}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#8C7A6B' }}>
                  {t('ngo.allRecentActivityDesc', 'Click on any receipt or donation event to view details.')}
                </p>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                style={{ background: 'none', border: 'none', color: '#8C7A6B', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Filter Bar */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #F0ECE6', backgroundColor: '#FAFAFA' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8C7A6B' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('ngo.searchReceiptsPlaceholder', 'Search receipts, DON-ID, or donor name...')}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 36px',
                    borderRadius: '8px', border: '1px solid #EAE5DE', fontSize: '13px',
                    outline: 'none', backgroundColor: 'white', color: '#2B1D14'
                  }}
                />
              </div>
            </div>

            {/* Modal Activity List */}
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredActivities.map((activity) => (
                <div 
                  key={activity.id}
                  onClick={() => {
                    setShowAllModal(false);
                    handleActivityClick(activity);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                    border: '1px solid #EAE5DE', backgroundColor: '#FFFDF9',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FDF1EB';
                    e.currentTarget.style.borderColor = '#C4622D';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFDF9';
                    e.currentTarget.style.borderColor = '#EAE5DE';
                  }}
                >
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                    backgroundColor: activity.type === 'received' ? '#DCFCE7' : '#F3E8FF',
                    color: activity.type === 'received' ? '#16A34A' : '#9333EA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {activity.type === 'received' ? <FileText size={20} /> : <CheckCircle size={20} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#2B1D14', marginBottom: '2px' }}>
                      {activity.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#654B35', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activity.subtitle}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', color: '#8C7A6B', fontWeight: 500, display: 'block' }}>{activity.date}</span>
                    <button style={{
                      backgroundColor: '#C4622D', border: 'none', color: 'white',
                      borderRadius: '100px', padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                      marginTop: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px'
                    }}>
                      {t('ngo.viewReceipt', 'View Receipt')} <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredActivities.length === 0 && (
                <div style={{ textAlign: 'center', color: '#8C7A6B', padding: '32px 0', fontSize: '13px', fontStyle: 'italic' }}>
                  {t('ngo.noReceiptsFound', 'No matching receipts or activity records found.')}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #F0ECE6', backgroundColor: '#FDFCFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setShowAllModal(false);
                  navigate('/ngo/donations');
                }}
                style={{
                  backgroundColor: 'white', border: '1px solid #EAE5DE', borderRadius: '100px',
                  padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#654B35', cursor: 'pointer'
                }}
              >
                {t('ngo.goToDonationRequests', 'Go to All Donation Requests')}
              </button>
              <button
                onClick={() => setShowAllModal(false)}
                style={{
                  backgroundColor: '#C4622D', border: 'none', color: 'white', borderRadius: '100px',
                  padding: '8px 18px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                {t('actions.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
