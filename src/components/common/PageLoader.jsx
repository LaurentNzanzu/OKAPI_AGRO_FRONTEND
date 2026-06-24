import React from 'react';
import { useLanguageOptional } from '../../context/LanguageContext';

const PageLoader = () => {
  const lang = useLanguageOptional();
  const ariaLabel = lang?.t('common.pageLoader.ariaLabel') ?? 'Chargement de la page';
  const message = lang?.t('loading') ?? 'Chargement...';

  return (
    <div
      className="flex flex-col items-center justify-center py-20 min-h-[200px]"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">{message}</p>
    </div>
  );
};

export default PageLoader;
