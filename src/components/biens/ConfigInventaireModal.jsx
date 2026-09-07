import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { configInventaireService } from '../../services/configInventaire';
import { AppIcon, XMarkIcon } from '../ui/icons';

const ConfigInventaireModal = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState({ regle: 'INV-{YEAR}-{SEQ}', longueur_sequence: 4, reset_period: 'annuel' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const data = await configInventaireService.get();
      setConfig(data);
      generatePreview(data);
    } catch (err) {
      setError('Erreur chargement configuration');
    }
  };

  const generatePreview = (cfg) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seq = '0001'.slice(-cfg.longueur_sequence);
    let previewStr = cfg.regle
      .replace(/\{YEAR\}/g, year)
      .replace(/\{MONTH\}/g, month)
      .replace(/\{DAY\}/g, day)
      .replace(/\{SEQ\}/g, seq);
    setPreview(previewStr);
  };

  const handleChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    generatePreview(newConfig);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await configInventaireService.update(config);
      if (onSave) onSave();
      onClose();
    } catch (err) {
      setError('Erreur lors de la mise à jour de la configuration');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-border-light dark:border-border-dark">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            {t('inventaire.configTitle') || 'Configuration du numéro d\'inventaire'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-night-hover transition-colors">
            <AppIcon icon={XMarkIcon} size="md" className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t('inventaire.regle') || 'Règle de génération'}
            </label>
            <input
              type="text"
              value={config.regle}
              onChange={(e) => handleChange('regle', e.target.value)}
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: INV-{YEAR}-{SEQ}"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Variables: {'{YEAR}, {MONTH}, {DAY}, {SEQ}'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t('inventaire.longueur') || 'Longueur de la séquence'}
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.longueur_sequence}
              onChange={(e) => handleChange('longueur_sequence', parseInt(e.target.value) || 4)}
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t('inventaire.resetPeriod') || 'Réinitialisation'}
            </label>
            <select
              value={config.reset_period}
              onChange={(e) => handleChange('reset_period', e.target.value)}
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="annuel">Annuelle</option>
              <option value="mensuel">Mensuelle</option>
              <option value="jamais">Jamais</option>
            </select>
          </div>
          <div className="bg-gray-50 dark:bg-night-hover/50 p-3 rounded-lg border border-border-light dark:border-border-dark">
            <p className="text-sm text-gray-600 dark:text-slate-300">
              {t('inventaire.preview') || 'Aperçu'}: <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">{preview}</span>
            </p>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-border-light dark:border-border-dark">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-night-muted text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-night-hover transition-colors">
              {t('common.cancel') || 'Annuler'}
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (t('common.saving') || 'Enregistrement...') : (t('common.save') || 'Enregistrer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigInventaireModal;