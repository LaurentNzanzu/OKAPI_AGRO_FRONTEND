// frontend/src/components/cessions/CessionModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { biensService } from '../../services/biens';
import { formatPrice } from '../../utils/formatters';
import Button from '../ui/Button';
import {
  XMarkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarDaysIcon,
  LinkIcon,
  ExclamationTriangleIcon,
   ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';
import { AppIcon } from '../ui/icons';

const CessionModal = ({ isOpen, onClose, bien, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    prix_vente: '',
    date_cession: new Date().toISOString().split('T')[0],
    type_cession: 'courante',
    motif: '',
    actif_remplacement_id: '',
    acheteur: '',
    mode_reglement: 'virement',
    piece_justificative_url: '',
    commentaire: '',
  });

  useEffect(() => {
    if (bien) {
      // Pré-remplir avec la VNC si disponible
      const vnc = bien.valeur_nette_comptable || bien.prix_acquisition || 0;
      setFormData(prev => ({
        ...prev,
        prix_vente: vnc > 0 ? Math.round(vnc * 0.8) : '',
      }));
    }
  }, [bien]);

  if (!isOpen || !bien) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.prix_vente || parseFloat(formData.prix_vente) <= 0) {
      setError(t('cessions.errors.prixRequired'));
      return;
    }

    if (!formData.motif.trim()) {
      setError(t('cessions.errors.motifRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        prix_vente: parseFloat(formData.prix_vente),
        date_cession: formData.date_cession,
        type_cession: formData.type_cession,
        motif: formData.motif,
        acheteur: formData.acheteur || null,
        mode_reglement: formData.mode_reglement,
        actif_remplacement_id: formData.actif_remplacement_id ? parseInt(formData.actif_remplacement_id) : null,
        piece_justificative_url: formData.piece_justificative_url || null,
        commentaire: formData.commentaire || null,
      };

      const result = await biensService.demanderCession(bien.id_bien, payload);
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Erreur cession:', err);
      setError(err.response?.data?.detail || t('cessions.errors.submitError'));
    } finally {
      setLoading(false);
    }
  };

  const vnc = bien.valeur_nette_comptable || bien.prix_acquisition || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex justify-between items-center p-5 border-b border-border-light dark:border-border-dark">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {t('cessions.title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {bien.marque || bien.fabricant} {bien.modele} - {bien.qr_code}
            </p>
          </div>
          <button 
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-night-hover transition-colors"
            onClick={onClose}
          >
            <AppIcon icon={XMarkIcon} size="md" className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Corps */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Informations du bien */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-night-active rounded-lg">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('cessions.acquisitionPrice')}</p>
              <p className="font-medium text-gray-900 dark:text-slate-100">{formatPrice(bien.prix_acquisition)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('cessions.netBookValue')}</p>
              <p className="font-medium text-gray-900 dark:text-slate-100">{formatPrice(vnc)}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-2 text-danger text-sm">
              <AppIcon icon={ExclamationTriangleIcon} size="sm" className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulaire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('cessions.salePrice')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <AppIcon icon={CurrencyDollarIcon} size="sm" />
                </span>
                <input
                  type="number"
                  value={formData.prix_vente}
                  onChange={(e) => handleChange('prix_vente', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {t('cessions.salePriceHelp')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('cessions.cessionDate')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <AppIcon icon={CalendarDaysIcon} size="sm" />
                </span>
                <input
                  type="date"
                  value={formData.date_cession}
                  onChange={(e) => handleChange('date_cession', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('cessions.cessionType')}
              </label>
              <select
                value={formData.type_cession}
                onChange={(e) => handleChange('type_cession', e.target.value)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                <option value="courante">{t('cessions.types.current')}</option>
                <option value="non_courante">{t('cessions.types.nonCurrent')}</option>
                <option value="mise_au_rebut">{t('cessions.types.scrap')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('cessions.paymentMethod')}
              </label>
              <select
                value={formData.mode_reglement}
                onChange={(e) => handleChange('mode_reglement', e.target.value)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                <option value="virement">{t('cessions.paymentMethods.transfer')}</option>
                <option value="comptant">{t('cessions.paymentMethods.cash')}</option>
                <option value="cheque">{t('cessions.paymentMethods.check')}</option>
                <option value="credit">{t('cessions.paymentMethods.credit')}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('cessions.buyer')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <AppIcon icon={UserIcon} size="sm" />
                </span>
                <input
                  type="text"
                  value={formData.acheteur}
                  onChange={(e) => handleChange('acheteur', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder={t('cessions.buyerPlaceholder')}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('cessions.replacementAssetId')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <AppIcon icon={LinkIcon} size="sm" />
                </span>
                <input
                  type="number"
                  value={formData.actif_remplacement_id}
                  onChange={(e) => handleChange('actif_remplacement_id', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder={t('cessions.replacementAssetPlaceholder')}
                  min="0"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {t('cessions.replacementAssetHelp')}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('cessions.motif')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <AppIcon icon={DocumentTextIcon} size="sm" />
                </span>
                <textarea
                  value={formData.motif}
                  onChange={(e) => handleChange('motif', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  rows="2"
                  placeholder={t('cessions.motifPlaceholder')}
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('cessions.comment')}
              </label>
              <textarea
                value={formData.commentaire}
                onChange={(e) => handleChange('commentaire', e.target.value)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                rows="2"
                placeholder={t('cessions.commentPlaceholder')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="success"
              type="submit"
              isLoading={loading}
              disabled={loading}
            >
              <AppIcon icon={ArrowRightCircleIcon} size="sm" className="mr-1" />
              {t('cessions.launch')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CessionModal;