import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BuildingOffice2Icon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';
import LandingPageControls from './LandingPageControls';

const LandingNavbar = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { labelKey: 'landingNavHome', to: '/' },
    { labelKey: 'landingNavFeatures', href: '#fonctionnalites' },
  ];

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNavClick = () => setMenuOpen(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md shadow-card border-b border-border-light dark:border-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 md:h-[4.5rem]">
          <Link to="/" className="flex items-center gap-2.5 min-w-0 group justify-self-start" onClick={scrollToTop}>
            <BuildingOffice2Icon className="w-7 h-7 text-primary-600 dark:text-primary-200 shrink-0 transition-transform group-hover:scale-105" />
            <span className="text-base font-bold text-gray-900 dark:text-slate-100 truncate">
              {t('appTitle')}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 justify-self-center" aria-label="Navigation principale">
            {navLinks.map((link) =>
              link.to ? (
                <Link
                  key={link.labelKey}
                  to={link.to}
                  onClick={scrollToTop}
                  className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors"
                >
                  {t(link.labelKey)}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors"
                >
                  {t(link.labelKey)}
                </a>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3 justify-self-end">
            <LandingPageControls />
            <Button size="sm" onClick={() => navigate('/login')}>
              {t('landingLogin')}
            </Button>
          </div>

          <div className="md:hidden flex items-center gap-1 justify-self-end col-start-3">
            <LandingPageControls />
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t('landingCloseMenu') : t('landingOpenMenu')}
            >
              {menuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <nav className="px-4 py-4 space-y-1" aria-label="Navigation mobile">
            {navLinks.map((link) =>
              link.to ? (
                <Link
                  key={link.labelKey}
                  to={link.to}
                  onClick={() => {
                    handleNavClick();
                    scrollToTop();
                  }}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-night-active"
                >
                  {t(link.labelKey)}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={handleNavClick}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-night-active"
                >
                  {t(link.labelKey)}
                </a>
              )
            )}
            <div className="pt-3">
              <Button
                className="w-full"
                onClick={() => {
                  handleNavClick();
                  navigate('/login');
                }}
              >
                {t('landingLogin')}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
