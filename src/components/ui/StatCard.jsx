import React from 'react';

const accentStyles = {
  default: {
    icon: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200',
    value: 'text-gray-900 dark:text-slate-100',
  },
  danger: {
    icon: 'bg-red-100 dark:bg-red-900/40 text-danger',
    value: 'text-danger',
  },
  success: {
    icon: 'bg-green-100 dark:bg-green-900/40 text-success',
    value: 'text-gray-900 dark:text-slate-100',
  },
  warning: {
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-warning',
    value: 'text-gray-900 dark:text-slate-100',
  },
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  accent = 'default',
  hint,
  className = '',
}) => {
  const styles = accentStyles[accent] || accentStyles.default;

  return (
    <div className={`app-card app-card-body-compact ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm text-gray-500 dark:text-slate-300 leading-snug">
            {label}
          </p>
          <p className={`text-2xl md:text-3xl font-bold mt-0.5 leading-none ${styles.value}`}>
            {value}
          </p>
          {hint && (
            <p className="text-xs text-gray-400 dark:text-slate-400 mt-1.5 line-clamp-2">{hint}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${styles.icon}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
