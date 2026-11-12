import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Image as ImageIcon, ScanEye, Camera, Leaf, Heart, 
  CheckCircle, Plus, Minus, Check, Crop, Trash2, Edit2, AlertCircle, Sparkles, Package, Lightbulb
} from 'lucide-react';
import { api } from '../../services/api';
import DetectionResult from '../../components/donor/DetectionResult';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export default function Results() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const file = location.state?.file;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const analyzeImage = async () => {
    if (!file) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await api.predictImage(file);
      setResult(data);
    } catch (err) {
      let errorMsg = t('donor.detectErrorGeneral', "We couldn't identify the items in this image.");
      const msg = err.message || '';
      
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
        errorMsg = t('donor.detectErrorNetwork', 'Unable to connect to the server.');
      } else if (msg.includes('unavailable') || msg.includes('runtime') || msg.includes('server error')) {
        errorMsg = t('donor.detectErrorServer', 'AI detection is temporarily unavailable.');
      } else if (msg.includes('valid image') || msg.includes('empty') || msg.includes('exceeds')) {
        errorMsg = t('donor.detectErrorInvalid', 'Please upload a valid image.');
      } else {
        errorMsg = msg; // Use the backend's safe user-facing message directly if possible
      }
      setError(errorMsg);
    } finally {
      setTimeout(() => setLoading(false), 1500);
    }
  };

  useEffect(() => {
    // If we refresh, file might be a plain empty object (since File is not serializable)
    if (!file || !(file instanceof Blob)) {
      navigate('/detect');
      return;
    }
    try {
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
      analyzeImage();
      return () => URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error('Invalid file object', e);
      navigate('/detect');
    }
  }, [file, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinueToCart = () => {
    navigate('/item-cart', {
      state: {
        items: (result?.items || []).map((item) => ({
          name: item.detected_class || item.name || t('donor.unknownItem', 'Unknown Item'),
          quantity: item.quantity,
          confidence: item.confidence,
          category: item.category || t('donor.categoryGeneral', 'General'),
          subcategory: item.subcategory || t('donor.subcategoryGeneral', 'General Items'),
          condition: item.condition || t('donor.conditionGood', 'Good'),
          ai_detection_id: item.id,
        })),
        imageUrl: result?.image_url || imageUrl,
        imageId: result?.image_id,
      },
    });
  };

  const updateQuantity = (idx, delta) => {
    setResult((prev) => {
      const newItems = [...prev.items];
      newItems[idx].quantity = Math.max(1, newItems[idx].quantity + delta);
      const total = newItems.reduce((sum, item) => sum + item.quantity, 0);
      return { ...prev, items: newItems, total_items: total };
    });
  };

  const removeItem = (idx) => {
    setResult((prev) => {
      const newItems = prev.items.filter((_, i) => i !== idx);
      const total = newItems.reduce((sum, item) => sum + item.quantity, 0);
      return { ...prev, items: newItems, total_items: total };
    });
  };

  const handleAddManualItem = () => {
    const name = prompt(t('donor.enterItemName', 'Enter item name (e.g. Chair, Table, Book):'));
    if (!name || !name.trim()) return;
    setResult((prev) => {
      const newItem = {
        name: name.trim(),
        confidence: 1.0,
        category: t('donor.categoryGeneral', 'General'),
        quantity: 1,
        condition: t('donor.conditionGood', 'Good'),
        requires_review: false,
        boxes: []
      };
      const items = [...(prev?.items || []), newItem];
      const total = items.reduce((sum, item) => sum + item.quantity, 0);
      return { ...prev, items, total_items: total };
    });
  };

  if (!file) return null;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#2B1D14', paddingBottom: '40px' }}>
      
      {/* Header Section */}
      <div className="ai-results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.donor', 'Donor'), to: '/donor' },
            { label: t('navigation.donate', 'Donate'), to: '/donate' },
            { label: t('donor.aiDetection', 'AI Detection') }
          ]} />

          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontFamily: 'Fraunces, serif', margin: '0 0 8px 0', color: '#2B1D14', fontWeight: 700 }}>{t('donor.aiDetection', 'AI Detection')}</h1>
          <p style={{ color: '#4A3D34', fontSize: '16px', margin: 0 }}>
            {t('donor.aiDetectionDesc', 'Our AI identifies items in your image to help you donate faster.')}
          </p>
        </div>

        {/* Decorative Quote */}
        <div style={{ position: 'relative', width: '220px', height: '100px', display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#FDF1EB', borderRadius: '50%', width: '180px', height: '90px', transform: 'rotate(-5deg)', zIndex: 1 }}></div>
          <div style={{ position: 'relative', zIndex: 2, fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '18px', color: '#2B1D14', textAlign: 'center', transform: 'rotate(-5deg)', padding: '20px 20px 0 0', lineHeight: 1.3 }}
               dangerouslySetInnerHTML={{ __html: t('donor.onePhotoManyPossibilities', 'One photo,<br/>many possibilities.') + ' <Heart size="14" strokeWidth="2" style="display:inline; vertical-align:middle" />' }}>
          </div>
          <Leaf size={32} color="#2F7A4F" style={{ position: 'absolute', right: '-10px', bottom: '10px', zIndex: 3, transform: 'rotate(-15deg)' }} />
        </div>
      </div>

      {error ? (
        <div style={{ backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '16px', padding: '48px 24px', textAlign: 'center' }}>
          <AlertCircle size={48} color="#C4622D" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: '0 0 12px 0', color: '#2B1D14' }}>
            {error}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
            <button onClick={() => navigate('/detect')} style={{ backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '8px', padding: '12px 24px', fontWeight: 600, color: '#2B1D14', cursor: 'pointer' }}>
              {t('donor.replaceImage')}
            </button>
            <button onClick={analyzeImage} style={{ backgroundColor: '#C4622D', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              {t('actions.retry')}
            </button>
          </div>
        </div>
      ) : loading ? (
        // Loading State: Calm animated scanning
        <div className="ai-results-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '24px' }}>
          <div style={{ backgroundColor: '#FFFDF9', borderRadius: '16px', border: '1px solid #EAE5DE', padding: '24px', boxShadow: '0 4px 12px rgba(43,29,20,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={16} /></div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#2B1D14' }}>{t('donor.uploadedImage')}</h3>
            </div>
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F7F3EC' }}>
              <img src={imageUrl} alt="Scanning..." style={{ width: '100%', height: '400px', objectFit: 'contain', display: 'block', opacity: 0.7 }} />
              {/* Scanline Animation overlay */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#8064D8', boxShadow: '0 0 16px #8064D8', animation: 'scanline 2.5s ease-in-out infinite' }} />
              <style>{`
                @keyframes scanline {
                  0% { transform: translateY(0); }
                  50% { transform: translateY(400px); }
                  100% { transform: translateY(0); }
                }
              `}</style>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', color: '#8064D8' }}>
              <ScanEye size={20} className="spin" />
              <span style={{ fontWeight: 600 }}>{t('donor.analyzingImage')}</span>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#FFFDF9', borderRadius: '16px', border: '1px solid #EAE5DE', padding: '24px', boxShadow: '0 4px 12px rgba(43,29,20,0.02)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={16} /></div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#2B1D14' }}>{t('donor.detectionResults')}</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#654B35', margin: '0 0 24px 0' }}>{t('donor.analyzingImage')}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1,2,3].map(i => (
                 <div key={i} style={{ height: '80px', backgroundColor: '#F7F3EC', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Results State
        <div className="ai-results-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* LEFT: Uploaded Image Panel */}
          <div style={{ backgroundColor: '#FFFDF9', borderRadius: '16px', border: '1px solid #EAE5DE', padding: '24px', boxShadow: '0 4px 12px rgba(43,29,20,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={16} /></div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#2B1D14' }}>{t('donor.uploadedImage')}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#EBF4ED', color: '#2F7A4F', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                {t('donor.imageAnalyzed')} <Check size={14} />
              </div>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#F7F3EC', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DetectionResult imageUrl={imageUrl} items={result?.items || []} />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => navigate('/detect')} style={{ flex: 1, backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: 600, color: '#2B1D14', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                <ImageIcon size={16} /> {t('donor.replaceImage')}
              </button>
              <button style={{ flex: 1, backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: 600, color: '#2B1D14', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                <Crop size={16} /> {t('donor.crop')}
              </button>
              <button onClick={() => navigate('/detect')} style={{ flex: 1, backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: 600, color: '#2B1D14', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                <Trash2 size={16} /> {t('donor.remove')}
              </button>
            </div>
          </div>

          {/* RIGHT: Detection Results Panel */}
          <div style={{ backgroundColor: '#FFFDF9', borderRadius: '16px', border: '1px solid #EAE5DE', padding: '24px', boxShadow: '0 4px 12px rgba(43,29,20,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={16} /></div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#2B1D14' }}>{t('donor.detectionResults')}</h3>
              </div>
              <button 
                onClick={handleAddManualItem}
                style={{ backgroundColor: '#FDF1EB', border: '1px solid #F1C3AA', color: '#C4622D', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              >
                <Plus size={14} /> {t('donor.addItem')}
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#654B35', margin: '0 0 20px 0' }}>{t('donor.aiDetectionDesc')}</p>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '450px', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
              {result?.items?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Package size={48} color="#D1C7BD" style={{ marginBottom: '16px' }} />
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#2B1D14' }}>{t('donor.noItemsDetected')}</h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#8C7A6B' }}>{t('donor.noItemsDetectedDesc')}</p>
                  <button onClick={handleAddManualItem} style={{ backgroundColor: '#C4622D', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    + {t('donor.noItemsAction')}
                  </button>
                </div>
              ) : (
                result?.items?.map((item, idx) => {
                  const confPct = Math.round(item.confidence * 100);
                  const isHighConf = confPct >= 70;
                  const isMedConf = confPct >= 50 && confPct < 70;
                  const isLowConf = confPct < 50;
                  const needsReview = confPct < 70;

                  return (
                    <div key={idx} style={{ paddingBottom: '16px', borderBottom: '1px solid #EAE5DE', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div style={{ width: 48, height: 64, backgroundColor: '#F7F3EC', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4622D' }}>
                            <Package size={24} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '16px', fontWeight: 700, color: '#2B1D14', textTransform: 'capitalize' }}>{item.detected_class || item.name}</span>
                              <span style={{ 
                                fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
                                backgroundColor: isHighConf ? '#EBF4ED' : isMedConf ? '#FEF3C7' : '#FEE2E2',
                                color: isHighConf ? '#2F7A4F' : isMedConf ? '#D97706' : '#DC2626'
                              }}>
                                {confPct}% ({isHighConf ? t('donor.high') : isMedConf ? t('donor.medium') : t('donor.reviewRequired')})
                              </span>
                            </div>

                            {/* Category & Subcategory Display */}
                            <div style={{ fontSize: '13px', color: '#2B1D14', fontWeight: 600, marginTop: '2px' }}>
                              {item.category || t('donor.general')}
                            </div>
                            {item.subcategory && (
                              <div style={{ fontSize: '12px', color: '#C4622D', fontWeight: 500, marginBottom: '4px' }}>
                                {item.subcategory}
                              </div>
                            )}

                            {/* Quantity & Confidence Row */}
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#654B35', marginTop: '4px' }}>
                              <span>{t('donor.quantity')}: <strong style={{ color: '#2B1D14' }}>{item.quantity}</strong></span>
                              <span>{t('donor.confidence')}: <strong style={{ color: '#2B1D14' }}>{confPct}%</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Stepper & Remove Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FDF1EB', borderRadius: '8px' }}>
                            <button onClick={() => updateQuantity(idx, -1)} style={{ background: 'none', border: 'none', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C4622D' }}><Minus size={14} /></button>
                            <span style={{ width: 32, textAlign: 'center', fontSize: '15px', fontWeight: 600, color: '#2B1D14' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(idx, 1)} style={{ background: 'none', border: 'none', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C4622D' }}><Plus size={14} /></button>
                          </div>
                          <button 
                            onClick={() => removeItem(idx)}
                            title="Remove detection"
                            style={{ background: 'none', border: 'none', padding: '6px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {needsReview && (
                          <div style={{ fontSize: '13px', color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FEF3C7', padding: '8px 12px', borderRadius: '6px' }}>
                            <AlertCircle size={14} /> {t('donor.reviewItem')}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Status Banner */}
            {result?.items?.length > 0 && (
              result.items.some(item => item.requires_review) ? (
                <div style={{ marginTop: '20px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#D97706', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <AlertCircle size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#92400E', marginBottom: '4px' }}>
                      {t('donor.reviewRequired')}
                    </div>
                    <div style={{ fontSize: '13px', color: '#B45309' }}>
                      {t('donor.reviewRequiredDesc')}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '20px', backgroundColor: '#EBF4ED', border: '1px solid #B8E0CA', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#2F7A4F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1B472E', marginBottom: '4px' }}>
                      {t('donor.analysisCompleted')}
                    </div>
                    <div style={{ fontSize: '13px', color: '#2F7A4F' }}>
                      {t('donor.analysisCompletedDesc')}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

        </div>
      )}

      {/* Bottom Action Area */}
      {!loading && !error && (
        <div className="ai-results-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '24px' }}>
          
          <div style={{ backgroundColor: '#FFFDF9', borderRadius: '16px', border: '1px solid #EAE5DE', padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lightbulb size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#2B1D14' }}>{t('donor.tipsTitle')}</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#4A3D34', lineHeight: 1.6 }}>
                <li style={{ paddingLeft: '4px', marker: 'green' }}><CheckCircle size={12} color="#2F7A4F" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> {t('donor.useGoodLighting')}</li>
                <li style={{ paddingLeft: '4px' }}><CheckCircle size={12} color="#2F7A4F" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> {t('donor.keepVisible')}</li>
                <li style={{ paddingLeft: '4px' }}><CheckCircle size={12} color="#2F7A4F" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> {t('donor.captureMultiple')}</li>
                <li style={{ paddingLeft: '4px' }}><CheckCircle size={12} color="#2F7A4F" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> {t('donor.minimalClutter')}</li>
              </ul>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFDF9', borderRadius: '16px', border: '1px solid #EAE5DE', padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Edit2 size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#2B1D14' }}>{t('donor.notWhatYouSeeTitle', 'Not what you see?')}</h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#4A3D34', lineHeight: 1.5 }}>
                {t('donor.notWhatYouSeeDesc', 'You can manually edit the item details before submitting.')}
              </p>
              <button onClick={handleContinueToCart} style={{ backgroundColor: '#FDF1EB', color: '#C4622D', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                {t('donor.editManually', 'Edit Manually')}
              </button>
            </div>
          </div>

          <button 
            onClick={handleContinueToCart}
            disabled={!result || result.total_items === 0}
            style={{ 
              backgroundColor: '#C4622D', borderRadius: '16px', border: 'none', padding: '24px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', cursor: 'pointer',
              opacity: (!result || result.total_items === 0) ? 0.5 : 1, transition: 'background-color 0.2s',
              textAlign: 'left'
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <ArrowLeft size={24} style={{ transform: 'rotate(180deg)' }} />
            </div>
            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{t('donor.proceedToDonate')}</div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>{t('donor.continueWithItems')}</div>
            </div>
          </button>

        </div>
      )}

    </div>
  );
}


