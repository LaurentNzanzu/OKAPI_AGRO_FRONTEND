import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  CubeIcon,
  CalculatorIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  PuzzlePieceIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getAccessibleHomePath } from '../config/permissions';
import Button from '../components/ui/Button';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import LandingFeatureCard from '../components/landing/LandingFeatureCard';
import DashboardPreview from '../components/landing/DashboardPreview';
import MobileAppDownload from '../components/landing/MobileAppDownload';

const featureConfig = [
  { titleKey: 'landingFeatureAssetsTitle', descKey: 'landingFeatureAssetsDesc', icon: CubeIcon },
  { titleKey: 'landingFeatureDepreciationTitle', descKey: 'landingFeatureDepreciationDesc', icon: CalculatorIcon },
  { titleKey: 'landingFeatureMovementsTitle', descKey: 'landingFeatureMovementsDesc', icon: ArrowPathIcon },
  { titleKey: 'landingFeatureBreakdownsTitle', descKey: 'landingFeatureBreakdownsDesc', icon: ExclamationTriangleIcon },
  { titleKey: 'landingFeatureMaintenanceTitle', descKey: 'landingFeatureMaintenanceDesc', icon: WrenchScrewdriverIcon },
  { titleKey: 'landingFeaturePartsTitle', descKey: 'landingFeaturePartsDesc', icon: PuzzlePieceIcon },
  { titleKey: 'landingFeatureValidationsTitle', descKey: 'landingFeatureValidationsDesc', icon: CheckCircleIcon },
  { titleKey: 'landingFeatureReportsTitle', descKey: 'landingFeatureReportsDesc', icon: DocumentTextIcon },
  { titleKey: 'landingFeatureUsersTitle', descKey: 'landingFeatureUsersDesc', icon: UserGroupIcon },
];

const scrollToMobile = () => {
  document.getElementById('application-mobile')?.scrollIntoView({ behavior: 'smooth' });
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { authenticated, authReady, user } = useAuth();

  if (authReady && authenticated) {
    return <Navigate to={getAccessibleHomePath(user)} replace />;
  }

  const features = featureConfig.map((item) => ({
    title: t(item.titleKey),
    description: t(item.descKey),
    icon: item.icon,
  }));

  return (
    <div className="min-h-screen bg-white dark:bg-canvas-dark text-gray-900 dark:text-slate-100 transition-colors">
      <LandingNavbar />

      <main>
        <section className="pt-28 pb-16 md:pt-36 md:pb-24 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="text-center lg:text-left">
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{t('landingHeroTagline')}</p>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-gray-900 dark:text-slate-100 leading-[1.1]">
                  {t('landingHeroTitle')}
                </h1>

                <p className="mt-5 text-lg font-medium text-primary-600 dark:text-primary-200">
                  {t('landingHeroSubtitle')}
                </p>

                <p className="mt-4 text-base text-gray-600 dark:text-slate-300 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  {t('landingHeroDescription')}
                </p>

                <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate('/login')}>
                    {t('landingLogin')}
                    <ArrowRightIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={scrollToMobile}
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    {t('landingDownloadMobile')}
                  </Button>
                </div>
              </div>

              <div className="lg:pl-4">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="py-16 md:py-24 bg-white dark:bg-canvas-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100">
                {t('landingFeaturesTitle')}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-slate-300 leading-relaxed">
                {t('landingFeaturesSubtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <LandingFeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section
          id="application-mobile"
          className="py-12 md:py-16 bg-gray-50 dark:bg-night-active/20 border-t border-border-light dark:border-border-dark"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <MobileAppDownload variant="light" />
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
