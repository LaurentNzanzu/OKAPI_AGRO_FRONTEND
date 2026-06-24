import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import {
  BuildingOffice2Icon,
  ChartBarIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const chartBars = [42, 68, 55, 82, 74, 90, 65];

const DashboardPreview = () => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0 lg:ml-auto" aria-hidden="true">
      <div className="absolute -top-8 -right-8 w-64 h-64 bg-primary-600/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-primary-400/10 rounded-full blur-2xl" />

      <div className="absolute -left-2 sm:-left-6 top-12 z-20 hidden sm:block">
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-slate-400">{t('landingPreview.depreciation')}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{t('landingPreview.upToDate')}</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 sm:-right-4 bottom-20 z-20 hidden sm:block">
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
          <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">+12%</span>
          <span className="text-xs text-gray-500 dark:text-slate-400">{t('landingPreview.thisMonth')}</span>
        </div>
      </div>

      <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 border border-border-light dark:border-border-dark bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-1">
        <div className="rounded-[0.9rem] overflow-hidden bg-surface-light dark:bg-surface-dark">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-night-active border-b border-border-light dark:border-border-dark">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-full bg-white dark:bg-night-hover text-[10px] text-gray-400 dark:text-slate-500 border border-border-light dark:border-border-dark">
                okapi.app/dashboard
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4 bg-gradient-to-b from-canvas-light to-white dark:from-canvas-dark dark:to-surface-dark">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center">
                  <BuildingOffice2Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-slate-100">{t('landingPreview.dashboard')}</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400">{t('landingPreview.overview')}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200 font-medium">
                {t('landingPreview.live')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white dark:bg-night-active/50 border border-border-light dark:border-border-dark p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <CubeIcon className="w-4 h-4 text-primary-600 dark:text-primary-200" />
                  <span className="text-[9px] text-success font-medium">+8%</span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-slate-400">{t('landingPreview.assets')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-slate-100">248</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-night-active/50 border border-border-light dark:border-border-dark p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <ChartBarIcon className="w-4 h-4 text-primary-600 dark:text-primary-200" />
                  <span className="text-[9px] text-gray-400">{t('landingPreview.monthly')}</span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-slate-400">{t('landingPreview.netValue')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-slate-100">4.2M $</p>
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-night-active/50 border border-border-light dark:border-border-dark p-3 shadow-sm">
              <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400 mb-3">
                {t('landingPreview.fleetEvolution')}
              </p>
              <div className="flex items-end justify-between gap-1.5 h-20">
                {chartBars.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-primary-600 to-primary-400 dark:from-primary-700 dark:to-primary-500 opacity-90"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
