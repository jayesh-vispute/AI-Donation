import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import NgoButton from '../../components/ngo/NgoButton';
import { api } from '../../services/api';
import { translatePriority } from '../../utils/ngoI18n';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function EditDemand() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    itemCategory: '',
    quantity: '',
    priority: 'MEDIUM',
    expiryDate: '',
    notes: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDemand = async () => {
      try {
        const demand = await api.getDemand(id);
        if (demand) {
          setFormData({
            itemCategory: demand.itemType || demand.item_name || demand.category || '',
            quantity: demand.quantity || demand.quantity_required || '',
            priority: demand.priority || demand.urgency || 'MEDIUM',
            expiryDate: demand.expiry_date ? new Date(demand.expiry_date).toISOString().split('T')[0] : '',
            notes: demand.description || ''
          });
        }
      } catch (err) {
        console.error('Failed to load demand:', err);
        setError(t('errors.failedLoadDemand'));
      } finally {
        setLoading(false);
      }
    };
    fetchDemand();
  }, [id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const demandData = {
        item_name: formData.itemCategory,
        category: formData.itemCategory,
        quantity_required: parseInt(formData.quantity, 10),
        priority: formData.priority.toUpperCase(),
        expiry_date: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        description: formData.notes
      };
      await api.updateDemand(id, demandData);
      navigate('/ngo/item-requests');
    } catch (err) {
      console.error('Failed to update demand:', err);
      setError(t('errors.failedUpdateDemand'));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('ngo.demands.deleteConfirmPermanent'))) {
      try {
        await api.deleteDemand(id);
        navigate('/ngo/item-requests');
      } catch (err) {
        console.error('Failed to delete demand:', err);
        setError(t('errors.failedDeleteDemand'));
      }
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-btn)',
    border: '1px solid #EAE5DE', backgroundColor: 'var(--neutral-0)',
    fontSize: '15px', color: 'var(--neutral-900)', fontFamily: 'var(--font-body)',
    marginBottom: 'var(--space-4)'
  };
  
  const labelStyle = {
    display: 'block', fontSize: '14px', fontWeight: '600',
    color: 'var(--neutral-900)', marginBottom: '8px'
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: 'var(--space-6)' }}>
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.ngo', 'NGO'), to: '/ngo' },
        { label: t('navigation.itemRequests', 'Item Requests'), to: '/ngo/item-requests' },
        { label: t('ngo.demands.editTitle', 'Edit Request') }
      ]} />
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-5)', gap: 'var(--space-3)' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--neutral-0)', border: '1px solid #EAE5DE', width: 40, height: 40, borderRadius: 'var(--radius-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>{t('ngo.demands.editTitle')}</h1>
      </div>

      <div style={{ 
        backgroundColor: 'var(--neutral-0)', borderRadius: 'var(--radius-card)', padding: 'var(--space-5)',
        border: '1px solid #EAE5DE', boxShadow: '0 1px 3px rgba(43,29,20,0.02)', marginBottom: 'var(--space-4)'
      }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#654B35' }}>{t('ngo.demands.loadingDetails')}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ color: 'var(--error-600)', marginBottom: 'var(--space-3)', fontSize: '14px' }}>{error}</div>}
            
            <label style={labelStyle}>{t('ngo.demands.itemCategoryTypePlain')}</label>
          <input 
            type="text" 
            name="itemCategory" 
            required 
            value={formData.itemCategory} 
            onChange={handleChange} 
            style={inputStyle} 
          />

          <label style={labelStyle}>{t('ngo.demands.quantityNeeded')}</label>
          <input 
            type="number" 
            name="quantity" 
            required 
            min="1"
            value={formData.quantity} 
            onChange={handleChange} 
            style={inputStyle} 
          />

          <label style={labelStyle}>{t('ngo.demands.priorityLevel')}</label>
          <div style={{ 
            display: 'flex', backgroundColor: 'var(--neutral-100)', padding: '4px', 
            borderRadius: 'var(--radius-btn)', marginBottom: 'var(--space-4)'
          }}>
            {['LOW', 'MEDIUM', 'HIGH'].map(p => {
              const isSelected = formData.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({...formData, priority: p})}
                  style={{
                    flex: 1, padding: '10px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
                    borderRadius: '6px', transition: 'all 200ms',
                    backgroundColor: isSelected ? 'var(--neutral-0)' : 'transparent',
                    color: isSelected ? (p === 'HIGH' ? 'var(--accent-amber)' : 'var(--neutral-900)') : 'var(--neutral-600)',
                    boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {translatePriority(p, t)}
                </button>
              );
            })}
          </div>

          <label style={labelStyle}>{t('ngo.demands.expiryDateOptional')}</label>
          <input 
            type="date" 
            name="expiryDate" 
            value={formData.expiryDate} 
            onChange={handleChange} 
            style={inputStyle} 
          />

          <label style={labelStyle}>{t('ngo.demands.additionalNotes')}</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} 
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <NgoButton type="submit" variant="primary" disabled={saving}>
              <Save size={18} /> {saving ? t('ngo.demands.updating') : t('ngo.demands.updateDemand')}
            </NgoButton>
          </div>
        </form>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={handleDelete}
          style={{ 
            background: 'none', border: 'none', color: 'var(--error-600)', 
            fontWeight: 600, fontSize: '14px', cursor: 'pointer', 
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '100px'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(209, 67, 67, 0.05)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Trash2 size={16} /> {t('ngo.demands.deleteDemand')}
        </button>
      </div>

    </div>
  );
}
