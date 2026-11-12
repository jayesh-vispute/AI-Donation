import React from 'react';

export default function NgoButton({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled = false, 
  fullWidth = false,
  type = 'button',
  style = {}
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: '10px 20px',
    borderRadius: 'var(--radius-btn)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'var(--font-body)',
    transition: 'all 200ms ease',
    opacity: disabled ? 0.6 : 1,
    ...style
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary-600)',
      color: '#ffffff',
      boxShadow: disabled ? 'none' : 'var(--shadow-warm)'
    },
    secondary: {
      backgroundColor: 'var(--secondary-600)', /* Forest green for NGO actions */
      color: '#ffffff',
      boxShadow: disabled ? 'none' : 'var(--shadow-warm)'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--neutral-900)',
      border: '1px solid #EAE5DE'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--neutral-600)',
      padding: '8px 16px'
    },
    danger: {
      backgroundColor: 'var(--error-600)',
      color: '#ffffff',
      boxShadow: disabled ? 'none' : 'var(--shadow-warm)'
    }
  };

  const appliedStyle = { ...baseStyle, ...variants[variant] };

  const handleMouseEnter = (e) => {
    if (disabled) return;
    if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--primary-700)';
    if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'var(--secondary-700)';
    if (variant === 'outline' || variant === 'ghost') e.currentTarget.style.backgroundColor = 'var(--neutral-100)';
    if (variant !== 'ghost' && variant !== 'outline') e.currentTarget.style.transform = 'translateY(-1px)';
  };

  const handleMouseLeave = (e) => {
    if (disabled) return;
    if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--primary-600)';
    if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'var(--secondary-600)';
    if (variant === 'outline' || variant === 'ghost') e.currentTarget.style.backgroundColor = 'transparent';
    if (variant !== 'ghost' && variant !== 'outline') e.currentTarget.style.transform = 'translateY(0)';
  };

  return (
    <button 
      type={type}
      style={appliedStyle}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}
