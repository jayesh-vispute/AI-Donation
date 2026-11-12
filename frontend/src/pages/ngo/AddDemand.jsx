import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Plus, Trash2, FileText } from 'lucide-react';
import NgoButton from '../../components/ngo/NgoButton';
import { api } from '../../services/api';
import { translatePriority } from '../../utils/ngoI18n';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function AddDemand() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [items, setItems] = useState([
    { id: Date.now(), category: '', quantity: '', priority: 'MEDIUM', notes: '' }
  ]);
  const [expiryDate, setExpiryDate] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itemErrors, setItemErrors] = useState({});

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), category: '', quantity: '', priority: 'MEDIUM', notes: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
      const newErrors = { ...itemErrors };
      delete newErrors[id];
      setItemErrors(newErrors);
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (itemErrors[id]) {
       const newErrors = { ...itemErrors };
       delete newErrors[id];
       setItemErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setItemErrors({});
    
    let hasError = false;
    let newErrors = {};
    
    items.forEach((item) => {
      if (!item.category.trim()) {
         newErrors[item.id] = t('validation.categoryRequired');
         hasError = true;
      } else if (!item.quantity) {
         newErrors[item.id] = t('validation.quantityRequired');
         hasError = true;
      } else if (isNaN(item.quantity) || parseInt(item.quantity, 10) <= 0 || !Number.isInteger(parseFloat(item.quantity))) {
         newErrors[item.id] = t('validation.quantityInteger');
         hasError = true;
      }
    });

    if (hasError) {
       setItemErrors(newErrors);
       setError(t('validation.correctItemErrors'));
       return;
    }

    setLoading(true);
    
    try {
      const demandData = {
        items: items.map(item => ({
          category: item.category,
          item_name: item.category,
          quantity: parseInt(item.quantity, 10),
          priority: item.priority.toUpperCase(),
          notes: item.notes
        })),
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
        general_notes: generalNotes
      };
      
      await api.createDemand(demandData);
      navigate('/ngo/item-requests');
    } catch (err) {
      console.error('Failed to create demand:', err);
      setError(err.message || t('errors.failedCreateDemand'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #EAE5DE', backgroundColor: '#fff',
    fontSize: '14px', color: '#2B1D14', outline: 'none'
  };
  
  const labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: '600',
    color: '#654B35', marginBottom: '6px'
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px', fontFamily: 'Inter, sans-serif' }}>
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.ngo', 'NGO'), to: '/ngo' },
        { label: t('navigation.itemRequests', 'Item Requests'), to: '/ngo/item-requests' },
        { label: t('ngo.dashboard.createDemand', 'Create Request') }
      ]} />
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: '#fff', border: '1px solid #EAE5DE', width: 40, height: 40, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#2B1D14' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, color: '#2B1D14', fontFamily: 'Fraunces, serif' }}>{t('ngo.demands.createTitle')}</h1>
          <p style={{ margin: '4px 0 0 0', color: '#654B35', fontSize: '14px' }}>{t('ngo.demands.createDesc')}</p>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#fff', borderRadius: '12px', padding: '24px',
        border: '1px solid #EAE5DE', marginBottom: '24px', position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#2B1D14', fontWeight: 700 }}>{t('ngo.demands.itemsNeeded')}</h2>
            <p style={{ margin: '4px 0 0 0', color: '#8C7A6B', fontSize: '14px' }}>{t('ngo.demands.itemsNeededDesc')}</p>
          </div>
          <button 
            type="button" 
            onClick={handleAddItem}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              borderRadius: '8px', backgroundColor: '#FDF1EB', color: '#C4622D', 
              border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' 
            }}
          >
            <Plus size={16} /> {t('ngo.demands.addAnotherItem')}
          </button>
        </div>

        {items.map((item, index) => (
          <div key={item.id} style={{ 
            border: '1px solid #F4F2EE', borderRadius: '12px', padding: '20px', 
            marginBottom: '16px', backgroundColor: '#FAFAF9', position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FDF1EB', 
                color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 700, fontSize: '14px'
              }}>
                {index + 1}
              </div>
              
              {items.length > 1 && (
                <button 
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                    borderRadius: '6px', backgroundColor: '#FDF3F3', color: '#D14343', 
                    border: '1px solid #FDE6E6', fontWeight: 600, fontSize: '12px', cursor: 'pointer' 
                  }}
                >
                  <Trash2 size={14} /> {t('actions.remove')}
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: '16px' }}>
              <div>
                <label style={labelStyle}>{t('ngo.demands.itemCategoryType')}</label>
                <input 
                  type="text" 
                  required 
                  placeholder={t('ngo.demands.categoryPlaceholder')}
                  value={item.category} 
                  onChange={e => handleItemChange(item.id, 'category', e.target.value)} 
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={labelStyle}>{t('ngo.demands.quantityNeeded')}</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  step="1"
                  placeholder={t('ngo.demands.quantityPlaceholder')}
                  value={item.quantity} 
                  onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} 
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={labelStyle}>{t('ngo.demands.priorityLevel')}</label>
                <div style={{ 
                  display: 'flex', backgroundColor: '#EAE5DE', padding: '4px', 
                  borderRadius: '8px'
                }}>
                  {['LOW', 'MEDIUM', 'HIGH'].map(p => {
                    const isSelected = item.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleItemChange(item.id, 'priority', p)}
                        style={{
                          flex: 1, padding: '8px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                          borderRadius: '6px', transition: 'all 0.2s',
                          backgroundColor: isSelected ? '#C4622D' : 'transparent',
                          color: isSelected ? '#fff' : '#654B35',
                          boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        {translatePriority(p, t)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>{t('ngo.demands.itemNotesOptional')}</label>
                <input 
                  type="text" 
                  placeholder={t('ngo.demands.notesPlaceholder')}
                  value={item.notes} 
                  onChange={e => handleItemChange(item.id, 'notes', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
            </div>

            {itemErrors[item.id] && (
              <div style={{ color: '#D14343', fontSize: '13px', marginTop: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {itemErrors[item.id]}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ 
        backgroundColor: '#fff', borderRadius: '12px', padding: '24px',
        border: '1px solid #EAE5DE', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FDF1EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={18} color="#C4622D" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#2B1D14', fontWeight: 700 }}>{t('ngo.demands.additionalInfo')}</h2>
            <p style={{ margin: '2px 0 0 0', color: '#8C7A6B', fontSize: '13px' }}>{t('ngo.demands.additionalInfoDesc')}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div>
            <label style={labelStyle}>{t('ngo.demands.expiryDateOptional')}</label>
            <input 
              type="date" 
              value={expiryDate} 
              onChange={e => setExpiryDate(e.target.value)} 
              style={inputStyle} 
            />
          </div>
          <div>
            <label style={labelStyle}>{t('ngo.demands.generalNotesOptional')}</label>
            <textarea 
              placeholder={t('ngo.demands.generalNotesPlaceholder')}
              value={generalNotes} 
              onChange={e => setGeneralNotes(e.target.value)} 
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} 
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FDF3F3', color: '#D14343', borderRadius: '8px', border: '1px solid #FDE6E6', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button 
          type="button"
          onClick={() => navigate(-1)}
          style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #EAE5DE', backgroundColor: '#fff', color: '#2B1D14', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
        >
          {t('actions.cancel')}
        </button>
        <button 
          type="button" 
          onClick={handleSubmit} 
          disabled={loading}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', 
            borderRadius: '8px', backgroundColor: '#C4622D', color: '#fff', 
            border: 'none', fontWeight: 600, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          <Save size={18} /> {loading ? t('ngo.demands.posting') : t('ngo.demands.postDemand')}
        </button>
      </div>
    </div>
  );
}

