import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Image as ImageIcon, X, Lightbulb, Check, Upload, Zap, CloudUpload, Package } from 'lucide-react';
import DonorButton from '../../components/donor/DonorButton';
import donationBoxImg from '../../assets/donation_box.jpg';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

export default function Detect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(true);
  const [hoverCamera, setHoverCamera] = useState(false);
  const [hoverGallery, setHoverGallery] = useState(false);
  const fileInputRef = useRef(null);

  const [recentDonations, setRecentDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await api.getDonorDonations();
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentDonations(data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load recent donations:', err);
      } finally {
        setLoadingDonations(false);
      }
    };
    fetchRecent();
  }, []);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      navigate('/results', { state: { file: e.target.files[0] } });
    }
  };

  return (
    <div style={{ 
      fontFamily: 'Inter, sans-serif',
      color: '#2B1D14'
    }}>
      
      {/* Header Section */}
      <div className="donor-detect-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C4622D', fontSize: '14px', marginBottom: '20px', fontWeight: 500 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>{t('common.home', 'Home')}</Link>
            <span style={{ color: '#8C7A6B' }}>/</span>
            <span style={{ color: '#2B1D14' }}>{t('navigation.donate', 'Donate')}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontFamily: 'Fraunces, serif', margin: '0 0 8px 0', color: '#2B1D14', fontWeight: 700 }}>{t('donor.donateItems', 'Donate Items')}</h1>
          <p style={{ color: '#4A3D34', fontSize: '15px', margin: 0 }}>
            {t('donor.donateItemsDesc', 'Add items to your donation by taking photos or uploading from your device.')}
          </p>
        </div>

        {/* Decorative Quote */}
        <div style={{ textAlign: 'right', color: '#654B35', paddingTop: '16px' }}
             dangerouslySetInnerHTML={{ __html: t('donor.giveWhatYouCanQuote', '<h3 style="font-size: clamp(16px, 2vw, 24px); font-family: Fraunces, serif; font-style: italic; margin: 0; font-weight: 500">Give what you can</h3><h3 style="font-size: clamp(16px, 2vw, 24px); font-family: Fraunces, serif; font-style: italic; margin: 0; font-weight: 500">Change lives. ♡</h3>') }}>
        </div>
      </div>

      {/* Alert Banner */}
      {showAlert && (
        <div className="donor-detect-alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🌿</span>
            <span style={{ color: '#1B472E', fontSize: '14px', fontWeight: 500 }}>
              {t('donor.unusedItemsBanner', "Your unused items can bring new hope to someone. Let's make a positive impact together!")}
            </span>
          </div>
          <button 
            onClick={() => setShowAlert(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2F7A4F', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Upload Actions */}
      <div className="donor-detect-actions-grid">
        
        {/* Use Camera Card */}
        <div 
          onClick={() => navigate('/camera')}
          onMouseEnter={() => setHoverCamera(true)}
          onMouseLeave={() => setHoverCamera(false)}
          style={{
            backgroundColor: hoverCamera ? '#FFF8F4' : '#FFFDF9',
            border: `2px solid ${hoverCamera ? '#C4622D' : '#F1C3AA'}`,
            borderRadius: '18px',
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: hoverCamera ? 'translateY(-2px)' : 'none',
            boxShadow: hoverCamera ? '0 8px 20px rgba(196, 98, 45, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{
            position: 'absolute', top: '12px', left: '12px',
            backgroundColor: '#FDF1EB', color: '#C4622D', padding: '4px 10px',
            borderRadius: '16px', fontSize: '11px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <Zap size={13} /> {t('donor.quickAndEasy', 'Quick & Easy')}
          </div>

          <div style={{ 
            width: 60, height: 60, borderRadius: '50%', backgroundColor: '#FDF1EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            marginTop: '16px', marginBottom: '14px', color: '#C4622D'
          }}>
            <Camera size={28} strokeWidth={2} />
          </div>
          
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#2B1D14' }}>{t('donor.useCamera', 'Use Camera')}</h3>
          <p style={{ color: '#654B35', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            {t('donor.useCameraDesc', 'Take photos of your items directly from your device.')}
          </p>
          
          <button 
            onClick={(e) => { e.stopPropagation(); navigate('/camera'); }}
            style={{
              marginTop: 'auto', backgroundColor: '#C4622D', color: 'white', border: 'none',
              borderRadius: '10px', padding: '12px 18px', width: '100%', fontWeight: 600, fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', transition: 'background-color 0.2s ease'
            }}
          >
            <Camera size={18} /> {t('donor.openCamera', 'Open Camera')}
          </button>
        </div>

        {/* Upload Gallery Card */}
        <div 
          onClick={handleFileClick}
          onMouseEnter={() => setHoverGallery(true)}
          onMouseLeave={() => setHoverGallery(false)}
          style={{
            backgroundColor: hoverGallery ? '#F2FAF5' : '#F6FCF8',
            border: `2px solid ${hoverGallery ? '#2F7A4F' : '#B8E0CA'}`,
            borderRadius: '18px',
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: hoverGallery ? 'translateY(-2px)' : 'none',
            boxShadow: hoverGallery ? '0 8px 20px rgba(47, 122, 79, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{
            position: 'absolute', top: '12px', left: '12px',
            backgroundColor: '#E4F4EC', color: '#2F7A4F', padding: '4px 10px',
            borderRadius: '16px', fontSize: '11px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <CloudUpload size={13} /> {t('donor.uploadAnytime', 'Upload Anytime')}
          </div>

          <div style={{ 
            width: 60, height: 60, borderRadius: '50%', backgroundColor: '#E4F4EC',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            marginTop: '16px', marginBottom: '14px', color: '#2F7A4F'
          }}>
            <ImageIcon size={28} strokeWidth={2} />
          </div>
          
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#2B1D14' }}>{t('donor.uploadGallery', 'Upload Gallery')}</h3>
          <p style={{ color: '#654B35', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            {t('donor.uploadGalleryDesc', 'Select existing photos from your device storage.')}
          </p>
          
          <button 
            onClick={(e) => { e.stopPropagation(); handleFileClick(); }}
            style={{
              marginTop: 'auto', backgroundColor: '#2F7A4F', color: 'white', border: 'none',
              borderRadius: '10px', padding: '12px 18px', width: '100%', fontWeight: 600, fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', transition: 'background-color 0.2s ease'
            }}
          >
            <Upload size={18} /> {t('donor.chooseFiles', 'Choose Files')}
          </button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
        </div>

        {/* Illustration Card */}
        <div style={{ 
          backgroundColor: '#FDF1EB', borderRadius: '18px', overflow: 'hidden', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', maxHeight: '280px'
        }}>
           <img src={donationBoxImg} alt="Donation Box" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </div>

      {/* Info Panels */}
      <div className="donor-detect-info-grid">
        
        {/* Tips for better photos */}
        <div className="donor-detect-info-card">
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FDF1EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4622D', flexShrink: 0 }}>
            <Lightbulb size={28} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>{t('donor.photoTipsTitle', 'Tips for better photos')}</h4>
            <div className="donor-detect-tips-grid">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4A3D34' }}>
                <Check size={16} color="#2B1D14" strokeWidth={3} /> {t('donor.tipLighting', 'Ensure good lighting')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4A3D34' }}>
                <Check size={16} color="#2B1D14" strokeWidth={3} /> {t('donor.tipAngles', 'Capture multiple angles')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4A3D34' }}>
                <Check size={16} color="#2B1D14" strokeWidth={3} /> {t('donor.tipClear', 'Show items clearly')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4A3D34' }}>
                <Check size={16} color="#2B1D14" strokeWidth={3} /> {t('donor.tipBackground', 'Keep the background clean')}
              </div>
            </div>
          </div>
        </div>

        {/* Supported formats */}
        <div className="donor-detect-info-card" style={{ alignItems: 'center' }}>
           <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#E4F4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2F7A4F', flexShrink: 0 }}>
            <ImageIcon size={28} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>{t('donor.supportedFormats', 'Supported formats')}</h4>
            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#654B35' }}>JPG, PNG, WebP</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#654B35' }}>{t('donor.maxSize', 'Max size: 10MB per image')}</p>
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontFamily: 'Fraunces, serif', margin: 0, fontWeight: 700 }}>{t('donor.recentUploads', 'Recent Uploads')}</h2>
          <Link to="/donations" style={{ color: '#C4622D', textDecoration: 'none', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {t('donor.viewAll', 'View All')} &rarr;
          </Link>
        </div>
        
        {loadingDonations ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(i => (
               <div key={i} style={{ height: '70px', backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : recentDonations.length === 0 ? (
          <div style={{ 
            backgroundColor: '#FDFCFB', border: '2px dashed #EAE5DE', borderRadius: '16px', 
            padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center'
          }}>
            <ImageIcon size={40} color="#D1C7BD" strokeWidth={1.5} style={{ marginBottom: '16px' }} />
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#2B1D14' }}>{t('donor.noItemsUploaded', 'No items uploaded yet')}</h4>
            <p style={{ margin: 0, fontSize: '15px', color: '#8C7A6B' }}>
              {t('donor.noItemsUploadedDesc', 'Start by taking a photo or uploading images of the items you want to donate.')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentDonations.map(donation => (
              <div 
                key={donation.id} 
                onClick={() => navigate(`/donations/${donation.id}`)}
                style={{ 
                  backgroundColor: '#FFFDF9', border: '1px solid #EAE5DE', borderRadius: '12px',
                  padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                  transition: 'box-shadow 0.2s', flexWrap: 'wrap'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(43,29,20,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ width: 48, height: 48, borderRadius: '8px', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600 }}>
                    {donation.items?.map(i => `${i.item_name || i.name || i.detected_class || t('common.item', 'Item')} × ${i.quantity || 1}`).join(', ') || t('donor.donationItems', 'Donation Items')}
                  </h4>
                  <div style={{ fontSize: '13px', color: '#654B35', textTransform: 'capitalize' }}>
                    {new Date(donation.created_at).toLocaleDateString()} &bull; {t(`status.${donation.status?.toLowerCase()}`, donation.status || 'Pending')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}


