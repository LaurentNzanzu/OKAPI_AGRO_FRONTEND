import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { getRapportAmortissements } from '../../services/rapports';
import ExportRapport from './ExportRapport';
import { formatNumber } from '../../utils/formatters';
import { usePageActions } from '../../context/PageActionsContext';
import {
  AppIcon,
  ChartBarIcon,
  CalculatorIcon,
  CubeIcon,
  PrinterIcon,
} from '../ui/icons';

const currentYear = new Date().getFullYear();

const RapportsAmortissements = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [annee, setAnnee] = useState(currentYear);
  const [error, setError] = useState(null);
  const { registerActions, clearActions } = usePageActions();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRapportAmortissements(annee);
      setData(result);
    } catch (err) {
      console.error('Erreur chargement rapport amortissements:', err);
      setError(err.response?.data?.detail || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [annee]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    if (loading) return;
    registerActions({ onPrint: handlePrint });
    return () => clearActions();
  }, [loading, handlePrint, registerActions, clearActions]);

  const anneeOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600 dark:text-slate-300">Chargement du rapport...</span>
      </div>
    );
  }

  return (
    <AppPage>
      <div className="no-print">
        <PageHeader
          title="Rapport d'amortissements"
          subtitle="Dotations comptables par exercice et détail par bien"
          icon={CalculatorIcon}
          action={
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <PrinterIcon className="w-4 h-4" /> Imprimer
            </Button>
          }
        />

        <Card compact>
          <div className="app-filter-bar">
            <div className="app-filter-field">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Exercice
              </label>
              <select
                value={annee}
                onChange={(e) => setAnnee(parseInt(e.target.value, 10))}
                className="form-input w-full"
              >
                {anneeOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={fetchData} className="md:self-end">
              Actualiser
            </Button>
          </div>
        </Card>

        <ExportRapport typeRapport="amortissements" annee={annee} />
      </div>

      {error ? (
        <div className="no-print bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : data ? (
        <div className="print-area space-y-6">
          <div className="hidden print:block text-center mb-4">
            <h1 className="text-xl font-bold">Rapport d&apos;amortissements — Exercice {data.annee}</h1>
            <p className="text-sm text-gray-600">
              Généré le {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="app-stats-grid">
            <StatCard
              label="Total dotations"
              value={`${formatNumber(data.total_dotations)} USD`}
              icon={ChartBarIcon}
              accent="success"
            />
            <StatCard
              label="Biens amortis"
              value={data.nombre_biens_amortis}
              icon={CubeIcon}
              hint={`Exercice ${data.annee}`}
            />
          </div>

          <Card
            title={`Détail des amortissements (${data.details.length})`}
            icon={<AppIcon icon={CalculatorIcon} size="md" />}
            noPadding
          >
            {data.details.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-slate-400">
                Aucun amortissement enregistré pour l&apos;exercice {data.annee}.
              </div>
            ) : (
              <div className="app-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bien ID</th>
                      <th>QR Code</th>
                      <th>Type</th>
                      <th>Méthode</th>
                      <th className="text-right">Valeur origine</th>
                      <th className="text-right">Valeur résiduelle</th>
                      <th className="text-right">Annuité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.details.map((ligne) => (
                      <tr key={ligne.id_amortissement}>
                        <td>{ligne.bien_id}</td>
                        <td className="font-mono">{ligne.qr_code}</td>
                        <td>{ligne.type_bien || '-'}</td>
                        <td>{ligne.methode || '-'}</td>
                        <td className="text-right">{formatNumber(ligne.valeur_origine)}</td>
                        <td className="text-right">{formatNumber(ligne.valeur_residuelle)}</td>
                        <td className="text-right font-medium">{formatNumber(ligne.annuite)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-slate-800/50 font-semibold">
                      <td colSpan={6} className="text-right">
                        Total dotations
                      </td>
                      <td className="text-right">{formatNumber(data.total_dotations)} USD</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </AppPage>
  );
};

export default RapportsAmortissements;
