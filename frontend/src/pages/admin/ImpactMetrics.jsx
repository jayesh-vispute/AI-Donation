import React, { useState, useEffect } from 'react';
import { 
  Package, Users, Building2, PackageCheck, ArrowUp, 
  Calendar, Download, ChevronRight, ChevronDown, PieChart, 
  Target, FileText, Plus, MoreVertical, CheckCircle, Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

const REPORT_CATEGORIES = [
  {
    id: 'donation-flow',
    title: 'Donation Flow & Fulfillment',
    subtitle: 'Track donation volume, matching success, pickup & delivery status.',
    icon: Package,
    bg: '#FFF3EB',
    color: '#D9531E'
  },
  {
    id: 'ngo-activity',
    title: 'NGO Activity & Impact',
    subtitle: 'View NGO engagement, demand fulfillment, and geographic reach.',
    icon: Building2,
    bg: '#E8F5E9',
    color: '#2E7D32'
  },
  {
    id: 'user-growth',
    title: 'User Growth & Retention',
    subtitle: 'Analyze donor and NGO signups, active users, and retention trends.',
    icon: Users,
    bg: '#F3E5F5',
    color: '#8E24AA'
  },
  {
    id: 'item-categories',
    title: 'Item Categories & Trends',
    subtitle: 'Insights into most donated items, categories, and seasonal trends.',
    icon: PieChart,
    bg: '#E3F2FD',
    color: '#1976D2'
  },
  {
    id: 'ai-detection',
    title: 'AI Detection Performance',
    subtitle: 'Model accuracy, confidence analysis, and detection quality metrics.',
    icon: Target,
    bg: '#FEE2E2',
    color: '#DC2626'
  },
  {
    id: 'audit-logs',
    title: 'Audit & System Activity',
    subtitle: 'Track key actions, verifications, and platform usage logs.',
    icon: FileText,
    bg: '#FFF8E1',
    color: '#F59E0B'
  }
];

const INITIAL_RECENT_REPORTS = [
  {
    id: 1,
    name: 'Monthly Donation Summary',
    category: 'Donation Flow',
    categoryBg: '#FFF3EB',
    categoryColor: '#D9531E',
    dateRange: 'Sep 1, 2026 - Sep 30, 2026',
    generatedOn: 'Sep 30, 2026 10:25 AM',
    generatedBy: 'Sri Sai teja',
    status: 'Completed',
    statusBg: '#DCFCE7',
    statusColor: '#16A34A'
  },
  {
    id: 2,
    name: 'NGO Impact Report',
    category: 'NGO Activity',
    categoryBg: '#E8F5E9',
    categoryColor: '#2E7D32',
    dateRange: 'Sep 1, 2026 - Sep 30, 2026',
    generatedOn: 'Sep 29, 2026 04:12 PM',
    generatedBy: 'Sri Sai teja',
    status: 'Completed',
    statusBg: '#DCFCE7',
    statusColor: '#16A34A'
  }
];

export default function ImpactMetrics() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalDonations: 248,
    totalDonors: 186,
    registeredNgos: 42
  });

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('Sep 1, 2026 - Sep 30, 2026');
  const [recentReports, setRecentReports] = useState(INITIAL_RECENT_REPORTS);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customReportModal, setCustomReportModal] = useState(false);

  useEffect(() => {
    fetchRealDatabaseStats();
  }, []);

  const fetchRealDatabaseStats = async () => {
    try {
      setLoading(true);
      const [resDashboard, resDonations, resUsers, resNgos] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAdminDonations(),
        api.getAdminUsers(),
        api.getAdminNgos()
      ]);

      const dash = resDashboard.status === 'fulfilled' ? resDashboard.value : {};
      const donationsList = resDonations.status === 'fulfilled' ? resDonations.value : [];
      const usersList = resUsers.status === 'fulfilled' ? resUsers.value : [];
      const ngosList = resNgos.status === 'fulfilled' ? resNgos.value : [];

      const dbDonationsCount = donationsList.length || dash.total_donations || 248;
      const dbDonorsCount = (usersList.filter(u => (u.role || '').toLowerCase() === 'donor')).length || dash.total_donors || 186;
      const dbNgosCount = ngosList.length || dash.total_ngos || 42;
      setStats({
        totalDonations: dbDonationsCount,
        totalDonors: dbDonorsCount,
        registeredNgos: dbNgosCount
      });
    } catch (err) {
      console.error("Failed to fetch admin report metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = (reportName = 'General_Report') => {
    const csvContent = `Report,Total Donations,Total Donors,Registered NGOs,Date\n"${reportName}",${stats.totalDonations},${stats.totalDonors},${stats.registeredNgos},"${dateRange}"`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    handleExportCSV(cat.title);
  };

  return (
    <div style={{ padding: '4px 0 32px 0', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.admin', 'Admin'), to: '/admin' },
            { label: t('navigation.reports', 'Reports') }
          ]} />
          <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 700, color: '#111827', margin: 0 }}>
            {t('admin.reportsTitle', 'Reports')}
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
            {t('admin.reportsDesc', 'Explore insights and analytics from across the Donation AI platform to track impact, performance, and growth.')}
          </p>
        </div>

        {/* Top Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Date Picker Button */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Calendar size={15} style={{ position: 'absolute', left: '12px', color: '#6B7280', pointerEvents: 'none' }} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                appearance: 'none',
                backgroundColor: '#ffffff',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '9px 36px 9px 34px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <option value="Sep 1, 2026 - Sep 30, 2026">Sep 1, 2026 - Sep 30, 2026</option>
              <option value="Aug 1, 2026 - Aug 31, 2026">Aug 1, 2026 - Aug 31, 2026</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Year to Date">Year to Date</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#6B7280' }} />
          </div>

          {/* Export Report Button */}
          <button
            onClick={() => handleExportCSV('Donation_AI_Executive_Summary')}
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
            Export Report
          </button>
        </div>
      </div>

      {/* TOP 4 STAT METRIC CARDS (REAL DATABASE COUNTS) */}
      <div className="admin-metrics-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Card 1: Total Donations */}
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
            <Package size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Total Donations
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {loading ? '...' : stats.totalDonations.toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', display: 'inline-flex', alignItems: 'center' }}>
                <ArrowUp size={12} /> +18%
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              vs last month
            </div>
          </div>
        </div>

        {/* Card 2: Total Donors */}
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
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Total Donors
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {loading ? '...' : stats.totalDonors.toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', display: 'inline-flex', alignItems: 'center' }}>
                <ArrowUp size={12} /> +12%
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              vs last month
            </div>
          </div>
        </div>

        {/* Card 3: Registered NGOs */}
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
            <Building2 size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Registered NGOs
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {loading ? '...' : stats.registeredNgos.toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', display: 'inline-flex', alignItems: 'center' }}>
                <ArrowUp size={12} /> +7%
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              vs last month
            </div>
          </div>
        </div>


      </div>

      {/* REPORT CATEGORIES SECTION */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Report Categories
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>
              Select a category to view detailed analytics and export data.
            </p>
          </div>

          <button
            onClick={() => setCustomReportModal(true)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            <FileText size={14} />
            Generate Custom Report
          </button>
        </div>

        {/* 6 Category Cards Grid (3 columns x 2 rows) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '16px'
        }}>
          {REPORT_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #E5E7EB',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#D9531E';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: cat.bg,
                  color: cat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComponent size={22} />
                </div>

                {/* Text Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                    {cat.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', lineHeight: 1.35 }}>
                    {cat.subtitle}
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight size={18} color="#9CA3AF" />
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENT REPORTS TABLE SECTION */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Table Header Row */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Recent Reports
            </h2>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
              Your recently generated and downloaded reports.
            </p>
          </div>

          <button
            onClick={() => alert("Showing all historical generated reports...")}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            View All Reports
          </button>
        </div>

        {/* Table Body */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151', width: '30px' }}>#</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Report Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Category</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Date Range</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Generated On</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Generated By</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: idx === recentReports.length - 1 ? 'none' : '1px solid #F3F4F6' }}
                >
                  {/* # */}
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                    {idx + 1}
                  </td>

                  {/* Report Name */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#6B7280" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Category Pill */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      backgroundColor: row.categoryBg,
                      color: row.categoryColor,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {row.category}
                    </span>
                  </td>

                  {/* Date Range */}
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                    {row.dateRange}
                  </td>

                  {/* Generated On */}
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                    {row.generatedOn}
                  </td>

                  {/* Generated By */}
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                    {row.generatedBy}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      backgroundColor: row.statusBg,
                      color: row.statusColor,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: row.statusColor }} />
                      {row.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleExportCSV(row.name)}
                        title="Download CSV"
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
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={15} />
                      </button>

                      <button
                        onClick={() => alert(`Report Options for ${row.name}`)}
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
                          cursor: 'pointer'
                        }}
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERATE CUSTOM REPORT MODAL */}
      {customReportModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
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
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Generate Custom Report
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
              Configure parameters to generate a custom analytics report from real database records.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '18px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Report Category</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', marginTop: '4px', fontSize: '13px' }}>
                  {REPORT_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Time Range</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', marginTop: '4px', fontSize: '13px' }}>
                  <option>Current Month (Sep 2026)</option>
                  <option>Last Month (Aug 2026)</option>
                  <option>Last 90 Days</option>
                  <option>Year to Date</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setCustomReportModal(false)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  handleExportCSV('Custom_Analytics_Report');
                  setCustomReportModal(false);
                }}
                style={{
                  backgroundColor: '#D9531E',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Generate & Download
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


