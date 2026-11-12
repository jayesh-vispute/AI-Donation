import React from 'react';

export default function AdminButton({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled, 
  style, 
  className = '', 
  type = 'button' 
}) {
  const getVariantStyles = () => {
    switch(variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--primary-600)',
          color: '#fff',
          border: 'none',
        };
      case 'destructive':
        return {
          backgroundColor: 'var(--error-600)',
          color: '#fff',
          border: 'none',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--neutral-600)',
          border: '1px solid var(--neutral-300)',
        };
      case 'ghost-icon':
        return {
          backgroundColor: 'transparent',
          color: 'var(--neutral-600)',
          border: 'none',
          padding: '8px',
        };
      default:
        return {
          backgroundColor: 'var(--primary-600)',
          color: '#fff',
          border: 'none',
        };
    }
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: variant === 'ghost-icon' ? '8px' : '10px 16px',
    borderRadius: 'var(--radius-btn)',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 200ms ease',
    ...getVariantStyles(),
    ...style
  };

  const handleMouseEnter = (e) => {
    if (disabled) return;
    if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--primary-700)';
    if (variant === 'destructive') e.currentTarget.style.backgroundColor = '#B83535'; // Darker red
    if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'var(--neutral-100)';
    if (variant === 'ghost-icon') e.currentTarget.style.backgroundColor = 'var(--neutral-100)';
  };

  const handleMouseLeave = (e) => {
    if (disabled) return;
    const styles = getVariantStyles();
    e.currentTarget.style.backgroundColor = styles.backgroundColor;
  };

  return (
    <button
      type={type}
      style={baseStyle}
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}
