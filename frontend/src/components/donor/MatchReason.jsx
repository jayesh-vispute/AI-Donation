import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function MatchReason({ reasons, match }) {
  const reasonList = reasons || match?.reasons || [];

  if (!Array.isArray(reasonList) || reasonList.length === 0) {
    return (
      <div style={{ padding: '12px 16px', color: '#654B35', fontSize: '14px', fontStyle: 'italic' }}>
        Matched via automated AI smart algorithm based on registered demand criteria.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {reasonList.map((reason, idx) => {
        const isObj = typeof reason === 'object' && reason !== null;
        const met = isObj ? (reason.met !== false) : true;
        const label = isObj ? (reason.label || reason.text || String(reason)) : String(reason);

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: met ? '#EBF4ED' : '#FDF3F3',
              border: met ? '1px solid #D1E5D5' : '1px solid #F8D7D7',
            }}
          >
            {met ? (
              <CheckCircle size={18} color="#2F7A4F" />
            ) : (
              <XCircle size={18} color="#D14343" />
            )}
            <span style={{ fontSize: '14px', fontWeight: 500, color: met ? '#2F7A4F' : '#D14343' }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

