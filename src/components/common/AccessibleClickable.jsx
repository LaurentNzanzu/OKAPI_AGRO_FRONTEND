import React from 'react';

/**
 * Wrapper accessible pour les zones cliquables non-bouton.
 */
const AccessibleClickable = ({
  onClick,
  onKeyDown,
  children,
  className = '',
  ariaLabel,
  ...props
}) => {
  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

export default AccessibleClickable;
