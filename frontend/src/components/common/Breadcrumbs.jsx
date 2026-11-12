import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Breadcrumbs Component
 * @param {Array<{label: string, to?: string}>} items - Array of breadcrumb items
 * @param {Object} style - Additional style overrides
 * @param {string} accentColor - Color for link items (defaults to rust brown #C4622D)
 * @param {string} activeColor - Color for current item (defaults to dark espresso #2B1D14)
 */
export default function Breadcrumbs({ 
  items = [], 
  style = {}, 
  accentColor = '#C4622D', 
  activeColor = '#2B1D14' 
}) {
  if (!items || items.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb navigation"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '8px', 
        fontSize: '14px', 
        fontWeight: 500, 
        marginBottom: '18px',
        lineHeight: 1.4,
        ...style 
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span style={{ color: '#8C7A6B', userSelect: 'none' }}>/</span>
            )}
            {item.to && !isLast ? (
              <Link 
                to={item.to} 
                style={{ 
                  color: accentColor, 
                  textDecoration: 'none', 
                  transition: 'opacity 0.2s ease',
                  fontWeight: 500 
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{ color: activeColor, fontWeight: isLast ? 600 : 500 }}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
