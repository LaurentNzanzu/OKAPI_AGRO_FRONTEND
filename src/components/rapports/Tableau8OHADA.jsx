// frontend/src/components/rapports/Tableau8OHADA.jsx
import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import  rapportsService  from '../../services/rapports';
import { formatPrice } from '../../utils/formatters';
import {
  AppIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from '../ui/icons';

const Tableau8OHADA = () => {
  const { t } = useTranslation();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const genererTableau = async () => {
    setLoading(true);
    setError(null);
    try {
      const resultat = await rapportsService.generateTableau8(annee);
      setData(resultat);
    } catch (err) {
      console.error('Erreur génération tableau 8:', err);
      setError(err.response?.data?.detail || t('tableau8.generateError'));
    } finally {
      setLoading(false);
    }
  };

  const exporterPDF = async () => {
    try {
      const response = await rapportsService.exportTableau8PDF(annee);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tableau8_${annee}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur export PDF Tableau 8:', err);
      window.print();
    }
  };

  const exporterCSV = () => {
    if (data) {
      rapportsService.exportCSV(data, `tableau8_${annee}`);
    }
  };

  return (
    <AppPage>
      {/* En-tête */}
      <div className="app-page-header">
        <div>
          <h1 className="text-page-title inline-flex items-center gap-3">
            <AppIcon icon={DocumentTextIcon} size="lg" className="text-primary-600" />
            {t('tableau8.title')}
          </h1>
          <p className="text-page-subtitle text-gray-500 dark:text-slate-400 mt-1">
            {t('tableau8.subtitle')}
          </p>
        </div>
      </div>

      {/* Contrôles */}
      <Card className="no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <AppIcon icon={CalendarDaysIcon} size="sm" className="text-gray-500" />
            <label className="font-medium text-sm">{t('tableau8.year')}:</label>
            <input
              type="number"
              value={annee}
              onChange={(e) => setAnnee(parseInt(e.target.value) || new Date().getFullYear())}
              className="form-input w-24"
              min={2000}
              max={new Date().getFullYear() + 5}
            />
          </div>
          <Button
            variant="primary"
            onClick={genererTableau}
            isLoading={loading}
          >
            <AppIcon icon={ChartBarIcon} size="sm" />
            {t('tableau8.generate')}
          </Button>
          {data && (
            <>
              <Button
                variant="secondary"
                onClick={exporterPDF}
              >
                <AppIcon icon={PrinterIcon} size="sm" />
                {t('tableau8.pdf')}
              </Button>
              <Button
                variant="secondary"
                onClick={exporterCSV}
              >
                <AppIcon icon={ArrowDownTrayIcon} size="sm" />
                {t('tableau8.csv')}
              </Button>
            </>
          )}
        </div>
        {error && (
          <div className="alert-error mt-3">{error}</div>
        )}
      </Card>

      {/* Résultats */}
      {data && (
        <div className="print-area">
          <Card>
            {/* En-tête du tableau */}
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <h2 className="text-xl font-bold uppercase">
                {t('tableau8.tableTitle')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t('tableau8.exercice')} {data.annee}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {t('tableau8.generatedAt')} {new Date().toLocaleString()}
              </p>
            </div>

            {/* Vérification d'équilibrage */}
            <div className={`p-4 mb-4 rounded-lg border-2 ${
              data.coherent 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400'
            }`}>
              {data.coherent ? (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <AppIcon icon={CheckCircleIcon} size="sm" />
                  {t('tableau8.coherent')}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AppIcon icon={ExclamationTriangleIcon} size="sm" />
                  {t('tableau8.incoherent', { amount: formatPrice(data.ecart) })}
                </div>
              )}
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto" id="tableau8-print">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">{t('tableau8.category')}</th>
                    <th className="text-right">{t('tableau8.grossStart')}</th>
                    <th className="text-right">{t('tableau8.increases')}</th>
                    <th className="text-right">{t('tableau8.decreases')}</th>
                    <th className="text-right">{t('tableau8.grossEnd')}</th>
                    <th className="text-right">{t('tableau8.accumulatedAmort')}</th>
                    <th className="text-right">{t('tableau8.currentDotation')}</th>
                    <th className="text-right">{t('tableau8.nbvEnd')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.categories).map(([cat, valeurs], index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50 dark:bg-gray-800/50'}>
                      <td className="font-medium">{cat}</td>
                      <td className="text-right">{formatPrice(valeurs.brut_debut)}</td>
                      <td className="text-right text-green-600 dark:text-green-400">{formatPrice(valeurs.augmentations)}</td>
                      <td className="text-right text-red-600 dark:text-red-400">{formatPrice(valeurs.diminutions)}</td>
                      <td className="text-right font-bold">{formatPrice(valeurs.brut_fin)}</td>
                      <td className="text-right">{formatPrice(valeurs.amortissements_cumules)}</td>
                      <td className="text-right">{formatPrice(valeurs.dotations_exercice)}</td>
                      <td className="text-right font-bold text-blue-600 dark:text-blue-400">{formatPrice(valeurs.vnc_fin)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                    <td className="text-left">{t('tableau8.total')}</td>
                    <td className="text-right">{formatPrice(data.total_general.brut_debut)}</td>
                    <td className="text-right text-green-600 dark:text-green-400">{formatPrice(data.total_general.augmentations)}</td>
                    <td className="text-right text-red-600 dark:text-red-400">{formatPrice(data.total_general.diminutions)}</td>
                    <td className="text-right">{formatPrice(data.total_general.brut_fin)}</td>
                    <td className="text-right">{formatPrice(data.total_general.amortissements_cumules)}</td>
                    <td className="text-right">{formatPrice(data.total_general.dotations_exercice)}</td>
                    <td className="text-right text-blue-600 dark:text-blue-400">{formatPrice(data.total_general.vnc_fin)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pied de tableau */}
            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-2">
              <p>{t('tableau8.footer')}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          
          #tableau8-print {
            font-size: 9px !important;
            page-break-inside: avoid !important;
            width: 100% !important;
          }
          
          #tableau8-print th,
          #tableau8-print td {
            padding: 3px 6px !important;
            border: 1px solid #ccc !important;
          }
          
          .print-area {
            position: static !important;
            width: 100% !important;
          }
          
          .print-area * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          @page {
            size: landscape;
            margin: 8mm;
          }
        }
      `}</style>
    </AppPage>
  );
};

export default Tableau8OHADA;