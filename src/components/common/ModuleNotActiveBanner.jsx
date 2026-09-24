import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const AUTO_DISMISS_MS = 8000;

const ModuleNotActiveBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [moduleCode, setModuleCode] = useState('');

  useEffect(() => {
    let timeoutId = null;

    const handleEvent = (event) => {
      const { module } = event.detail || {};
      setModuleCode(module || '');
      setVisible(true);

      // Auto-dismiss après 8s
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    };

    window.addEventListener('module-not-active', handleEvent);

    return () => {
      window.removeEventListener('module-not-active', handleEvent);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="no-print fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 backdrop-blur-sm px-4 py-3 shadow-dropdown">
        <div className="shrink-0 mt-0.5 text-danger">
          <ExclamationTriangleIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-danger">
            {t('moduleNotActive.title') || 'Module non activé'}
          </p>
          <p className="text-xs text-danger/90 mt-0.5">
            {t('moduleNotActive.message', { module: moduleCode }) ||
              `Le module "${moduleCode}" n'est pas inclus dans votre abonnement. Contactez votre administrateur.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 p-1 rounded-lg text-danger hover:bg-danger/20 transition-colors"
          aria-label={t('common.close') || 'Fermer'}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ModuleNotActiveBanner;
