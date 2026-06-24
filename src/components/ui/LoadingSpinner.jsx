import React from 'react';
import { useTranslation } from '../../context/LanguageContext';

const LoadingSpinner = ({ fullScreen = false, size = 'md', message }) => {
  const { t } = useTranslation();
  const displayMessage = message ?? t('common.loading');

  const sizes = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className={`spinner ${sizes[size]}`} />
          <p className="mt-4 text-gray-600 dark:text-slate-400">{displayMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`spinner ${sizes[size]}`} />
      {displayMessage && <p className="mt-4 text-gray-500 dark:text-slate-400">{displayMessage}</p>}
    </div>
  );
};

export default LoadingSpinner;
