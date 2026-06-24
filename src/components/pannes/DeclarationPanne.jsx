import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { pannesService } from '../../services/pannes';
import { biensService } from '../../services/biens';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../context/LanguageContext';
import {
  AppIcon,
  PANNE_TYPE_CONFIG,
  PANNE_PRIORITE_CONFIG,
  ArrowLeftIcon,
  CheckCircleIcon,
  BellAlertIcon,
} from '../ui/icons';

const DeclarationPanne = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bienIdFromUrl = searchParams.get('bien_id');
  const { user } = useAuth();

  const [bien, setBien] = useState(null);
  const [formData, setFormData] = useState({
    id_bien: bienIdFromUrl || '',
    type_panne: 'AUTRE',
    priorite: 'MOYENNE',
    description: '',
    diagnostic: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const TYPE_LABELS = {
    MECANIQUE: t('pannes.typeMecanique'),
    ELECTRIQUE: t('pannes.typeElectrique'),
    ELECTRONIQUE: t('pannes.typeElectronique'),
    LOGICIELLE: t('pannes.typeLogicielle'),
    STRUCTURELLE: t('pannes.typeStructurelle'),
    AUTRE: PANNE_TYPE_CONFIG.AUTRE.label,
  };

  const PRIORITE_LABELS = {
    BASSE: t('pannes.prioriteBasse'),
    MOYENNE: t('pannes.prioriteMoyenne'),
    HAUTE: t('pannes.prioriteHaute'),
    CRITIQUE: t('pannes.prioriteCritique'),
  };

  const TYPES_PANNE = Object.entries(PANNE_TYPE_CONFIG).map(([value, cfg]) => ({
    value,
    label: TYPE_LABELS[value] || cfg.label,
    Icon: cfg.Icon,
  }));

  const PRIORITES = Object.entries(PANNE_PRIORITE_CONFIG).map(([value, cfg]) => ({
    value,
    label: PRIORITE_LABELS[value] || cfg.label,
    Icon: cfg.Icon,
  }));

  useEffect(() => {
    if (bienIdFromUrl) loadBien(bienIdFromUrl);
  }, [bienIdFromUrl]);

  const loadBien = async (id) => {
    try {
      const data = await biensService.getById(id);
      setBien(data);
      setFormData(prev => ({ ...prev, id_bien: id }));
    } catch (err) {
      setError(t('pannes.assetNotFound'));
    }
  };

  const searchBiens = async (term) => {
    if (!term || term.length < 2) return;
    try {
      const response = await biensService.getAll({ search: term, limit: 10 });
      setSearchResults(response.biens || []);
    } catch (err) {
      console.error('Erreur recherche:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_bien || !formData.description || formData.description.length < 5) {
      setError(t('pannes.requiredFields'));
      return;
    }
    setLoading(true);
    try {
      await pannesService.create(formData);
      navigate('/pannes/mes-pannes');
    } catch (err) {
      setError(err.response?.data?.detail || t('pannes.declareError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 dark:text-slate-300 p-1" aria-label={t('common.back')}>
          <AppIcon icon={ArrowLeftIcon} size="md" />
        </button>
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          <AppIcon icon={BellAlertIcon} size="md" />
          {t('pannes.title')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-6 space-y-6">
        {!bien ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pannes.assetLabel')} *</label>
            <input
              type="text"
              placeholder={t('pannes.assetSearchPlaceholder')}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); searchBiens(e.target.value); }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-lg overflow-hidden">
                {searchResults.map(b => (
                  <button
                    key={b.id_bien}
                    type="button"
                    onClick={() => {
                      setBien(b);
                      setFormData(prev => ({ ...prev, id_bien: b.id_bien }));
                      setSearchResults([]);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800/50 border-b last:border-b-0"
                  >
                    <div className="font-medium">{b.marque || b.fabricant} {b.modele || ''}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-500">{b.type_bien} • {b.localisation}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">{t('pannes.assetLabel')}</p>
                <p className="font-medium">{bien.marque || bien.fabricant} {bien.modele || ''}</p>
                <p className="text-sm text-gray-400 dark:text-slate-500">{bien.type_bien} • {bien.localisation}</p>
              </div>
              <button type="button" onClick={() => { setBien(null); setFormData(prev => ({ ...prev, id_bien: '' })); }} className="text-sm text-red-500 hover:text-red-700">
                {t('pannes.changeAsset')}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pannes.breakdownType')} *</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES_PANNE.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type_panne: type.value }))}
                className={`px-3 py-2 rounded-lg border text-sm transition-all inline-flex items-center gap-1.5 ${formData.type_panne === type.value ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                {type.Icon && <AppIcon icon={type.Icon} size="xs" className={formData.type_panne === type.value ? 'text-white' : ''} />}
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pannes.priority')} *</label>
          <div className="flex gap-2 flex-wrap">
            {PRIORITES.map(prio => (
              <button
                key={prio.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priorite: prio.value }))}
                className={`px-4 py-2 rounded-lg border text-sm transition-all inline-flex items-center gap-1.5 ${formData.priorite === prio.value ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                {prio.Icon && <AppIcon icon={prio.Icon} size="xs" className={formData.priorite === prio.value ? 'text-white' : ''} />}
                {prio.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pannes.description')} *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600"
            placeholder={t('pannes.descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pannes.diagnostic')}</label>
          <textarea
            value={formData.diagnostic}
            onChange={(e) => setFormData(prev => ({ ...prev, diagnostic: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600"
            placeholder={t('pannes.diagnosticPlaceholder')}
          />
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg">{t('common.cancel')}</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-2">
            {loading ? t('pannes.declaring') : (
              <>
                <AppIcon icon={CheckCircleIcon} size="sm" className="text-white" />
                {t('pannes.declare')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeclarationPanne;
