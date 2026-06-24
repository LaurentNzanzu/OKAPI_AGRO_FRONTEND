import React from 'react';
import { useTranslationOptional } from '../../context/LanguageContext';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const lang = useTranslationOptional();
  const loadingLabel = lang?.t('common.loading') ?? 'Chargement...';

  const variants = {
    primary:
      'bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white shadow-sm',
    secondary:
      'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-slate-200',
    danger: 'bg-danger hover:bg-red-700 text-white',
    warning: 'bg-warning hover:bg-amber-600 text-white',
    success: 'bg-success hover:bg-green-700 text-white',
    outline:
      'border border-primary-600 dark:border-slate-500 text-primary-600 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-night-active',
    ghost:
      'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        font-medium rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
        inline-flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="spinner w-4 h-4 border-2 border-white border-t-transparent" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
