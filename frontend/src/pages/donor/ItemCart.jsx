import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, Edit2, Trash2, Plus, Minus,
  Lightbulb, Package, ArrowRight, Home, Sofa, Box, Heart, Leaf
} from 'lucide-react';
import { api } from '../../services/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export default function ItemCart() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const initialItems = location.state?.items || [];
  const imageUrl = location.state?.imageUrl || null;
  const editDonationId = location.state?.edit_donation_id || null;
  const [items, setItems] = useState(initialItems);

  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  
  const [editingIdx, setEditingIdx] = useState(-1);
  const [editName, setEditName] = useState('');

  if (items.length === 0 && !addingItem) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '120px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '64px 20px', backgroundColor: '#FFFDF9', borderRadius: '16px', border: '1px solid #EAE5DE' }}>
          <Package size={48} color="#D1C7BD" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', color: '#2B1D14', margin: '0 0 8px 0', fontFamily: 'Fraunces, serif' }}>{t('donor.noItemsToEdit', 'No items to edit')}</h3>
          <p style={{ color: '#654B35', margin: '0 0 24px 0' }}>{t('donor.noItemsToEditDesc', 'Please detect items first or add them manually.')}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/detect')} style={{ backgroundColor: '#FFFDF9', color: '#2B1D14', border: '1px solid #EAE5DE', borderRadius: '8px', padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>
              {t('donor.goToDetection', 'Go to Detection')}
            </button>
            <button onClick={() => setAddingItem(true)} style={{ backgroundColor: '#C4622D', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>
              {t('donor.addManually', 'Add Manually')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleContinue = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        title: `Donation from ${new Date().toLocaleDateString()}`,
        items: items.map(item => ({
          item_name: item.name || item.item_name || t('donor.donationItem', 'Donation Item'),
          category: item.category || t('donor.general', 'General'),
          subcategory: item.subcategory || null,
          quantity: item.quantity || 1,
          condition: 'GOOD',
          confidence: item.confidence || null,
          image_url: imageUrl || null,
          description: '',
          ai_detection_id: item.ai_detection_id || null
        }))
      };
      
      let response;
      if (editDonationId) {
        response = await api.updateDonation(editDonationId, payload);
      } else {
        response = await api.saveDonation(payload);
      }
      
      // Navigate to Matches page, passing the newly created/updated donation object
      navigate('/matches', { state: { donation: response, items } });
    } catch (err) {
      console.error(editDonationId ? 'Failed to update donation:' : 'Failed to create donation:', err);
      setError(editDonationId ? t('donor.updateDonationError', 'Failed to update donation. Please try again.') : t('donor.createDonationError', 'Failed to create donation. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (idx, delta) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[idx].quantity = Math.max(1, newItems[idx].quantity + delta);
      return newItems;
    });
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    setItems([...items, { name: newItemName.trim(), quantity: 1, confidence: 1.0, isManual: true }]);
    setNewItemName('');
    setAddingItem(false);
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    const item = items[idx];
    setEditName(item.name || item.item_name || item.detected_class || t('donor.unknownItem', 'Unknown Item'));
  };

  const saveEdit = (idx) => {
    if (!editName.trim()) return;
    const updated = items.map((item, i) =>
      i === idx ? { ...item, name: editName.trim() } : item
    );
    setItems(updated);
    setEditingIdx(-1);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '120px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.donor', 'Donor'), to: '/donor' },
            { label: t('navigation.donate', 'Donate'), to: '/donate' },
            { label: t('donor.editDonationCart', 'Item Cart') }
          ]} />

          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontFamily: 'Fraunces, serif', margin: '0 0 8px 0', color: '#2B1D14', fontWeight: 700 }}>{t('donor.editDonationCart', 'Edit Donation Cart')}</h1>
          <p style={{ color: '#4A3D34', fontSize: '16px', margin: 0 }}>
            {t('donor.editCartDesc', 'Review and edit the detected items before matching with NGOs.')}
          </p>
        </div>

        {/* Decorative Quote */}
        <div style={{ position: 'relative', width: '220px', height: '90px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#FDF1EB', borderRadius: '50px 100px 50px 100px', width: '200px', height: '70px', transform: 'rotate(-5deg)', zIndex: 1 }}></div>
          <div style={{ position: 'relative', zIndex: 2, fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '16px', color: '#2B1D14', textAlign: 'center', transform: 'rotate(-5deg)', padding: '16px 24px 0 0', lineHeight: 1.3 }}
               dangerouslySetInnerHTML={{ __html: t('donor.giveWhatYouCanQuoteSmall', 'Give what you can,<br/>Change lives.') + ' <Heart size="14" strokeWidth="2" style="display:inline; vertical-align:middle; color:#C4622D" />' }}>
          </div>
          <Leaf size={32} color="#2F7A4F" style={{ position: 'absolute', right: '-10px', top: '10px', zIndex: 3, transform: 'rotate(15deg)' }} />
        </div>
      </div>

      {/* Success Banner */}
      {initialItems.length > 0 && (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #B8E0CA', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <CheckCircle2 size={20} color="#16A34A" />
          <span style={{ color: '#16A34A', fontSize: '14px', fontWeight: 500 }}>
            {t('donor.itemsDetectedSuccess', 'These items were detected using AI. You can edit the details or add more items.')}
          </span>
        </div>
      )}
      
      {/* Error Banner */}
      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '16px', color: '#B91C1C', marginBottom: '24px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Item List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {items.map((item, idx) => {
          // Mock category logic for UI display based on name
          const itemName = item.name || item.item_name || item.detected_class || t('donor.unknownItem', 'Unknown Item');
          const lowerName = itemName.toLowerCase();
          const category = item.category || (lowerName.includes('lamp') ? 'Home Appliances' : lowerName.includes('sofa') ? 'Furniture' : 'General');
          const catIcon = category === 'Home Appliances' ? <Home size={12} /> : category === 'Furniture' ? <Sofa size={12} /> : <Box size={12} />;
          const catBg = category === 'Home Appliances' ? '#EBF1FF' : category === 'Furniture' ? '#F3E8FF' : '#F3F4F6';
          const catColor = category === 'Home Appliances' ? '#2563EB' : category === 'Furniture' ? '#7E22CE' : '#4B5563';

          return (
            <div key={idx} style={{ 
              backgroundColor: '#FFFDF9', borderRadius: '12px', border: '1px solid #EAE5DE', 
              padding: '16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
            }}>
              {/* Item Image */}
              <div style={{ width: 80, height: 80, borderRadius: '8px', backgroundColor: '#F7F3EC', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1C7BD' }}>
                {imageUrl && !item.isManual ? (
                  <img 
                    src={imageUrl} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => {
                      // Fallback to Box icon if image fails to load (e.g. expired blob URL)
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>';
                    }}
                  />
                ) : (
                  <Box size={32} />
                )}
              </div>

              {/* Item Details */}
              <div style={{ flex: 1 }}>
                {editingIdx === idx ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(idx)}
                      autoFocus
                      style={{ padding: '6px 12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #C4622D', fontFamily: 'Inter', outline: 'none' }}
                    />
                    <button onClick={() => saveEdit(idx)} style={{ background: '#C4622D', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 600, cursor: 'pointer' }}>{t('common.save', 'Save')}</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2B1D14', textTransform: 'capitalize' }}>{itemName}</h3>
                    <button onClick={() => startEdit(idx)} style={{ background: 'none', border: 'none', color: '#654B35', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: catBg, color: catColor, padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                    {catIcon} {category}
                  </div>
                  {item.subcategory && (
                    <div style={{ backgroundColor: '#FDF1EB', color: '#C4622D', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                      {item.subcategory}
                    </div>
                  )}
                  <span style={{ fontSize: '13px', color: '#654B35' }}>{t('donor.goodCondition', 'Good condition')}</span>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAE5DE', borderRadius: '8px', backgroundColor: '#FFFDF9' }}>
                <button onClick={() => updateQuantity(idx, -1)} style={{ background: 'none', border: 'none', padding: '12px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#654B35' }}>
                  <Minus size={14} strokeWidth={3} />
                </button>
                <span style={{ width: '32px', textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#2B1D14' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(idx, 1)} style={{ background: 'none', border: 'none', padding: '12px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#654B35' }}>
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>

              {/* Remove Button */}
              <button onClick={() => removeItem(idx)} style={{ background: '#F7F3EC', border: 'none', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#654B35' }}>
                <Trash2 size={20} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Item Manually Area */}
      {addingItem ? (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '24px', backgroundColor: '#FFFDF9', borderRadius: '12px', border: '2px dashed #EAE5DE', marginBottom: '32px' }}>
          <input
            placeholder={t('donor.itemNamePlaceholder', 'Item name (e.g., Blanket)')}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            autoFocus
            style={{ flex: 1, padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #EAE5DE', fontFamily: 'Inter' }}
          />
          <button onClick={addItem} style={{ backgroundColor: '#C4622D', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 24px', fontWeight: 600, cursor: 'pointer' }}>{t('common.add', 'Add')}</button>
          <button onClick={() => { setAddingItem(false); setNewItemName(''); }} style={{ backgroundColor: '#F7F3EC', color: '#2B1D14', border: 'none', borderRadius: '8px', padding: '0 24px', fontWeight: 600, cursor: 'pointer' }}>{t('common.cancel', 'Cancel')}</button>
        </div>
      ) : (
        <div 
          onClick={() => setAddingItem(true)}
          style={{ 
            backgroundColor: '#FFFDF9', border: '2px dashed #EAE5DE', borderRadius: '12px', padding: '24px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', cursor: 'pointer', marginBottom: '32px',
            transition: 'background-color 0.2s'
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={24} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#2B1D14', marginBottom: '4px' }}>{t('donor.addItemManually', 'Add Item Manually')}</div>
            <div style={{ fontSize: '14px', color: '#8C7A6B' }}>{t('donor.addItemManuallyDesc', "Can't find an item? Add it yourself.")}</div>
          </div>
        </div>
      )}

      {/* Tips Banner */}
      <div style={{ backgroundColor: '#FFFDF9', borderRadius: '12px', border: '1px solid #FDF1EB', display: 'flex', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#C4622D' }} />
        <div style={{ padding: '24px 24px 24px 32px', display: 'flex', gap: '16px', flex: 1 }}>
          <div style={{ color: '#D97706', marginTop: '2px' }}><Lightbulb size={24} fill="#FEF3C7" /></div>
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#2B1D14' }}>{t('donor.tipsTitle', 'Tips')}</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#4A3D34', fontSize: '14px', lineHeight: 1.6 }}>
              <li>{t('donor.cartTip1', 'Review and edit item names, categories and quantities if needed.')}</li>
              <li>{t('donor.cartTip2', 'Only add items that are in good usable condition.')}</li>
              <li>{t('donor.cartTip3', 'Accurate details help us find the right NGO matches faster.')}</li>
            </ul>
          </div>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '200px', backgroundColor: '#FDF1EB' }}>
           <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '15px', color: '#4A3D34', textAlign: 'center', lineHeight: 1.3 }}
                dangerouslySetInnerHTML={{ __html: t('donor.unwantedItemsQuote', "Your<br/>unwanted items<br/>can be someone's<br/>new beginning.") + ' <Heart size="12" strokeWidth="2" style="display:inline; color:#C4622D" />' }}>
           </div>
        </div>
      </div>

      <style>{`
        .cart-footer-fixed {
          position: fixed;
          bottom: 0;
          left: 260px;
          right: 0;
          background-color: #FFFDF9;
          padding: 24px;
          border-top: 1px solid #EAE5DE;
          box-shadow: 0 -4px 24px rgba(43, 29, 20, 0.04);
          display: flex;
          justify-content: center;
          z-index: 90;
        }
        @media (max-width: 768px) {
          .cart-footer-fixed {
            left: 0;
            bottom: 60px;
          }
        }
      `}</style>

      {/* Sticky Footer */}
      <div className="cart-footer-fixed">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '900px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid #EAE5DE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4622D' }}>
              <Package size={24} />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#654B35', fontWeight: 500 }}>{t('donor.totalItems', 'Total Items')}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#2B1D14' }}>{totalItems}</div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <button 
              onClick={handleContinue} 
              disabled={items.length === 0 || loading} 
              style={{ 
                backgroundColor: '#C4622D', color: '#fff', border: 'none', borderRadius: '8px', 
                padding: '12px 32px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                cursor: items.length === 0 || loading ? 'not-allowed' : 'pointer', opacity: items.length === 0 || loading ? 0.5 : 1,
                marginBottom: '4px'
              }}
            >
              {loading ? t('common.saving', 'Saving...') : t('donor.findNgoMatches', 'Find NGO Matches')} <ArrowRight size={18} />
            </button>
            <div style={{ fontSize: '12px', color: '#8C7A6B', paddingRight: '8px' }}>{t('donor.getMatchedDesc', 'Get matched with NGOs that need these items.')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
