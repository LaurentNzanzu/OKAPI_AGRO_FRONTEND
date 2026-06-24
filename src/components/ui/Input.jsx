import React from 'react';

const Input = ({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
          </div>
        )}
        <input
          className={`
            w-full px-4 py-2.5 rounded-lg border text-sm
            bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100
            placeholder:text-gray-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-night-muted focus:border-transparent
            transition-all duration-200
            ${Icon ? 'pl-10' : ''}
            ${
              error
                ? 'border-danger bg-red-50 dark:bg-red-900/20'
                : 'border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export default Input;
