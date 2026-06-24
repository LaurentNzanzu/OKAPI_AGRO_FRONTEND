import React from 'react';

const PageHeader = ({ title, subtitle, icon: Icon, action, className = '' }) => {
  return (
    <div className={`app-page-header ${className}`}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="mt-0.5 p-2 rounded-lg bg-primary-50 dark:bg-night-active text-primary-600 dark:text-slate-100 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-slate-100 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="w-full sm:w-auto shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
