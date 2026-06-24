import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const LandingPageControls = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLanguage, t } = useLanguage();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex items-center rounded-lg border border-border-light dark:border-border-dark overflow-hidden"
        role="group"
        aria-label={t('settings.language')}
      >
        {['fr', 'en'].map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLanguage(l)}
            className={`px-2.5 py-1.5 text-xs font-semibold uppercase transition-colors ${
              lang === l
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-night-active'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="header-icon-btn"
        aria-label={theme === 'light' ? t('darkMode') : t('lightMode')}
      >
        {theme === 'light' ? (
          <MoonIcon className="w-5 h-5" />
        ) : (
          <SunIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default LandingPageControls;
