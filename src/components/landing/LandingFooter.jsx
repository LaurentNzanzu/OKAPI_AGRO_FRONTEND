import React from 'react';
import { Link } from 'react-router-dom';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../context/LanguageContext';

const LandingFooter = () => {
  const { t } = useLanguage();

  const footerNav = [
    { labelKey: 'landingNavHome', to: '/' },
    { labelKey: 'landingNavFeatures', href: '#fonctionnalites' },
    { labelKey: 'landingLogin', to: '/login' },
  ];

  const footerLegal = [
    { labelKey: 'landingFooterPrivacy', href: '#' },
    { labelKey: 'landingFooterTerms', href: '#' },
    { labelKey: 'landingFooterLegalNotice', href: '#' },
  ];

  return (
    <footer className="bg-primary-800 dark:bg-primary-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <BuildingOffice2Icon className="w-7 h-7 text-primary-200" />
              <span className="text-base font-bold text-white">{t('appTitle')}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{t('landingFooterAbout')}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('landingFooterNavigation')}</h4>
            <ul className="space-y-2.5">
              {footerNav.map((item) => (
                <li key={item.labelKey}>
                  {item.to ? (
                    <Link to={item.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {t(item.labelKey)}
                    </Link>
                  ) : (
                    <a href={item.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {t(item.labelKey)}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('landingFooterLegal')}</h4>
            <ul className="space-y-2.5">
              {footerLegal.map((item) => (
                <li key={item.labelKey}>
                  <a href={item.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {t(item.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('landingFooterContact')}</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>Kinshasa, RDC</li>
              <li>
                <a href="mailto:contact@okapi-immobilisations.app" className="hover:text-white transition-colors">
                  contact@okapi-immobilisations.app
                </a>
              </li>
              <li>+243 000 000 000</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 text-center sm:text-left">{t('landingFooterCopyright')}</p>
          <p className="text-xs text-slate-500">{t('landingFooterRights')}</p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
