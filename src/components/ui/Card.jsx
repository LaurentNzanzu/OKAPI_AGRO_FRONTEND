import React from 'react';

const Card = ({
  children,
  className = '',
  title,
  subtitle,
  icon,
  actions,
  noPadding = false,
  compact = false,
}) => {
  return (
    <div className={`app-card ${className}`}>
      {(title || actions) && (
        <div className="app-card-header">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="text-primary-600 dark:text-primary-200 shrink-0">{icon}</div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div
        className={
          noPadding ? '' : compact ? 'app-card-body-compact' : 'app-card-body'
        }
      >
        {children}
      </div>
    </div>
  );
};

export default Card;
