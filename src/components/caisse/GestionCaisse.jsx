// frontend/src/components/caisse/GestionCaisse.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import caisseService from '../../services/caisse';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { AppIcon } from '../ui/icons';
import {
  BanknotesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { formatPrice } from '../../utils/formatters';

const GestionCaisse = () => {
  const { t } = useTranslation();
  const [caisse, setCaisse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRapprochement, setShowRapprochement] = useState(false);
  const [soldeConstate, setSoldeConstate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [historique, setHistorique] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [verificationMontant, setVerificationMontant] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const fetchCaisse = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await caisseService.getPrincipale();
      setCaisse(data);
      if (data) setSoldeConstate(data.solde_physique);
      // Charger l'historique
      await fetchHistorique(data?.id_caisse);
    } catch (err) {
      console.error("Erreur chargement caisse:", err);
      setError("Impossible de charger les informations de la caisse.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorique = async (caisseId) => {
    if (!caisseId) return;
    setLoadingHistorique(true);
    try {
      const data = await caisseService.getHistorique(caisseId, { limit: 10 });
      setHistorique(data || []);
    } catch (err) {
      console.error("Erreur chargement historique:", err);
    } finally {
      setLoadingHistorique(false);
    }
  };

  useEffect(() => {
    fetchCaisse();
  }, []);

  const handleRapprochement = async (e) => {
    e.preventDefault();
    if (!caisse) return;
    setSubmitting(true);
    try {
      await caisseService.effectuerRapprochement(caisse.id_caisse, parseFloat(soldeConstate));
      setShowRapprochement(false);
      fetchCaisse();
      alert("Rapprochement de caisse effectué avec succès !");
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors du rapprochement");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Vérifier la trésorerie pour un montant donné
  const handleVerifierTresorerie = async () => {
    if (!verificationMontant || parseFloat(verificationMontant) <= 0) {
      setVerificationResult({
        est_suffisante: false,
        message: "Veuillez saisir un montant valide",
        type: "error"
      });
      return;
    }

    try {
      const result = await caisseService.verifierTresorerie(parseFloat(verificationMontant));
      setVerificationResult({
        ...result,
        type: result.est_suffisante ? 'success' : 'error'
      });
    } catch (err) {
      setVerificationResult({
        est_suffisante: false,
        message: err.response?.data?.detail || "Erreur lors de la vérification",
        type: "error"
      });
    }
  };

  // ✅ Statut de la caisse
  const getStatutCaisse = () => {
    if (!caisse) return { label: 'Inconnu', color: 'gray' };
    if (caisse.statut === 'FERMEE') return { label: 'Fermée', color: 'danger' };
    if (caisse.solde_physique <= 0) return { label: 'Vide', color: 'warning' };
    return { label: 'Ouverte', color: 'success' };
  };

  const statut = getStatutCaisse();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <AppIcon icon={BanknotesIcon} size="lg" className="text-success" />
            {t('caisse.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {t('caisse.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${statut.color}/10 text-${statut.color}`}>
            {statut.label}
          </span>
          <Button variant="outline" onClick={fetchCaisse} disabled={loading}>
            <AppIcon icon={ArrowPathIcon} size="sm" className="mr-1" />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-danger/10 text-danger rounded-lg border border-danger/20">
          {error}
        </div>
      ) : (
        <>
          {/* ✅ Cartes de synthèse */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-success">
              <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400 mb-1">
                {t('caisse.soldePhysique')}
              </h3>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">
                {formatPrice(caisse?.solde_physique)} {caisse?.devise || 'XAF'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('caisse.soldePhysiqueDesc')}</p>
            </Card>

            <Card className="border-l-4 border-l-primary-500">
              <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400 mb-1">
                {t('caisse.soldeTheorique')}
              </h3>
              <div className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">
                {formatPrice(caisse?.solde_theorique)} {caisse?.devise || 'XAF'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('caisse.soldeTheoriqueDesc')}</p>
            </Card>

            <Card className="border-l-4 border-l-warning">
              <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400 mb-1">
                {t('caisse.dernierRapprochement')}
              </h3>
              <div className="text-lg font-bold text-gray-800 dark:text-slate-200 mt-1">
                {caisse?.dernier_rapprochement
                  ? new Date(caisse.dernier_rapprochement).toLocaleString('fr-FR')
                  : t('caisse.aucunRapprochement')}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('caisse.dernierRapprochementDesc')}</p>
            </Card>

            {/* ✅ Écart */}
            <Card className={`border-l-4 ${caisse?.solde_physique === caisse?.solde_theorique ? 'border-l-success' : 'border-l-danger'}`}>
              <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400 mb-1">
                {t('caisse.ecart')}
              </h3>
              <div className={`text-2xl font-extrabold ${caisse?.solde_physique === caisse?.solde_theorique ? 'text-success' : 'text-danger'}`}>
                {caisse ? formatPrice(Math.abs(caisse.solde_physique - caisse.solde_theorique)) : '-'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {caisse?.solde_physique === caisse?.solde_theorique 
                  ? t('caisse.ecartOk') 
                  : t('caisse.ecartKo')}
              </p>
            </Card>
          </div>

          {/* ✅ Action rapide : Vérification de trésorerie (pour le workflow) */}
          <Card title={t('caisse.verifierTresorerie')} subtitle={t('caisse.verifierTresorerieDesc')}>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {t('caisse.montantAVerifier')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={verificationMontant}
                  onChange={(e) => setVerificationMontant(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <Button variant="primary" onClick={handleVerifierTresorerie}>
                <AppIcon icon={CurrencyDollarIcon} size="sm" className="mr-1" />
                {t('caisse.verifier')}
              </Button>
              <Button
                variant="success"
                onClick={() => setShowRapprochement(true)}
              >
                <AppIcon icon={PencilSquareIcon} size="sm" className="mr-1" />
                {t('caisse.rapprochement')}
              </Button>
            </div>

            {/* Résultat de vérification */}
            {verificationResult && (
              <div className={`mt-3 p-3 rounded-lg border ${verificationResult.type === 'success' ? 'border-success bg-success/5 text-success' : 'border-danger bg-danger/5 text-danger'}`}>
                <div className="flex items-start gap-2">
                  <AppIcon 
                    icon={verificationResult.type === 'success' ? CheckCircleIcon : XCircleIcon} 
                    size="sm" 
                    className="mt-0.5 shrink-0" 
                  />
                  <div>
                    <p className="font-medium">
                      {verificationResult.est_suffisante ? t('caisse.tresorerieSuffisante') : t('caisse.tresorerieInsuffisante')}
                    </p>
                    <p className="text-sm">{verificationResult.message}</p>
                    {verificationResult.tresorerie_disponible !== undefined && (
                      <p className="text-sm mt-1">
                        {t('caisse.soldeDisponible')}: <strong>{formatPrice(verificationResult.tresorerie_disponible)}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ✅ Historique des mouvements */}
          <Card title={t('caisse.historique')} subtitle={t('caisse.historiqueDesc')}>
            {loadingHistorique ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              </div>
            ) : historique.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-slate-500 py-4">
                {t('caisse.aucunMouvement')}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-night-active">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400">
                        {t('caisse.date')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400">
                        {t('caisse.type')}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-slate-400">
                        {t('caisse.montant')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400">
                        {t('caisse.reference')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    {historique.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-night-hover">
                        <td className="px-3 py-2 text-gray-600 dark:text-slate-400">
                          {new Date(item.date).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${item.type === 'DEBIT' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                            {item.type === 'DEBIT' ? t('caisse.debit') : t('caisse.credit')}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-slate-100">
                          {formatPrice(item.montant)}
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-slate-400 text-xs">
                          {item.reference || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ✅ Alertes */}
          {caisse && caisse.solde_physique < 10000 && (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3">
              <AppIcon icon={ExclamationTriangleIcon} size="sm" className="text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning">{t('caisse.alerteSoldeBas')}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {t('caisse.alerteSoldeBasDesc', { solde: formatPrice(caisse.solde_physique) })}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Rapprochement */}
      {showRapprochement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">
              {t('caisse.rapprochementTitle')}
            </h3>
            <form onSubmit={handleRapprochement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {t('caisse.soldeConstate')} ({caisse?.devise || 'XAF'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={soldeConstate}
                  onChange={(e) => setSoldeConstate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {t('caisse.soldeActuel')}: <strong>{formatPrice(caisse?.solde_physique)}</strong>
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <Button variant="secondary" onClick={() => setShowRapprochement(false)} type="button">
                  {t('common.cancel')}
                </Button>
                <Button variant="success" type="submit" isLoading={submitting}>
                  <AppIcon icon={CheckCircleIcon} size="sm" className="mr-1" />
                  {t('caisse.validerRapprochement')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCaisse;