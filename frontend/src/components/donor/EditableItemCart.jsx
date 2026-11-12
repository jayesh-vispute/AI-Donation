import React, { useState } from 'react';
import { Trash2, Plus, Edit3, Check, X, Image as ImageIcon } from 'lucide-react';
import DonorButton from './DonorButton';

export default function EditableItemCart({ items, onChange, onContinue }) {
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [editingIdx, setEditingIdx] = useState(-1);
  const [editName, setEditName] = useState('');

  const updateQuantity = (idx, newQty) => {
    if (newQty < 1) return;
    const updated = items.map((item, i) =>
      i === idx ? { ...item, quantity: newQty } : item
    );
    onChange(updated);
  };

  const removeItem = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    onChange([...items, { name: newItemName.trim(), quantity: 1, confidence: 1.0, isManual: true }]);
    setNewItemName('');
    setAddingItem(false);
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditName(items[idx].name);
  };

  const saveEdit = (idx) => {
    if (!editName.trim()) return;
    const updated = items.map((item, i) =>
      i === idx ? { ...item, name: editName.trim() } : item
    );
    onChange(updated);
    setEditingIdx(-1);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ paddingBottom: '100px' }}> {/* Space for sticky footer */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-5)', backgroundColor: 'var(--neutral-0)', borderRadius: 'var(--radius-card)', border: '1px solid #EAE5DE' }}>
          <p style={{ color: 'var(--neutral-600)' }}>No items in your cart.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid #EAE5DE',
                backgroundColor: 'var(--neutral-0)',
                boxShadow: 'var(--shadow-warm)'
              }}
            >
              {/* Thumbnail Placeholder */}
              <div style={{ 
                width: 56, height: 56, borderRadius: '8px', 
                backgroundColor: 'var(--neutral-100)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-600)', flexShrink: 0 
              }}>
                <ImageIcon size={24} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {editingIdx === idx ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(idx)}
                      style={{ 
                        flex: 1, padding: '6px 8px', fontSize: '15px', borderRadius: '4px',
                        border: '1px solid var(--primary-600)', fontFamily: 'var(--font-body)'
                      }}
                      autoFocus
                    />
                    <button onClick={() => saveEdit(idx)} style={{ background: 'none', border: 'none', color: 'var(--secondary-600)', cursor: 'pointer', padding: 4 }}><Check size={18} /></button>
                    <button onClick={() => setEditingIdx(-1)} style={{ background: 'none', border: 'none', color: 'var(--neutral-600)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ textTransform: 'capitalize', margin: 0, fontSize: '16px' }}>{item.name}</h4>
                    <button onClick={() => startEdit(idx)} style={{ background: 'none', border: 'none', color: 'var(--neutral-600)', cursor: 'pointer', padding: 4, display: 'flex' }}><Edit3 size={14} /></button>
                  </div>
                )}
                
                {item.isManual && (
                  <span style={{ fontSize: '11px', backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-600)', padding: '2px 6px', borderRadius: '4px', marginTop: 4, display: 'inline-block', fontWeight: 600 }}>Manual Entry</span>
                )}
              </div>

              {/* Quantity Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--neutral-100)', borderRadius: '100px', border: '1px solid #EAE5DE' }}>
                <button 
                  onClick={() => updateQuantity(idx, item.quantity - 1)} 
                  style={{ background: 'none', border: 'none', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--neutral-900)' }}
                >-</button>
                <span style={{ fontSize: '14px', fontWeight: 600, width: 24, textAlign: 'center' }}>{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(idx, item.quantity + 1)} 
                  style={{ background: 'none', border: 'none', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--neutral-900)' }}
                >+</button>
              </div>

              {/* Ghost Remove Icon */}
              <button
                onClick={() => removeItem(idx)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--neutral-600)', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {addingItem ? (
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-4)', backgroundColor: 'var(--neutral-0)', padding: 'var(--space-3)', borderRadius: 'var(--radius-card)', border: '1px solid #EAE5DE' }}>
          <input
            placeholder="Item name (e.g., Blanket)"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            autoFocus
            style={{ flex: 1, padding: '8px 12px', fontSize: '15px', borderRadius: '4px', border: '1px solid #EAE5DE', fontFamily: 'var(--font-body)' }}
          />
          <DonorButton variant="primary" onClick={addItem}>Add</DonorButton>
          <DonorButton variant="ghost" onClick={() => { setAddingItem(false); setNewItemName(''); }}>Cancel</DonorButton>
        </div>
      ) : (
        <DonorButton variant="outline" fullWidth onClick={() => setAddingItem(true)}>
          <Plus size={18} /> Add Item Manually
        </DonorButton>
      )}

      {/* Sticky Footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'var(--neutral-0)', padding: 'var(--space-4) var(--space-5)',
        borderTop: '1px solid #EAE5DE', boxShadow: '0 -4px 12px rgba(43, 29, 20, 0.04)',
        display: 'flex', justifyContent: 'center', zIndex: 90
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '700px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>Total Items</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--neutral-900)' }}>{totalItems}</span>
          </div>
          <DonorButton variant="primary" onClick={onContinue} disabled={items.length === 0} style={{ minWidth: '200px' }}>
            Find NGO Matches
          </DonorButton>
        </div>
      </div>
    </div>
  );
}
