import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import FicheStock from './FicheStock';
import EtatParc from './EtatParc';
import EtatFinancier from './EtatFinancier';
import EtatSortie from './EtatSortie';
import Card from '../ui/Card';
import { AppIcon } from '../ui/icons';
import {
  ArchiveBoxIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const GestionEtats = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('stock');

  const tabs = [
    { id: 'stock', label: t('etats.tabStock') || 'Fiche de Stock', icon: ArchiveBoxIcon },
    { id: 'parc', label: t('etats.tabParc') || 'État du Parc', icon: CubeIcon },
    { id: 'financier', label: t('etats.tabFinancier') || 'État Financier', icon: CurrencyDollarIcon },
    { id: 'sortie', label: t('etats.tabSortie') || 'État de Sortie', icon: ArrowUpTrayIcon }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <AppIcon icon={ChartBarIcon} size="lg" className="text-primary-600 dark:text-primary-400" />
            {t('etats.title') || 'États Financiers & de Gestion'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {t('etats.subtitle') || 'Synthèse et tableaux d\'inventaire du patrimoine'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200
              border-b-2 -mb-px
              ${activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20 rounded-t-lg'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-t-lg'
              }
            `}
          >
            <AppIcon icon={tab.icon} size="sm" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === 'stock' && <FicheStock />}
        {activeTab === 'parc' && <EtatParc />}
        {activeTab === 'financier' && <EtatFinancier />}
        {activeTab === 'sortie' && <EtatSortie />}
      </div>
    </div>
  );
};

export default GestionEtats;