import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { MOBILE_APP_LINKS } from '../../config/mobileApp';

const StoreBadge = ({ href, label, sublabel, available, light = false, t }) => {
  const baseClass =
    'inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 min-w-[160px]';

  if (!available) {
    return (
      <span
        className={`${baseClass} ${
          light
            ? 'border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-gray-400 dark:text-slate-500'
            : 'border-white/20 bg-white/5 text-white/60'
        } cursor-not-allowed`}
        title={t('landingMobile.soonTitle', { label })}
        aria-disabled="true"
      >
        <StoreIcon />
        <span className="text-left">
          <span className="block text-[10px] uppercase tracking-wide opacity-80">{sublabel}</span>
          <span className="block text-sm font-semibold">{label}</span>
          <span className="block text-[10px] mt-0.5 opacity-70">{t('landingMobile.soonAvailable')}</span>
        </span>
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} ${
        light
          ? 'border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 hover:border-primary-300 dark:hover:border-night-muted'
          : 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50'
      }`}
    >
      <StoreIcon />
      <span className="text-left">
        <span className="block text-[10px] uppercase tracking-wide opacity-90">{sublabel}</span>
        <span className="block text-sm font-semibold">{label}</span>
      </span>
    </a>
  );
};

const StoreIcon = () => (
  <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const MobileAppDownload = ({ variant = 'dark' }) => {
  const { t } = useTranslation();
  const isDark = variant === 'dark';
  const light = variant === 'light';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
        <StoreBadge
          href={MOBILE_APP_LINKS.googlePlay}
          label="Google Play"
          sublabel={t('landingMobile.availableOn')}
          available={Boolean(MOBILE_APP_LINKS.googlePlay)}
          light={light}
          t={t}
        />
        <StoreBadge
          href={MOBILE_APP_LINKS.appStore}
          label="App Store"
          sublabel={t('landingMobile.downloadOn')}
          available={Boolean(MOBILE_APP_LINKS.appStore)}
          light={light}
          t={t}
        />
      </div>
      {!MOBILE_APP_LINKS.googlePlay && !MOBILE_APP_LINKS.appStore && (
        <p className={`text-xs ${isDark ? 'text-primary-200/80' : 'text-gray-500 dark:text-slate-400'}`}>
          {t('landingMobile.linksPending')}
        </p>
      )}
    </div>
  );
};

export default MobileAppDownload;
