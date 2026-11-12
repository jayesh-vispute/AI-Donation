import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Image as ImageIcon, Search, CheckCircle, Clock, Package, Camera, Brain, ClipboardCheck, ArrowRight, X, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import DetectionResult from '../../components/donor/DetectionResult';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export default function AiDetectedItems() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDetections = async () => {
    try {
      setLoading(true);
      const res = await api.getDonorAiDetections();
      setItems(res || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetections();
  }, []);

  const openModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#16A34A';
      case 'REJECTED': return '#DC2626';
      case 'CONVERTED': return '#8B5CF6';
      default: return '#D97706';
    }
  };

  return (
    <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(16px, 4vw, 32px)', maxWidth: '1400px', margin: '0 auto', color: '#2B1D14', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '24px' }}>
        <Breadcrumbs items={[
          { label: t('common.home', 'Home'), to: '/' },
          { label: t('common.donor', 'Donor'), to: '/donor' },
          { label: t('navigation.aiDetections', 'AI Detected Items') }
        ]} />
        <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800, margin: '0 0 8px 0', fontFamily: 'serif' }}>{t('donor.aiDetectedItems', 'AI Detected Items')}</h1>
        <p style={{ color: '#654B35', margin: 0, fontSize: '15px' }}>{t('donor.aiDetectedDesc', 'View all items detected by our AI from your uploaded images.')}</p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#654B35' }}>{t('donor.loadingAi', 'Loading AI detections...')}</div>
      ) : items.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #EAE5DE', padding: '64px 24px', textAlign: 'center' }}>
            <Box size={64} color="#EAE5DE" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', fontFamily: 'serif' }}>{t('donor.noAiDetections', 'No AI detections available')}</h2>
            <p style={{ color: '#654B35', margin: 0 }}>{t('donor.noAiDesc', 'Items detected from your uploaded images will appear here.')}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {items.map((item) => (
            <div key={item.id} onClick={() => openModal(item)} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #EAE5DE', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s' }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'} onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, textTransform: 'capitalize' }}>{t(`categories.${(item.detected_class || '').toLowerCase()}`, item.detected_class)}</h3>
                    <div style={{ fontSize: '12px', color: '#654B35' }}>{item.category} • {Math.round(item.confidence * 100)}% {t('donor.match', 'match')}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ backgroundColor: getStatusColor(item.status), color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {item.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#4A3D34', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8C7A6B' }}>{t('donor.quantity')}:</span>
                    <span style={{ fontWeight: 500 }}>{item.quantity}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8C7A6B' }}>{t('donor.donation')}:</span>
                    <span style={{ fontWeight: 500 }}>{item.donation_id ? `#${item.donation_id}` : t('donor.pendingCheckout', 'Pending Checkout')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #EAE5DE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{t('donor.aiDetectionDetails', 'AI Detection Details')}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A6B' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', gap: '24px', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#F9F8F6', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                {selectedItem.image_path ? (
                  <DetectionResult 
                    imageUrl={selectedItem.image_path.startsWith('/api') ? `http://localhost:8000${selectedItem.image_path}` : selectedItem.image_path} 
                    items={[{
                      name: selectedItem.detected_class,
                      confidence: selectedItem.confidence,
                      boxes: selectedItem.bbox ? JSON.parse(selectedItem.bbox) : []
                    }]}
                  />
                ) : (
                  <div style={{ color: '#8C7A6B' }}>{t('donor.noImageAvailable', 'No image available')}</div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '24px', textTransform: 'capitalize' }}>{selectedItem.detected_class}</h3>
                    <div style={{ color: '#16A34A', fontWeight: 600, fontSize: '15px' }}>{Math.round(selectedItem.confidence * 100)}% {t('donor.confidenceMatch', 'Confidence Match')}</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAE5DE', paddingBottom: '8px' }}>
                      <span style={{ color: '#8C7A6B' }}>{t('donor.category')}:</span>
                      <span style={{ fontWeight: 500 }}>{selectedItem.category || t('donor.general', 'General')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAE5DE', paddingBottom: '8px' }}>
                      <span style={{ color: '#8C7A6B' }}>{t('donor.subcategory')}:</span>
                      <span style={{ fontWeight: 500 }}>{selectedItem.subcategory || t('donor.general', 'General')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAE5DE', paddingBottom: '8px' }}>
                      <span style={{ color: '#8C7A6B' }}>{t('donor.quantity')}:</span>
                      <span style={{ fontWeight: 500 }}>{selectedItem.quantity}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAE5DE', paddingBottom: '8px' }}>
                      <span style={{ color: '#8C7A6B' }}>{t('donor.condition')}:</span>
                      <span style={{ fontWeight: 500 }}>{selectedItem.condition || 'GOOD'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#FFF5F0', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#C4622D', fontWeight: 600 }}>{t('donor.aiStatus', 'AI Status')}</span>
                      <div style={{ backgroundColor: getStatusColor(selectedItem.status), color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                        {selectedItem.status.replace('_', ' ')}
                      </div>
                    </div>
                    
                    <div style={{ borderTop: '1px solid rgba(196, 98, 45, 0.2)', margin: '4px 0' }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#C4622D', fontWeight: 600 }}>{t('donor.relatedDonation', 'Related Donation')}</span>
                      {selectedItem.donation_id ? (
                        <button 
                          onClick={() => {
                            setIsModalOpen(false);
                            navigate(`/donations/${selectedItem.donation_id}`);
                          }}
                          style={{ background: 'none', border: 'none', color: '#C4622D', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {t('donor.viewDonationId', 'View Donation #{{id}}', { id: selectedItem.donation_id })} <ExternalLink size={14} />
                        </button>
                      ) : (
                        <span style={{ fontWeight: 500, color: '#8C7A6B' }}>{t('donor.pendingCheckout', 'Pending Checkout')}</span>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(196, 98, 45, 0.2)', margin: '4px 0' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#C4622D', fontWeight: 600 }}>{t('donor.detectionDate', 'Detection Date')}</span>
                      <span style={{ fontWeight: 500, color: '#8C7A6B', fontSize: '14px' }}>
                        {new Date(selectedItem.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #EAE5DE', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#FAFAFA' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', color: '#fff', backgroundColor: '#2B1D14', fontWeight: 600, cursor: 'pointer' }}>
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
