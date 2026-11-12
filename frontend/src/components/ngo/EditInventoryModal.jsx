import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import NgoButton from './NgoButton';
import { api } from '../../services/api';

export default function EditInventoryModal({ isOpen, onClose, item, onSuccess }) {
  const [formData, setFormData] = useState({
    status: 'AVAILABLE',
    condition: 'GOOD',
    storage_location: '',
    available_quantity: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        status: item.status || 'AVAILABLE',
        condition: item.condition || 'GOOD',
        storage_location: item.storage_location || '',
        available_quantity: item.available_quantity || item.quantity || 0
      });
      setError('');
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.updateNgoInventory(item.id, {
        status: formData.status,
        condition: formData.condition,
        storage_location: formData.storage_location,
        available_quantity: parseInt(formData.available_quantity, 10),
        quantity: parseInt(formData.available_quantity, 10) // Keeping it synced for simplicity
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update inventory item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(43, 29, 20, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 110, padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px',
        boxShadow: '0 20px 40px rgba(43,29,20,0.1)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #EAE5DE' }}>
          <div>
            <h2 style={{ fontSize: '20px', margin: '0 0 4px 0', color: '#2B1D14', fontFamily: 'Fraunces, serif' }}>Edit Inventory Item</h2>
            <div style={{ fontSize: '14px', color: '#654B35', textTransform: 'capitalize' }}>
              {item.item_name} {item.subcategory ? `(${item.subcategory})` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A6B' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{ padding: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4A3D34', marginBottom: '8px' }}>Available Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.available_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, available_quantity: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4A3D34', marginBottom: '8px' }}>Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', fontSize: '14px', backgroundColor: '#fff' }}
              >
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4A3D34', marginBottom: '8px' }}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', fontSize: '14px', backgroundColor: '#fff' }}
              >
                <option value="AVAILABLE">Available</option>
                <option value="ALLOCATED">Allocated</option>
                <option value="NEEDS_ATTENTION">Needs Attention</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4A3D34', marginBottom: '8px' }}>Storage Location</label>
              <input
                type="text"
                placeholder="e.g. Aisle 3, Shelf B"
                value={formData.storage_location}
                onChange={(e) => setFormData(prev => ({ ...prev, storage_location: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EAE5DE', outline: 'none', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
            <NgoButton type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </NgoButton>
            <NgoButton type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </NgoButton>
          </div>
        </form>
      </div>
    </div>
  );
}
