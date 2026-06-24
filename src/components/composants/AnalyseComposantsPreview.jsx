import React, { useState, useEffect } from 'react';
import { composantsService } from '../../services/composants';
import { useTranslation } from '../../context/LanguageContext';
import { AppIcon, ChartBarIcon, CheckCircleIcon } from '../ui/icons';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const AnalyseComposantsPreview = ({ bienId }) => {
  const { t } = useTranslation();
  const [analyse, setAnalyse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bienId) return;
    const fetchAnalyse = async () => {
      try {
        const data = await composantsService.analyseBien(bienId);
        setAnalyse(data);
      } catch (err) {
        console.error('Erreur analyse:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyse();
  }, [bienId]);

  if (loading) return <div className="text-sm text-gray-400 dark:text-slate-500 animate-pulse">{t('composantsAnalyse.loading')}</div>;
  if (!analyse || analyse.nombre_composants === 0) return null;

  const chartData = {
    labels: [...analyse.composants.map(c => c.designation), t('composantsAnalyse.structure')],
    datasets: [{
      data: [...analyse.composants.map(c => c.valeur), analyse.valeur_structure],
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#94a3b8'],
      borderWidth: 1,
      borderColor: '#ffffff'
    }]
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="w-48 h-48 shrink-0">
          <Pie data={chartData} options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="flex-1 w-full">
          <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <AppIcon icon={ChartBarIcon} size="sm" />
            {t('composantsAnalyse.title')}
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('composantsAnalyse.totalValue')}</p>
              <p className="font-bold text-gray-800 dark:text-slate-100">{analyse.valeur_totale_bien.toLocaleString()} USD</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('composantsAnalyse.components')}</p>
              <p className="font-bold text-gray-800 dark:text-slate-100">{t('composantsAnalyse.elements', { count: analyse.nombre_composants })}</p>
            </div>
          </div>
          <ul className="space-y-2">
            {analyse.composants.map(c => (
              <li key={c.id} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                <span>{c.designation} <span className="text-gray-400 dark:text-slate-500">({t('composantsAnalyse.years', { count: c.duree_vie_ans })})</span></span>
                <span className="font-medium">{c.valeur.toLocaleString()} USD</span>
              </li>
            ))}
            {analyse.valeur_structure > 0 && (
              <li className="flex justify-between text-sm text-gray-500 dark:text-slate-400 pt-1">
                <span>{t('composantsAnalyse.structure')}</span>
                <span>{analyse.valeur_structure.toLocaleString()} USD</span>
              </li>
            )}
          </ul>
          <div className="mt-3 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-md inline-flex items-center gap-1">
            <AppIcon icon={CheckCircleIcon} size="xs" />
            {t('composantsAnalyse.conform')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyseComposantsPreview;
