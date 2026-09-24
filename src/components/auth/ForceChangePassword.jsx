
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth';
import Button from '../ui/Button';

const RULES = [
  { key: 'length', label: 'Au moins 8 caractères', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Au moins 1 majuscule', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Au moins 1 minuscule', test: (v) => /[a-z]/.test(v) },
  { key: 'digit', label: 'Au moins 1 chiffre', test: (v) => /\d/.test(v) },
];

const ForceChangePassword = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [nouveau, setNouveau] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rulesStatus = RULES.map((r) => ({ ...r, ok: r.test(nouveau) }));
  const allRulesOk = rulesStatus.every((r) => r.ok);
  const match = nouveau && nouveau === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!allRulesOk) {
      setError('Le mot de passe ne respecte pas toutes les règles.');
      return;
    }
    if (!match) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.forceChangePassword(nouveau);

      if (result.success) {
        // Mettre à jour le user local
        updateUser({ ...user, doit_changer_mot_de_passe: false });
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur inattendue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 dark:bg-primary-800 px-6 py-5">
          <h1 className="text-xl font-bold text-white">
            Changement de mot de passe requis
          </h1>
          <p className="text-sm text-primary-100 mt-1">
            Pour des raisons de sécurité, vous devez changer votre mot de passe temporaire avant de continuer.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              autoFocus
              autoComplete="new-password"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="••••••••"
            />
          </div>

          {/* Règles en direct */}
          <div className="space-y-1.5">
            {rulesStatus.map((r) => (
              <div key={r.key} className="flex items-center gap-2 text-xs">
                <span className={r.ok ? 'text-success' : 'text-gray-400'}>
                  {r.ok ? '✓' : '○'}
                </span>
                <span className={r.ok ? 'text-success' : 'text-gray-500 dark:text-slate-400'}>
                  {r.label}
                </span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="••••••••"
            />
            {confirm && !match && (
              <p className="text-xs text-danger mt-1">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading || !allRulesOk || !match}
          >
            {loading ? 'Enregistrement...' : 'Valider et continuer'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePassword;
