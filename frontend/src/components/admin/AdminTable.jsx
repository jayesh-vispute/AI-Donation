import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminTable({ columns, data, onRowClick }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  return (
    <div style={{ 
      backgroundColor: 'var(--neutral-0)', 
      borderRadius: 'var(--radius-card)', 
      border: '1px solid var(--neutral-300)',
      overflow: 'auto',
      maxHeight: 'calc(100vh - 200px)' // ensure sticky header works within viewport
    }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        textAlign: 'left',
        fontSize: '14px'
      }}>
        <thead style={{ 
          position: 'sticky', 
          top: 0, 
          backgroundColor: 'var(--neutral-100)', 
          zIndex: 1,
          borderBottom: '1px solid var(--neutral-300)'
        }}>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                style={{ 
                  padding: '12px 16px', 
                  fontWeight: 600, 
                  color: 'var(--neutral-600)',
                  cursor: col.sortable !== false ? 'pointer' : 'default',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {col.label}
                  {col.sortable !== false && (
                    <span style={{ color: sortConfig.key === col.key ? 'var(--neutral-900)' : 'var(--neutral-300)' }}>
                      {sortConfig.key === col.key && sortConfig.direction === 'desc' 
                        ? <ChevronUp size={14} /> 
                        : <ChevronDown size={14} />
                      }
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIdx) => (
            <tr 
              key={row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ 
                borderBottom: '1px solid var(--neutral-300)', // Hairline row dividers
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 150ms'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = onRowClick ? 'var(--neutral-100)' : 'transparent'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={{ padding: '12px 16px', color: 'var(--neutral-900)' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--neutral-600)' }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
