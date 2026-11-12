import { useState } from 'react';
import { Check } from 'lucide-react';

export default function PackagingChecklist({ items, category }) {
  const [checked, setChecked] = useState({});

  const toggle = (idx) => {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const totalChecked = Object.values(checked).filter(Boolean).length;
  const progress = items.length > 0 ? Math.round((totalChecked / items.length) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ textTransform: 'capitalize' }}>{category} Packaging</h4>
        <span className="badge badge-primary">{progress}% Complete</span>
      </div>

      <div
        style={{
          height: 6,
          backgroundColor: 'var(--border)',
          borderRadius: 'var(--radius-full)',
          marginBottom: '1rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: progress === 100 ? 'var(--success)' : 'var(--primary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 300ms ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item, idx) => (
          <div key={idx} className="checklist-item" onClick={() => toggle(idx)}>
            <div className={`checklist-checkbox ${checked[idx] ? 'checked' : ''}`}>
              {checked[idx] && <Check size={14} />}
            </div>
            <span className={`checklist-label ${checked[idx] ? 'checked' : ''}`}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
