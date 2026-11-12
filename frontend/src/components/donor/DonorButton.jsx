import React from 'react';
import '../../pages/donor/donor-theme.css';

export default function DonorButton({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '', 
  type = 'button',
  fullWidth = false,
  disabled = false
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: 'var(--radius-btn)',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: 'var(--font-body)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease-out',
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
    opacity: disabled ? 0.6 : 1
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--donor-primary-600, #C4622D)',
      color: 'var(--donor-neutral-0, #FFFFFF)',
      boxShadow: '0 4px 12px rgba(196, 98, 45, 0.2)',
    },
    secondary: {
      backgroundColor: 'var(--donor-secondary-600, #2F7A4F)',
      color: 'var(--donor-neutral-0, #FFFFFF)',
      boxShadow: '0 4px 12px rgba(47, 122, 79, 0.2)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--donor-primary-600, #C4622D)',
      border: '1.5px solid var(--donor-primary-600, #C4622D)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--donor-neutral-600, #5C5348)',
    }
  };

  // Note: Hover states would ideally be in a CSS module or styled-component, 
  // but we can apply them via className targeting these specific components if needed.
  // For simplicity, we define the base variants here and rely on the global CSS for specific overrides.
  
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      className={`donor-btn donor-btn-${variant} ${className}`}
      style={{ ...baseStyle, ...variants[variant] }}
    >
      {children}
    </button>
  );
}
