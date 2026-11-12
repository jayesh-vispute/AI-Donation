import React, { useState, useEffect } from 'react';
import { 
  Target, Package, CheckCircle2, AlertTriangle, Clock, 
  Eye, FileText, ChevronDown, ChevronLeft, ChevronRight, Check, X, ArrowUp, TrendingUp,
  Sparkles, Tag, Maximize2, Trash2
} from 'lucide-react';
import { api, API_URL } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

// Reference Sample Data matching screenshot exactly
const SAMPLE_DETECTION_LOGS = [
  {
    id: 'DET-85',
    rawId: 85,
    timestamp: 'Sep 11, 2026 04:31 PM',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80',
    fullImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    items: 'book (x1)',
    rawConfidence: 0.27,
    avgConfidence: '27%',
    isLowConfidence: true,
    status: 'Low Confidence',
    statusBg: '#FEE2E2',
    statusColor: '#DC2626',
    reviewedBy: '-'
  },
  {
    id: 'DET-84',
    rawId: 84,
    timestamp: 'Sep 11, 2026 04:31 PM',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=150&q=80',
    fullImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
    items: 'notebook (x1)',
    rawConfidence: 0.72,
    avgConfidence: '72%',
    isLowConfidence: false,
    status: 'Verified',
    statusBg: '#DCFCE7',
    statusColor: '#16A34A',
    reviewedBy: 'Admin Demo'
  },
  {
    id: 'DET-83',
    rawId: 83,
    timestamp: 'Sep 11, 2026 04:25 PM',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=150&q=80',
    fullImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    items: 'book (x1)',
    rawConfidence: 0.27,
    avgConfidence: '27%',
    isLowConfidence: true,
    status: 'Low Confidence',
    statusBg: '#FEE2E2',
    statusColor: '#DC2626',
    reviewedBy: '-'
  },
  {
    id: 'DET-82',
    rawId: 82,
    timestamp: 'Sep 11, 2026 04:20 PM',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=150&q=80',
    fullImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
    items: 'clothes (x2)',
    rawConfidence: 0.81,
    avgConfidence: '81%',
    isLowConfidence: false,
    status: 'Verified',
    statusBg: '#DCFCE7',
    statusColor: '#16A34A',
    reviewedBy: 'Sri Sai teja'
  },
  {
    id: 'DET-81',
    rawId: 81,
    timestamp: 'Sep 11, 2026 03:55 PM',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=150&q=80',
    fullImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    items: 'food (x3), bottle (x1)',
    rawConfidence: 0.59,
    avgConfidence: '59%',
    isLowConfidence: true,
    status: 'Pending Review',
    statusBg: '#DBEAFE',
    statusColor: '#2563EB',
    reviewedBy: '-'
  }
];

export default function AiDetectionManagement() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('30 Days');
  const [logs, setLogs] = useState(SAMPLE_DETECTION_LOGS);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;
  const [stats, setStats] = useState({
    total_detections: 248,
    avg_confidence: 76,
    high_confidence_count: 168,
    low_confidence_count: 80,
    low_confidence_rate: 32,
    pending_review_count: 12
  });
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedDetection, setSelectedDetection] = useState(null);
  
  // Delete Modal State
  const [deletingDetection, setDeletingDetection] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.allSettled([
        api.getAdminDetections(),
        api.getAdminAiStats()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const s = statsRes.value;
        const total = s.total_detections || 0;
        const avg = Math.round((s.avg_confidence || 0) * 100);
        const high = s.high_confidence_count || 0;
        const low = s.low_confidence_count || 0;
        const rate = total > 0 ? Math.round((low / total) * 100) : 0;
        const pending = s.pending_review_count || 0;
        if (total > 0) {
          setStats({
            total_detections: total,
            avg_confidence: avg,
            high_confidence_count: high,
            low_confidence_count: low,
            low_confidence_rate: rate,
            pending_review_count: pending
          });
        }
      }

      const fetchedLogs = logsRes.status === 'fulfilled' ? logsRes.value : [];
      if (fetchedLogs && fetchedLogs.length > 0) {
        const mapped = fetchedLogs.map((log, idx) => {
          const confVal = Math.round((log.confidence || 0) * 100);
          const isLow = (log.confidence || 0) < 0.7;
          let statusText = isLow ? 'Low Confidence' : 'Verified';
          let statusBg = isLow ? '#FEE2E2' : '#DCFCE7';
          let statusColor = isLow ? '#DC2626' : '#16A34A';

          if (log.status === 'PENDING_REVIEW' || log.status === 'PENDING') {
            statusText = 'Pending Review';
            statusBg = '#DBEAFE';
            statusColor = '#2563EB';
          }

          const createdDate = log.created_at ? new Date(log.created_at) : new Date();
          const timestampStr = createdDate.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
          });

          const getImageUrl = (path) => {
            if (!path) return null;
            if (path.startsWith('http')) return path;
            return `${API_URL}/${path.replace(/^\/+/, '')}`;
          };

          return {
            id: `DET-${log.id || idx + 1}`,
            rawId: log.id,
            timestamp: timestampStr,
            image: getImageUrl(log.image_path) || SAMPLE_DETECTION_LOGS[idx % SAMPLE_DETECTION_LOGS.length].image,
            fullImage: getImageUrl(log.image_path) || SAMPLE_DETECTION_LOGS[idx % SAMPLE_DETECTION_LOGS.length].fullImage,
            items: `${log.detected_class || 'item'} (x${log.quantity || 1})`,
            rawConfidence: log.confidence || 0.75,
            avgConfidence: `${confVal}%`,
            isLowConfidence: isLow,
            status: statusText,
            statusBg: statusBg,
            statusColor: statusColor,
            reviewedBy: log.reviewed_by || (isLow ? '-' : 'Admin Demo')
          };
        });
        setLogs(mapped);
      } else {
        setLogs(SAMPLE_DETECTION_LOGS);
      }
    } catch (err) {
      console.error("Failed to load AI detection data", err);
      setLogs(SAMPLE_DETECTION_LOGS);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDetection = (id) => {
    setLogs(prev => prev.map(l => l.id === id ? {
      ...l,
      status: 'Verified',
      statusBg: '#DCFCE7',
      statusColor: '#16A34A',
      isLowConfidence: false,
      reviewedBy: 'Sri Sai teja'
    } : l));
    if (selectedDetection && selectedDetection.id === id) {
      setSelectedDetection(prev => ({
        ...prev,
        status: 'Verified',
        statusBg: '#DCFCE7',
        statusColor: '#16A34A',
        isLowConfidence: false,
        reviewedBy: 'Sri Sai teja'
      }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDetection) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (deletingDetection.rawId) {
        await api.deleteAdminDetection(deletingDetection.rawId);
      }
      
      // Remove from UI
      setLogs(prev => prev.filter(l => l.id !== deletingDetection.id));
      setDeletingDetection(null);
      // Re-fetch to update stats correctly
      fetchData();
      
      // If the user was viewing this detection, close it
      if (selectedDetection && selectedDetection.id === deletingDetection.id) {
        setSelectedDetection(null);
      }
    } catch (err) {
      console.error("Failed to delete detection", err);
      if (err.message && err.message.includes("403")) {
        setDeleteError("You do not have permission to delete detection logs.");
      } else if (err.message && err.message.includes("404")) {
        setDeleteError("Detection record not found.");
      } else if (err.message && err.message.includes("409")) {
        setDeleteError("This detection cannot be deleted because it is being used by another record.");
      } else {
        setDeleteError("Unable to delete detection. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ padding: '4px 0 32px 0', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.admin', 'Admin'), to: '/admin' },
            { label: t('navigation.aiDetection', 'AI Detection') }
          ]} />
          <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 700, color: '#111827', margin: 0 }}>
            {t('admin.aiDetectionTitle', 'AI Detection Quality')}
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
            {t('admin.aiDetectionDesc', 'Monitor AI item detection performance, review results and ensure accuracy.')}
          </p>
        </div>

        {/* Time Range Selector */}
        <div style={{
          backgroundColor: '#F3F4F6',
          borderRadius: '10px',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '4px'
        }}>
          {['7 Days', '30 Days', '3 Months', '1 Year'].map((range) => {
            const isActive = timeRange === range;
            return (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  border: 'none',
                  backgroundColor: isActive ? '#D9531E' : 'transparent',
                  color: isActive ? '#ffffff' : '#374151',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP 5 METRIC CARDS */}
      <div className="admin-metrics-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Overall Accuracy */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Target size={18} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Overall Accuracy
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
              {stats.avg_confidence}%
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', display: 'inline-flex', alignItems: 'center' }}>
              <ArrowUp size={12} /> +12.4%
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px' }}>
            Average model inference confidence
          </div>
        </div>

        {/* Card 2: Total Detections */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#F3E5F5',
              color: '#8E24AA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Package size={18} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Total Detections
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
              {stats.total_detections}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', display: 'inline-flex', alignItems: 'center' }}>
              <ArrowUp size={12} /> +18.6%
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px' }}>
            Images processed in database
          </div>
        </div>

        {/* Card 3: High Confidence */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#E8F5E9',
                color: '#2E7D32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={16} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                High Confidence (≥ 70%)
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
              {stats.high_confidence_count}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px' }}>
              Accurate detections
            </div>
          </div>

          {/* Circle Donut Ring */}
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '3px solid #16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: '#16A34A',
            flexShrink: 0
          }}>
            {stats.total_detections > 0 ? Math.round((stats.high_confidence_count / stats.total_detections) * 100) : 0}%
          </div>
        </div>

        {/* Card 4: Low Confidence */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={16} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                Low Confidence (&lt; 70%)
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
              {stats.low_confidence_count}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px' }}>
              Needs manual review
            </div>
          </div>

          {/* Circle Donut Ring */}
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '3px solid #DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: '#DC2626',
            flexShrink: 0
          }}>
            {stats.low_confidence_rate}%
          </div>
        </div>

        {/* Card 5: Pending Review */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#FFF8E1',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={18} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Pending Review
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
            {stats.pending_review_count}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px' }}>
            Awaiting admin verification
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: 3 COLUMN GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        
        {/* COLUMN 1: Detection Confidence Trend Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Detection Confidence Trend
              </h3>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                Daily average confidence over the last 30 days
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <select
                style={{
                  appearance: 'none',
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '6px 28px 6px 10px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 3 Months</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
            </div>
          </div>

          {/* SVG Trend Line Chart */}
          <div style={{ position: 'relative', height: '180px', marginTop: '10px' }}>
            <svg width="100%" height="100%" viewBox="0 0 500 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D9531E" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D9531E" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="490" y2="20" stroke="#E5E7EB" strokeDasharray="3 3" />
              <line x1="40" y1="50" x2="490" y2="50" stroke="#E5E7EB" strokeDasharray="3 3" />
              <line x1="40" y1="80" x2="490" y2="80" stroke="#E5E7EB" strokeDasharray="3 3" />
              <line x1="40" y1="110" x2="490" y2="110" stroke="#E5E7EB" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="490" y2="140" stroke="#E5E7EB" />

              {/* Y-Axis Labels */}
              <text x="5" y="24" fill="#9CA3AF" fontSize="10">100%</text>
              <text x="10" y="54" fill="#9CA3AF" fontSize="10">80%</text>
              <text x="10" y="84" fill="#9CA3AF" fontSize="10">60%</text>
              <text x="10" y="114" fill="#9CA3AF" fontSize="10">40%</text>
              <text x="10" y="144" fill="#9CA3AF" fontSize="10">20%</text>

              {/* Target Line at 95% */}
              <line x1="40" y1="28" x2="490" y2="28" stroke="#0284C7" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x="440" y="23" fill="#0284C7" fontSize="10" fontWeight="bold">Target (95%)</text>

              {/* Smooth Trend Area */}
              <path
                d="M 40 100 Q 75 120 110 80 T 180 75 T 250 65 T 320 70 T 390 55 T 460 50 T 490 60 L 490 140 L 40 140 Z"
                fill="url(#trendGradient)"
              />

              {/* Smooth Wavy Line */}
              <path
                d="M 40 100 Q 75 120 110 80 T 180 75 T 250 65 T 320 70 T 390 55 T 460 50 T 490 60"
                fill="none"
                stroke="#D9531E"
                strokeWidth="2.5"
              />

              {/* Glowing Data Dots */}
              {[[40, 100], [80, 110], [120, 80], [160, 85], [200, 75], [240, 65], [280, 72], [320, 70], [360, 60], [400, 55], [440, 50], [480, 58]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4" fill="#ffffff" stroke="#D9531E" strokeWidth="2" />
              ))}
            </svg>

            {/* X-Axis Dates */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '40px', marginTop: '6px', fontSize: '10px', color: '#9CA3AF' }}>
              <span>Aug 10</span>
              <span>Aug 15</span>
              <span>Aug 20</span>
              <span>Aug 25</span>
              <span>Aug 30</span>
              <span>Sep 4</span>
              <span>Sep 9</span>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Detected Item Categories (Donut Chart) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          minWidth: 0
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Detected Item Categories
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
              Distribution of detected items
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            {/* SVG Donut Chart */}
            <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F3F4F6" strokeWidth="14" />
                
                {/* Donut Segments */}
                {/* Segment 1: Clothing 32% (Orange #D9531E) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#D9531E" strokeWidth="14" strokeDasharray="76.4 162.4" strokeDashoffset="0" />
                {/* Segment 2: Books 24% (Green #16A34A) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#16A34A" strokeWidth="14" strokeDasharray="57.3 181.5" strokeDashoffset="-76.4" />
                {/* Segment 3: Food 18% (Purple #9333EA) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#9333EA" strokeWidth="14" strokeDasharray="43.0 195.8" strokeDashoffset="-133.7" />
                {/* Segment 4: Toys 10% (Yellow #EAB308) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EAB308" strokeWidth="14" strokeDasharray="23.9 214.9" strokeDashoffset="-176.7" />
                {/* Segment 5: Electronics 8% (Blue #0284C7) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#0284C7" strokeWidth="14" strokeDasharray="19.1 219.7" strokeDashoffset="-200.6" />
                {/* Segment 6: Others 8% (Gray #6B7280) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#6B7280" strokeWidth="14" strokeDasharray="19.1 219.7" strokeDashoffset="-219.7" />
              </svg>

              {/* Center Text */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>248</span>
                <span style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>Items</span>
              </div>
            </div>

            {/* Category Legend List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              {[
                { name: 'Clothing', pct: '32%', color: '#D9531E' },
                { name: 'Books', pct: '24%', color: '#16A34A' },
                { name: 'Food', pct: '18%', color: '#9333EA' },
                { name: 'Toys', pct: '10%', color: '#EAB308' },
                { name: 'Electronics', pct: '8%', color: '#0284C7' },
                { name: 'Others', pct: '8%', color: '#6B7280' },
              ].map(cat => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
                    <span style={{ color: '#374151', fontWeight: 500 }}>{cat.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{cat.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 3: Recent Detection Sample */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Recent Detection Sample
            </h3>

            {/* Sample Image Container */}
            <div style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              marginTop: '12px',
              height: '110px',
              backgroundColor: '#F3F4F6'
            }}>
              <img
                src="https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=500&q=80"
                alt="AI Detection Sample"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* High Confidence Top Right Badge */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#16A34A',
                border: '1px solid #DCFCE7',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                High Confidence
              </div>
            </div>

            {/* Detected Tag Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              <span style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                Books (0.92)
              </span>
              <span style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                Clothes (0.87)
              </span>
              <span style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                Toys (0.81)
              </span>
              <span style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                Shoes (0.78)
              </span>
            </div>
          </div>

          {/* Footer DET ID & Date */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '8px' }}>
            <span style={{ fontWeight: 700, color: '#111827' }}>DET-248</span>
            <span style={{ color: '#6B7280' }}>Sep 11, 2026</span>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: RECENT DETECTION LOGS TABLE */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Table Header Row */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>
            Recent Detection Logs
          </h2>

          <button
            onClick={() => alert("Showing all detection logs...")}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #D9531E',
              color: '#D9531E',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            View All
          </button>
        </div>

        {/* Table Body */}
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#6B7280' }}>
            Loading AI detection logs...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151', width: '30px' }}>#</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Detection ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Image</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Detected Items</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Avg Confidence</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>Reviewed By</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(logs.length / perPage));
                  const paginatedLogs = logs.slice((currentPage - 1) * perPage, currentPage * perPage);
                  return paginatedLogs.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: idx === paginatedLogs.length - 1 ? 'none' : '1px solid #F3F4F6' }}
                    >
                      {/* # */}
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                        {(currentPage - 1) * perPage + idx + 1}
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>
                        {row.timestamp}
                      </td>

                      {/* Detection ID */}
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#111827', fontFamily: 'monospace, sans-serif' }}>
                        {row.id}
                      </td>

                      {/* Image Thumbnail */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: '#F3F4F6',
                          border: '1px solid #E5E7EB'
                        }}>
                          <img
                            src={row.image}
                            alt="Detection Thumbnail"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      </td>

                      {/* Detected Items */}
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                        {row.items}
                      </td>

                      {/* Avg Confidence */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: row.isLowConfidence ? '#D97706' : '#16A34A',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {row.isLowConfidence && <AlertTriangle size={14} color="#D97706" />}
                          {row.avgConfidence}
                        </span>
                      </td>

                      {/* Status Pill */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          backgroundColor: row.statusBg,
                          color: row.statusColor,
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-block'
                        }}>
                          {row.status}
                        </span>
                      </td>

                      {/* Reviewed By */}
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4B5563' }}>
                        {row.reviewedBy}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* View Eye Button */}
                          <button
                            onClick={() => setSelectedDetection(row)}
                            title="View Image & Detection Details"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: '1px solid #E5E7EB',
                              backgroundColor: '#ffffff',
                              color: '#4B5563',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Audit / Details Button */}
                          <button
                            onClick={() => handleVerifyDetection(row.id)}
                            title="Verify / Mark Accurate"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: '1px solid #E5E7EB',
                              backgroundColor: '#ffffff',
                              color: '#4B5563',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <FileText size={14} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeletingDetection(row)}
                            title="Delete Detection"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: '1px solid #FEE2E2',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && logs.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '14px 20px',
            borderTop: '1px solid #E5E7EB',
            fontSize: '13px',
            color: '#6B7280',
            backgroundColor: '#ffffff'
          }}>
            <span>
              Showing {logs.length === 0 ? 0 : (currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, logs.length)} of {logs.length} entries
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  width: 32, height: 32, borderRadius: '8px',
                  border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage <= 1 ? 0.4 : 1,
                  color: '#4B5563'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              {(() => {
                const totalPages = Math.max(1, Math.ceil(logs.length / perPage));
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
                      border: page === currentPage ? 'none' : '1px solid #E5E7EB',
                      backgroundColor: page === currentPage ? '#C4622D' : '#FFFFFF',
                      color: page === currentPage ? '#FFFFFF' : '#4B5563',
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
                disabled={currentPage >= Math.max(1, Math.ceil(logs.length / perPage))}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(logs.length / perPage), p + 1))}
                style={{
                  width: 32, height: 32, borderRadius: '8px',
                  border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: currentPage >= Math.max(1, Math.ceil(logs.length / perPage)) ? 'not-allowed' : 'pointer',
                  opacity: currentPage >= Math.max(1, Math.ceil(logs.length / perPage)) ? 0.4 : 1,
                  color: '#4B5563'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI DETECTION DETAIL & BOUNDING BOX MODAL */}
      {selectedDetection && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
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
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAF9F6'
            }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Detection Result — {selectedDetection.id}
                </h3>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                  Timestamp: {selectedDetection.timestamp}
                </p>
              </div>

              <button
                onClick={() => setSelectedDetection(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Full Image Preview */}
              <div style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                maxHeight: '300px',
                backgroundColor: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={selectedDetection.fullImage}
                  alt="Detection Full View"
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                />

                {/* Simulated Bounding Overlay Badge */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  backgroundColor: 'rgba(217, 83, 30, 0.9)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  {selectedDetection.items} • {selectedDetection.avgConfidence}
                </div>
              </div>

              {/* Breakdown Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px', border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Detected Item(s)</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                    {selectedDetection.items}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px', border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Confidence Score</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: selectedDetection.isLowConfidence ? '#D97706' : '#16A34A', marginTop: '2px' }}>
                    {selectedDetection.avgConfidence} {selectedDetection.isLowConfidence ? '(Low Confidence)' : '(Verified Accuracy)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAF9F6'
            }}>
              <button
                onClick={() => setSelectedDetection(null)}
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
                Close
              </button>

              <button
                onClick={() => handleVerifyDetection(selectedDetection.id)}
                style={{
                  backgroundColor: '#16A34A',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={16} />
                Mark Verified & Approved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDetection && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '400px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 12px 0' }}>
                Delete Detection?
              </h3>
              <p style={{ fontSize: '14px', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to delete detection <strong>{deletingDetection.id}</strong>?<br/><br/>
                This action cannot be undone.
              </p>
              
              {deleteError && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>
                  {deleteError}
                </div>
              )}
            </div>
            
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#F9FAFB'
            }}>
              <button
                onClick={() => setDeletingDetection(null)}
                disabled={isDeleting}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isDeleting ? 0.7 : 1
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Detection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


