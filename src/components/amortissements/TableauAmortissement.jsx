// frontend/src/components/amortissements/TableauAmortissement.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { amortissementsService } from '../../services/amortissements';
import { formatPrice } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/24/outline";

import {
  AppIcon,
  DownloadIcon,
  PrinterIcon,
  CheckCircleIcon,
} from "../ui/icons";
const TableauAmortissement = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFiscal, setShowFiscal] = useState(true);
  const [estVerrouille, setEstVerrouille] = useState(false);
  const [infosVerrouillage, setInfosVerrouillage] = useState(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [planData, verrouData] = await Promise.all([
        amortissementsService.getPlan(id),
        amortissementsService.getVerrouillage(id).catch(() => null)
      ]);
      
      setPlan(planData || []);
      
      if (verrouData) {
        setEstVerrouille(verrouData.est_verrouille || false);
        setInfosVerrouillage(verrouData);
      }
    } catch (err) {
      console.error('Erreur chargement tableau:', err);
      setError(err.response?.data?.detail || t('amortissements.tableau.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (plan.length === 0) return;
    
    const headers = [
      t('amortissements.tableau.colAnnee'),
      t('amortissements.tableau.colVncDebut'),
      t('amortissements.tableau.colAnnuite'),
      t('amortissements.tableau.colCumul'),
      t('amortissements.tableau.colVncFin'),
    ];
    
    if (showFiscal) {
      headers.splice(3, 0,
        t('amortissements.tableau.colAnnuiteFiscale'),
        t('amortissements.tableau.colEcart'),
        t('amortissements.tableau.colCumulFiscal'),
        t('amortissements.tableau.colVncFinFiscale'),
      );
    }

    const rows = plan.map(row => {
      const base = [
        row.annee,
        formatPrice(row.vnc_debut_c),
        formatPrice(row.annuite_c),
        formatPrice(row.cumul_c),
        formatPrice(row.vnc_fin_c)
      ];
      if (showFiscal) {
        const fiscal = [
          formatPrice(row.annuite_f),
          formatPrice(row.ecart),
          formatPrice(row.cumul_f),
          formatPrice(row.vnc_fin_f)
        ];
        base.splice(3, 0, ...fiscal);
      }
      return base.map(val => `"${val}"`).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `plan_amortissement_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
        {error}
      </div>
    );
  }

  if (plan.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-slate-400">
        {t('amortissements.tableau.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec verrouillage */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            {t('amortissements.tableau.title')}
          </h3>
          {estVerrouille ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success text-xs rounded-full">
              <AppIcon icon={LockClosedIcon} size="xs" />
              {t('amortissements.tableau.verrouille')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">
              <AppIcon icon={LockOpenIcon} size="xs" />
              {t('amortissements.tableau.nonVerrouille')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={showFiscal}
              onChange={(e) => setShowFiscal(e.target.checked)}
              className="rounded border-border-light dark:border-border-dark"
            />
            {t('amortissements.tableau.showFiscal')}
          </label>
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <AppIcon icon={DownloadIcon} size="sm" className="mr-1" />
            CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <AppIcon icon={PrinterIcon} size="sm" className="mr-1" />
            {t('common.print')}
          </Button>
        </div>
      </div>

      {/* Information de verrouillage */}
      {estVerrouille && infosVerrouillage && (
        <div className="p-3 bg-success/5 border border-success/20 rounded-lg flex items-center gap-2 text-sm text-success">
          <AppIcon icon={CheckCircleIcon} size="sm" />
          <span>
            {t('amortissements.tableau.verrouilleInfo', {
              date: infosVerrouillage.date_verrouillage 
                ? new Date(infosVerrouillage.date_verrouillage).toLocaleDateString('fr-FR')
                : 'N/A',
              user: infosVerrouillage.verrouille_par_nom || 'N/A'
            })}
          </span>
        </div>
      )}

      {/* Tableau (sans valeur résiduelle - TÂCHE 2) */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-primary-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {t('amortissements.tableau.colAnnee')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                {t('amortissements.tableau.colVncDebut')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                {t('amortissements.tableau.colAnnuite')}
              </th>
              {showFiscal && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    {t('amortissements.tableau.colAnnuiteFiscale')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    {t('amortissements.tableau.colEcart')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    {t('amortissements.tableau.colCumulFiscal')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    {t('amortissements.tableau.colVncFinFiscale')}
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                {t('amortissements.tableau.colCumul')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                {t('amortissements.tableau.colVncFin')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {plan.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-night-hover transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                  {row.annee}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-400">
                  {formatPrice(row.vnc_debut_c)}
                </td>
                <td className="px-4 py-3 text-right text-success font-medium">
                  {formatPrice(row.annuite_c)}
                </td>
                {showFiscal && (
                  <>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-400">
                      {formatPrice(row.annuite_f)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${row.ecart > 0 ? 'text-danger' : 'text-success'}`}>
                      {formatPrice(row.ecart)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-400">
                      {formatPrice(row.cumul_f)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-400">
                      {formatPrice(row.vnc_fin_f)}
                    </td>
                  </>
                )}
                <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-400">
                  {formatPrice(row.cumul_c)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-primary-600">
                  {formatPrice(row.vnc_fin_c)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note: Pas de valeur résiduelle (TÂCHE 2) */}
      <div className="text-xs text-gray-400 dark:text-slate-500 text-center">
        {t('amortissements.tableau.noResidualValue')}
      </div>
    </div>
  );
};

export default TableauAmortissement;