// frontend/src/components/rapports/RapportsFinanciers.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { getRapportFinancierOHADA, exportRapportOHADA } from '../../services/rapports';
import { formatNumber } from '../../utils/formatters';
import {
  AppIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  BuildingOffice2Icon,
  TruckIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from '../ui/icons';

const RapportsFinanciers = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState(null);
  const [dateDebut, setDateDebut] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [exercice, setExercice] = useState(new Date().getFullYear());
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateDebut, dateFin, exercice]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRapportFinancierOHADA(dateDebut, dateFin, exercice);
      setData(result);
    } catch (err) {
      console.error('Erreur chargement rapport financier:', err);
      setError(err.response?.data?.detail || t('rapports.financiers.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const blob = await exportRapportOHADA(format, dateDebut, dateFin, exercice);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport_financier_ohada_${dateDebut}_${dateFin}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur export:', err);
      setError(err.response?.data?.detail || t('rapports.financiers.exportError'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600 dark:text-slate-300">{t('rapports.financiers.loading')}</span>
      </div>
    );
  }

  return (
    <AppPage>
      <PageHeader
        title="Rapport Financier - SYSCOHADA"
        subtitle="Conforme aux normes OHADA/SYSCOHADA (Note 3A, 3C, 3D)"
        icon={CurrencyDollarIcon}
      />

      {/* Filtres */}
      <Card compact>
        <div className="app-filter-bar">
          <div className="app-filter-field">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="form-input w-full"
            />
          </div>
          <div className="app-filter-field">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="form-input w-full"
            />
          </div>
          <div className="app-filter-field">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Exercice</label>
            <input
              type="number"
              value={exercice}
              onChange={(e) => setExercice(parseInt(e.target.value))}
              className="form-input w-full"
              min={2000}
              max={2100}
            />
          </div>
          <div className="flex gap-2 md:self-end">
            <Button onClick={fetchData}>Actualiser</Button>
            <Button variant="secondary" onClick={() => handleExport('pdf')} disabled={exporting}>
              <AppIcon icon={DocumentTextIcon} size="sm" />
              {exporting ? 'Export...' : 'PDF'}
            </Button>
            <Button variant="secondary" onClick={() => handleExport('excel')} disabled={exporting}>
              <AppIcon icon={ArrowDownTrayIcon} size="sm" />
              {exporting ? 'Export...' : 'Excel'}
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : data ? (
        <>
          {/* Période */}
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 text-center text-sm text-gray-600 dark:text-slate-300">
            Période du <strong>{data.periode.debut}</strong> au <strong>{data.periode.fin}</strong> — Exercice <strong>{data.periode.exercice}</strong>
            <span className="ml-4 text-xs text-gray-400">Généré le {data.date_generation}</span>
          </div>

          {/* ============================================================
              A. SYNTHÈSE DU PATRIMOINE
              ============================================================ */}
          <Card title="A. Synthèse du patrimoine immobilier">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400">Valeur totale d'acquisition</p>
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                  {formatNumber(data.patrimoine.valeur_totale_acquisition)} FCFA
                </p>
                <p className="text-xs text-gray-400">{data.patrimoine.total_biens} biens</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400">Valeur nette comptable (VNC)</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatNumber(data.amortissements.valeur_nette_comptable_totale)} FCFA
                </p>
                <p className="text-xs text-gray-400">Cumul amortissements: {formatNumber(data.amortissements.cumul_total_amortissements)} FCFA</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400">Dotations amortissements (N)</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatNumber(data.amortissements.dotations_exercice)} FCFA
                </p>
                <p className="text-xs text-gray-400">Exercice {data.periode.exercice}</p>
              </div>
            </div>

            {/* Répartition par type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Répartition par type</h4>
                <div className="space-y-1">
                  {Object.entries(data.patrimoine.repartition_par_type).map(([type, values]) => (
                    <div key={type} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 py-1">
                      <span className="capitalize">{type || 'Autre'}</span>
                      <span>{values.count} biens — {formatNumber(values.valeur)} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Répartition par état</h4>
                <div className="space-y-1">
                  {Object.entries(data.patrimoine.repartition_par_etat).map(([etat, count]) => (
                    <div key={etat} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 py-1">
                      <span className="capitalize">{etat}</span>
                      <span>{count} biens</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* ============================================================
              C. CHARGES DE MAINTENANCE ET RÉPARATIONS
              ============================================================ */}
          <Card title="C. Charges de maintenance et réparations">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400">Coût des pannes</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatNumber(data.charges_cycle_vie.pannes.cout_total)} FCFA
                </p>
                <p className="text-xs text-gray-400">{data.charges_cycle_vie.pannes.total} pannes</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400">Coût des maintenances</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {formatNumber(data.charges_cycle_vie.maintenances.cout_total)} FCFA
                </p>
                <p className="text-xs text-gray-400">{data.charges_cycle_vie.maintenances.total} maintenances</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400">Total des charges</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {formatNumber(data.charges_cycle_vie.total_charges)} FCFA
                </p>
              </div>
            </div>

            {/* Top 5 biens les plus coûteux */}
            {data.charges_cycle_vie.top_biens_cout.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Top 5 biens les plus coûteux
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-3 py-2 text-left">Bien</th>
                        <th className="px-3 py-2 text-right">Pannes</th>
                        <th className="px-3 py-2 text-right">Maintenances</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.charges_cycle_vie.top_biens_cout.map((bien) => (
                        <tr key={bien.id_bien}>
                          <td className="px-3 py-2">{bien.designation}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(bien.cout_pannes)} FCFA</td>
                          <td className="px-3 py-2 text-right">{formatNumber(bien.cout_maintenances)} FCFA</td>
                          <td className="px-3 py-2 text-right font-medium">{formatNumber(bien.cout_total)} FCFA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          {/* ============================================================
              D. CESSIONS ET MOUVEMENTS (Note 3D)
              ============================================================ */}
          <Card title="D. Cessions et mouvements (Note 3D SYSCOHADA)">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400">Total cessions</p>
                <p className="text-2xl font-bold">{data.cessions_mouvements.total_cessions}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400">Plus-values</p>
                <p className="text-2xl font-bold text-green-700">{formatNumber(data.cessions_mouvements.plus_values)} FCFA</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400">Moins-values</p>
                <p className="text-2xl font-bold text-red-700">{formatNumber(data.cessions_mouvements.moins_values)} FCFA</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-slate-400">Biens mis au rebut</p>
                <p className="text-2xl font-bold">{data.cessions_mouvements.total_rebuts}</p>
              </div>
            </div>

            {/* Détail des cessions */}
            {data.cessions_mouvements.details_cessions.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Détail des cessions</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-3 py-2 text-left">Bien</th>
                        <th className="px-3 py-2 text-right">VNC</th>
                        <th className="px-3 py-2 text-right">Prix vente</th>
                        <th className="px-3 py-2 text-right">Résultat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.cessions_mouvements.details_cessions.map((c) => (
                        <tr key={c.id_cession}>
                          <td className="px-3 py-2">{c.designation}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(c.vnc)} FCFA</td>
                          <td className="px-3 py-2 text-right">{formatNumber(c.prix_vente)} FCFA</td>
                          <td className={`px-3 py-2 text-right font-medium ${c.resultat >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatNumber(c.resultat)} FCFA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          {/* ============================================================
              E. TABLEAU DE SUIVI DES AMORTISSEMENTS (Note 3C)
              ============================================================ */}
          <Card title={`E. Tableau de suivi des amortissements - Exercice ${data.periode.exercice} (Note 3C SYSCOHADA)`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Biens amortis</p>
                <p className="text-lg font-bold">{data.tableau_amortissements.total_biens}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Valeur brute</p>
                <p className="text-lg font-bold">{formatNumber(data.tableau_amortissements.total_valeur_origine)} FCFA</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Dotation N</p>
                <p className="text-lg font-bold">{formatNumber(data.tableau_amortissements.total_annuite_exercice)} FCFA</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-500">VNC</p>
                <p className="text-lg font-bold">{formatNumber(data.tableau_amortissements.total_valeur_nette_comptable)} FCFA</p>
              </div>
            </div>

            {/* Tableau détaillé */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-primary-600 text-white">
                  <tr>
                    <th className="px-2 py-2 text-left">Bien</th>
                    <th className="px-2 py-2 text-left">Type</th>
                    <th className="px-2 py-2 text-center">Méthode</th>
                    <th className="px-2 py-2 text-center">Durée</th>
                    <th className="px-2 py-2 text-right">Valeur brute</th>
                    <th className="px-2 py-2 text-right">Dotation N</th>
                    <th className="px-2 py-2 text-right">Cumul</th>
                    <th className="px-2 py-2 text-right">VNC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.tableau_amortissements.details.slice(0, 10).map((a) => (
                    <tr key={a.id_bien} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-2 py-1.5 font-medium">{a.designation}</td>
                      <td className="px-2 py-1.5 capitalize">{a.type_bien || '-'}</td>
                      <td className="px-2 py-1.5 text-center">{a.methode}</td>
                      <td className="px-2 py-1.5 text-center">{a.duree_vie} ans</td>
                      <td className="px-2 py-1.5 text-right">{formatNumber(a.valeur_origine)}</td>
                      <td className="px-2 py-1.5 text-right text-blue-600">{formatNumber(a.annuite_exercice)}</td>
                      <td className="px-2 py-1.5 text-right">{formatNumber(a.cumul_amortissements)}</td>
                      <td className="px-2 py-1.5 text-right font-medium">{formatNumber(a.valeur_nette_comptable)}</td>
                    </tr>
                  ))}
                </tbody>
                {data.tableau_amortissements.details.length > 10 && (
                  <tfoot>
                    <tr>
                      <td colSpan="8" className="px-2 py-2 text-center text-gray-400 text-xs">
                        + {data.tableau_amortissements.details.length - 10} autres biens
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>

          {/* ============================================================
              F. NOTES ANNEXES SYSCOHADA
              ============================================================ */}
          <Card title="F. Notes annexes SYSCOHADA">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Note 3A */}
              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{data.notes_annexes.note_3a.titre}</h4>
                <div className="space-y-1">
                  {data.notes_annexes.note_3a.details.map((item) => (
                    <div key={item.categorie} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 py-1">
                      <span className="capitalize">{item.categorie}</span>
                      <span>{item.nombre_biens} biens — {formatNumber(item.valeur_brute)} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note 3C */}
              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{data.notes_annexes.note_3c.titre}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm py-1">
                    <span>Dotation de l'exercice</span>
                    <span className="font-medium">{formatNumber(data.notes_annexes.note_3c.details.dotation_exercice)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-t border-gray-100">
                    <span>Cumul des amortissements</span>
                    <span className="font-medium">{formatNumber(data.notes_annexes.note_3c.details.cumul_amortissements)} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Note 3D */}
              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{data.notes_annexes.note_3d.titre}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm py-1">
                    <span>Plus-values</span>
                    <span className="text-green-600 font-medium">{formatNumber(data.notes_annexes.note_3d.details.plus_values)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span>Moins-values</span>
                    <span className="text-red-600 font-medium">{formatNumber(data.notes_annexes.note_3d.details.moins_values)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-t border-gray-100">
                    <span>Résultat net</span>
                    <span className={`font-medium ${data.notes_annexes.note_3d.details.resultat_net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(data.notes_annexes.note_3d.details.resultat_net)} FCFA
                    </span>
                  </div>
                </div>
              </div>

              {/* Note 3B */}
              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{data.notes_annexes.note_3b.titre}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm py-1">
                    <span>Contrats en cours</span>
                    <span>{data.notes_annexes.note_3b.details.nombre_contrats}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span>Valeur totale</span>
                    <span>{formatNumber(data.notes_annexes.note_3b.details.valeur_totale)} FCFA</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{data.notes_annexes.note_3b.details.commentaire}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 border-t pt-4 mt-4">
            Rapport généré automatiquement — Conforme aux normes OHADA/SYSCOHADA
          </div>
        </>
      ) : null}
    </AppPage>
  );
};

export default RapportsFinanciers;