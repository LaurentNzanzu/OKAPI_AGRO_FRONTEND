import React, { useState } from 'react';
import { pannesService } from '../../services/pannes';
import { useTranslation } from '../../context/LanguageContext';

/**
 * Modal de confirmation pour résoudre une panne après phase de test.
 */
const ResoudrePanneModal = ({ panneId, isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!confirmed) {
      setError(t('pannes.resoudreModal.errors.confirmationRequise'));
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await pannesService.resoudre(panneId);
      alert(t('pannes.resoudreModal.success'));
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || t('pannes.resoudreModal.errors.resolution'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="modal-panel bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">{t('pannes.resoudreModal.title')}</h3>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">
          {t('pannes.resoudreModal.description')}
        </p>
        <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-4">
          {t('pannes.resoudreModal.warning')}
        </p>
        <label className="flex items-center gap-2 mb-4 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          {t('pannes.resoudreModal.checkbox')}
        </label>
        {error && <div className="alert-error mb-3 text-sm">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>{t('common.cancel')}</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? t('pannes.resoudreModal.submit.loading') : t('pannes.resoudreModal.submit.label')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResoudrePanneModal;
