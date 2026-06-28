// frontend/src/components/dashboard/CaisseWidget.jsx
import React, { useEffect, useState } from 'react';
import caisseService from '../../services/caisse';
import Card from '../ui/Card';
import { AppIcon } from '../ui/icons';
import { BanknotesIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const CaisseWidget = () => {
  const [caisse, setCaisse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCaisse = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await caisseService.getPrincipale();
      setCaisse(data);
    } catch (err) {
      console.error("Erreur chargement caisse:", err);
      setError("Impossible de charger la trésorerie");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaisse();
  }, []);

  return (
    <Card compact className="relative overflow-hidden border-l-4 border-l-success">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-success/10 text-success rounded-xl">
            <AppIcon icon={BanknotesIcon} size="md" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Trésorerie Caisse Physiques
            </h4>
            {loading ? (
              <div className="h-6 w-24 bg-gray-200 dark:bg-slate-700 animate-pulse rounded mt-1" />
            ) : error ? (
              <span className="text-xs text-danger flex items-center gap-1 mt-1">
                <AppIcon icon={ExclamationTriangleIcon} size="xs" /> {error}
              </span>
            ) : (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  {caisse?.solde_physique?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                  {caisse?.devise || 'FCFA'}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={fetchCaisse}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          title="Actualiser"
        >
          <AppIcon icon={ArrowPathIcon} size="sm" className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      {caisse && (
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
          <span className="flex items-center gap-1 text-success">
            <AppIcon icon={CheckCircleIcon} size="xs" /> Statut: {caisse.statut}
          </span>
          {caisse.dernier_rapprochement && (
            <span>Rapprochement: {new Date(caisse.dernier_rapprochement).toLocaleDateString('fr-FR')}</span>
          )}
        </div>
      )}
    </Card>
  );
};

export default CaisseWidget;
