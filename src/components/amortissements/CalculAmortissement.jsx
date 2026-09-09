// frontend/src/components/amortissements/CalculAmortissement.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { amortissementsService } from '../../services/amortissements';
import { biensService } from '../../services/biens';
import { composantsService } from '../../services/composants';
import { formatPrice } from '../../utils/formatters';
import {
  AppIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  XMarkIcon,
} from '../ui/icons';

const inputCls =
  'w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1';

const formatApiError = (err, t) => {
    if (!err.response?.data?.detail) {
        return err.message || t('common.errors.generic');
    }
    const detail = err.response.data.detail;
    if (Array.isArray(detail)) {
        return detail
            .map(d => {
                const field = d.loc?.filter(l => l !== 'body').join('.') || t('common.errors.field');
                return `${field}: ${d.msg}`;
            })
            .join(', ');
    }
    if (typeof detail === 'string') {
        return detail;
    }
    if (typeof detail === 'object') {
        return JSON.stringify(detail);
    }
    return t('common.errors.validation');
};

const CalculAmortissement = ({ bienId, onSuccess, onCancel }) => {
    const { t } = useTranslation();
    const [bien, setBien] = useState(null);
    const [regles, setRegles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingReglesError, setLoadingReglesError] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [calculPreview, setCalculPreview] = useState(null);
    const [formData, setFormData] = useState({
        id_bien: bienId || '',
        exercice: new Date().getFullYear(),
        methode: 'LINEAIRE',
        valeur_origine: '',
        valeur_residuelle: 0,
        duree_vie_comptable_ans: 5,
        duree_vie_fiscale_ans: 4,
        coefficient_deg: 2.0,
        date_acquisition: '',
        date_mise_en_service: '',
        unites_totales_prevues: '',
        unites_consommees_exercice: '',
        production_totale_prevue: '',
        production_reelle_exercice: '',
        duree_fournisseur: '',
        jours_ouvres_mois: 26,
        jours_utilisation_annee: 260
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [composants, setComposants] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setLoadingReglesError(false);
            
            try {
                try {
                    const rulesData = await amortissementsService.getRegles();
                    setRegles(rulesData || []);
                } catch (rulesErr) {
                    console.warn('Impossible de charger les règles, utilisation des valeurs par défaut:', rulesErr);
                    setLoadingReglesError(true);
                    setRegles([]);
                }
                
                if (bienId && bienId !== 'undefined' && bienId !== 'null') {
                    await loadBien(bienId);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Erreur générale:', err);
                setError(t('amortissements.calcul.loadError'));
                setLoading(false);
            }
        };
        
        loadData();
    }, [bienId]);

    useEffect(() => {
        const loadComposants = async () => {
            if (!bienId || bienId === 'undefined' || bienId === 'null') {
                setComposants([]);
                return;
            }
            try {
                const data = await composantsService.getByBienId(parseInt(bienId));
                setComposants(data?.composants || []);
            } catch (err) {
                console.warn('Impossible de charger les composants:', err);
                setComposants([]);
            }
        };
        loadComposants();
    }, [bienId]);

    // Recalculer la prévisualisation dynamiquement dès que les champs pertinents changent
    useEffect(() => {
        if (showDetails) {
            previewCalcul();
        }
    }, [
        formData.date_mise_en_service, 
        formData.date_acquisition, 
        formData.exercice, 
        formData.methode, 
        formData.valeur_origine, 
        formData.duree_vie_comptable_ans
    ]);

    const loadBien = async (id) => {
        if (!id || isNaN(id) || parseInt(id) <= 0) {
            setError(t('amortissements.calcul.invalidBienId'));
            setLoading(false);
            return;
        }
        
        try {
            const data = await biensService.getById(parseInt(id));
            setBien(data);
            
            let dateAcquisition = '';
            let dateMiseEnService = '';
            
            if (data.date_acquisition) {
                dateAcquisition = data.date_acquisition.split('T')[0];
                dateMiseEnService = dateAcquisition;
            }
            
            let dureeDefaut = 5;
            if (data.type_bien === 'vehicule') dureeDefaut = 5;
            else if (data.type_bien === 'machine') dureeDefaut = 8;
            else if (data.type_bien === 'ordinateur') dureeDefaut = 3;
            
            setFormData(prev => ({
                ...prev,
                id_bien: id,
                valeur_origine: data.prix_acquisition || '',
                duree_vie_comptable_ans: dureeDefaut,
                duree_vie_fiscale_ans: Math.max(dureeDefaut - 1, 3),
                coefficient_deg: 2.0,
                date_acquisition: dateAcquisition,
                date_mise_en_service: dateMiseEnService
            }));
            
            setLoading(false);
        } catch (err) {
            console.error('Erreur chargement bien:', err);
            const errorMessage = formatApiError(err, t);
            if (err.response?.status === 404) {
                setError(t('amortissements.calcul.bienNotFound', { id }));
            } else {
                setError(errorMessage);
            }
            setBien(null);
            setLoading(false);
        }
    };

    const calculerJoursProrataLineaire = () => {
        if (!formData.date_mise_en_service) return 360;
        const dateDebut = new Date(formData.date_mise_en_service);
        const exercice = parseInt(formData.exercice);
        const debutAnnee = new Date(exercice, 0, 1);
        
        if (dateDebut <= debutAnnee) return 360;
        
        const joursDansMois = 30;
        const moisEnCours = dateDebut.getMonth();
        const moisRestants = 12 - moisEnCours;
        const jourDansMois = dateDebut.getDate();
        const joursRestantsMois = Math.min(joursDansMois, 30) - jourDansMois + 1;
        const totalJours = (joursRestantsMois > 0 ? joursRestantsMois : 0) + (moisRestants - 1) * joursDansMois;
        
        return Math.max(0, Math.min(totalJours, 360));
    };

    const calculerMoisProrataDegressif = () => {
        if (!formData.date_acquisition) return 12;
        const dateDebut = new Date(formData.date_acquisition);
        const exercice = parseInt(formData.exercice);
        const anneeAcquisition = dateDebut.getFullYear();
        const moisAcquisition = dateDebut.getMonth();
        if (anneeAcquisition < exercice) return 12;
        if (anneeAcquisition > exercice) return 0;
        return 12 - moisAcquisition;
    };

    const previewCalcul = () => {
        const base = parseFloat(formData.valeur_origine || 0) - parseFloat(formData.valeur_residuelle || 0);
        const dureeTotale = parseInt(formData.duree_vie_comptable_ans) || 1;
        let annuite = 0;
        let detail = '';
        
        if (formData.methode === 'LINEAIRE') {
            const taux = 100 / dureeTotale;
            const jours = calculerJoursProrataLineaire();
            annuite = base * (taux / 100) * (jours / 360);
            detail = `${base.toFixed(2)} × ${(taux/100).toFixed(4)} × (${jours}/360) = ${annuite.toFixed(2)}`;
        } else if (formData.methode === 'DEGRESSIF') {
            const coeff = parseFloat(formData.coefficient_deg) || 2.0;
            const tauxBase = 100 / dureeTotale;
            const tauxDeg = (tauxBase / 100) * coeff;
            const mois = calculerMoisProrataDegressif();
            annuite = base * tauxDeg * (mois / 12);
            detail = `${base.toFixed(2)} × ${(tauxBase/100 * coeff).toFixed(4)} × (${mois}/12) = ${annuite.toFixed(2)}`;
        } else if (formData.methode === 'COMPOSANTS') {
            if (composants.length === 0) {
                setError(t('amortissements.calcul.noComposants'));
                return;
            }
            const jours = calculerJoursProrataLineaire();
            let total = 0;
            const lignes = composants.map((c) => {
                const annuiteComp = c.duree_vie_ans ? (c.valeur / c.duree_vie_ans) * (jours / 360) : 0;
                total += annuiteComp;
                return `${c.designation}: ${annuiteComp.toFixed(2)}`;
            });
            const sommeComposants = composants.reduce((s, c) => s + (parseFloat(c.valeur) || 0), 0);
            const valeurOrigine = parseFloat(formData.valeur_origine) || 0;
            const structure = valeurOrigine - sommeComposants;
            if (structure > 0.01) {
                const annuiteStructure = (structure / dureeTotale) * (jours / 360);
                total += annuiteStructure;
                lignes.push(`${t('amortissements.calcul.structureResiduelle')}: ${annuiteStructure.toFixed(2)}`);
            }
            annuite = total;
            detail = lignes.join(' + ');
        }
        
        setCalculPreview({
            base: base,
            jours: formData.methode === 'LINEAIRE' ? calculerJoursProrataLineaire() : null,
            mois: formData.methode === 'DEGRESSIF' ? calculerMoisProrataDegressif() : null,
            taux: formData.methode === 'LINEAIRE' ? (100 / dureeTotale) : null,
            coefficient: formData.methode === 'DEGRESSIF' ? formData.coefficient_deg : null,
            annuite: annuite,
            detailCalcul: detail
        });
        setShowDetails(true);
    };

    const getDynamicFields = () => {
        const method = formData.methode;
        
        if (method === 'DEGRESSIF') {
            return (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>{t('amortissements.calcul.coeffDegressif')}</label>
                        <select
                            value={formData.coefficient_deg || 2.0}
                            onChange={(e) => setFormData({ ...formData, coefficient_deg: parseFloat(e.target.value) })}
                            className={inputCls}
                        >
                            <option value="1.5">{t('amortissements.calcul.coeff15')}</option>
                            <option value="2.0">{t('amortissements.calcul.coeff20')}</option>
                            <option value="2.5">{t('amortissements.calcul.coeff25')}</option>
                        </select>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('amortissements.calcul.prorataDegMois', { mois: calculerMoisProrataDegressif() })}</p>
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
                        <p className="text-xs text-primary-600">
                            {t('amortissements.calcul.tauxBase', {
                                taux: (100 / (formData.duree_vie_comptable_ans || 1)).toFixed(2),
                                coeff: formData.coefficient_deg || '?',
                                result: (100 / (formData.duree_vie_comptable_ans || 1) * (formData.coefficient_deg || 1)).toFixed(2),
                            })}
                        </p>
                    </div>
                </div>
            );
        }
        
        if (method === 'LINEAIRE') {
            return (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
                    <p className="text-xs text-primary-600">
                        {t('amortissements.calcul.joursProrata', { jours: calculerJoursProrataLineaire() })}
                        <br/>
                        {t('amortissements.calcul.dateMiseEnService')}: {formData.date_mise_en_service || t('amortissements.calcul.dateMiseNonDefinie')}
                    </p>
                </div>
            );
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.methode === 'COMPOSANTS' && composants.length === 0) {
            setError(t('amortissements.calcul.noComposants'));
            return;
        }
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        
        try {
            // Nettoyage et conversion stricte des types pour correspondre au schema FastAPI
            const parseNum = (val) => {
                if (val === '' || val === null || val === undefined) return null;
                const cleaned = String(val).replace(',', '.');
                const parsed = parseFloat(cleaned);
                return isNaN(parsed) ? null : parsed;
            };

            const parseIntNum = (val) => {
                const parsed = parseNum(val);
                return parsed !== null ? Math.round(parsed) : null;
            };

            const parseDateISO = (val) => {
                if (!val) return null;
                // Utiliser les composants locaux pour éviter le décalage UTC
                // (ex: "2024-01-15" → new Date().toISOString() → "2024-01-14T22:00:00Z" en UTC+2)
                const d = new Date(val);
                if (isNaN(d.getTime())) return null;
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };

            const payload = {
                id_bien: parseInt(formData.id_bien),
                exercice: parseInt(formData.exercice),
                methode: formData.methode,
                valeur_origine: parseNum(formData.valeur_origine) || 0,
                valeur_residuelle: parseNum(formData.valeur_residuelle) || 0,
                // ✅ CORRIGÉ : parseIntNum pour garantir le type int attendu par Pydantic
                duree_vie_comptable_ans: parseIntNum(formData.duree_vie_comptable_ans) || 5,
                duree_vie_fiscale_ans: parseIntNum(formData.duree_vie_fiscale_ans),
                coefficient_deg: parseNum(formData.coefficient_deg),
                // ✅ CORRIGÉ : fallback en YYYY-MM-DD (cohérent avec parseDateISO corrigée, sans toISOString)
                date_acquisition: parseDateISO(formData.date_acquisition) || `${parseInt(formData.exercice)}-01-01`,
                date_mise_en_service: parseDateISO(formData.date_mise_en_service) || `${parseInt(formData.exercice)}-01-01`,
                unites_totales_prevues: parseIntNum(formData.unites_totales_prevues),
                unites_consommees_exercice: parseIntNum(formData.unites_consommees_exercice),
                production_totale_prevue: parseIntNum(formData.production_totale_prevue),
                production_reelle_exercice: parseIntNum(formData.production_reelle_exercice),
                duree_fournisseur: parseIntNum(formData.duree_fournisseur),
                jours_ouvres_mois: parseIntNum(formData.jours_ouvres_mois) || 26,
                // ✅ CORRIGÉ : jours_utilisation_annee respecte la contrainte ge=200 du backend
                jours_utilisation_annee: Math.max(parseIntNum(formData.jours_utilisation_annee) || 260, 200)
            };
            
            // 🔍 DEBUG TEMPORAIRE — à supprimer après correction
            console.log('[DEBUG] Payload envoyé au backend:', JSON.stringify(payload, null, 2));

            await amortissementsService.create(payload);
            setSuccess(t('amortissements.calcul.success'));
            
            if (onSuccess) {
                setTimeout(() => onSuccess(), 1500);
            }
        } catch (err) {
            console.error('Erreur calcul amortissement:', err);
            // 🔍 DEBUG TEMPORAIRE — afficher le detail exact du 400
            if (err.response) {
                console.error('[DEBUG] Status:', err.response.status);
                console.error('[DEBUG] Body:', JSON.stringify(err.response.data, null, 2));
            }
            const errorMessage = formatApiError(err, t);
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-2 text-gray-500 dark:text-slate-400">{t('amortissements.calcul.loadingBien')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-lg p-6 border border-border-light dark:border-border-dark">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">{t('amortissements.calcul.title')}</h3>
            
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg mb-4 border border-red-200 dark:border-red-800">
                    <p className="text-sm">{error}</p>
                </div>
            )}
            
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 p-3 rounded-lg mb-4 border border-green-200 dark:border-green-800">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {bien && (
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('amortissements.calcul.bienConcerne')}</p>
                        <p className="font-medium text-gray-900 dark:text-slate-100">{bien.marque || bien.fabricant} {bien.modele || ''}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{t('amortissements.calcul.typeId', { type: bien.type_bien, id: bien.id_bien })}</p>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>{t('amortissements.calcul.exercice')}</label>
                        <input 
                            type="number" 
                            value={formData.exercice} 
                            onChange={(e) => setFormData({ ...formData, exercice: parseInt(e.target.value) || new Date().getFullYear() })} 
                            className={inputCls} 
                            required 
                        />
                    </div>
                    <div>
                        <label className={labelCls}>{t('amortissements.calcul.methode')}</label>
                        <select 
                            value={formData.methode} 
                            onChange={(e) => setFormData({ ...formData, methode: e.target.value })}
                            className={inputCls}
                        >
                            <option value="LINEAIRE">{t('amortissements.calcul.methodeLineaire')}</option>
                            <option value="DEGRESSIF">{t('amortissements.calcul.methodeDegressif')}</option>
                            <option value="UNITE_PRODUCTION">{t('amortissements.calcul.methodeUniteProduction')}</option>
                            <option value="COMPOSANTS">{t('amortissements.calcul.methodeComposants')}</option>
                            <option value="SPECIFIQUE_OKAPI">{t('amortissements.calcul.methodeOkapi')}</option>
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>{t('amortissements.calcul.valeurOrigine')}</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            value={formData.valeur_origine} 
                            onChange={(e) => setFormData({ ...formData, valeur_origine: e.target.value })} 
                            className={inputCls} 
                            required 
                        />
                    </div>
                    <div>
                        <label className={labelCls}>{t('amortissements.calcul.valeurResiduelle')}</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            value={formData.valeur_residuelle} 
                            onChange={(e) => setFormData({ ...formData, valeur_residuelle: e.target.value })} 
                            className={inputCls} 
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>{t('amortissements.calcul.dureeComptable')}</label>
                        <input 
                            type="number" 
                            value={formData.duree_vie_comptable_ans} 
                            onChange={(e) => setFormData({ ...formData, duree_vie_comptable_ans: e.target.value })} 
                            className={inputCls} 
                            required 
                        />
                    </div>
                    <div>
                        <label className={labelCls}>{t('amortissements.calcul.dureeFiscale')}</label>
                        <input 
                            type="number" 
                            value={formData.duree_vie_fiscale_ans} 
                            onChange={(e) => setFormData({ ...formData, duree_vie_fiscale_ans: e.target.value })} 
                            className={inputCls} 
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>{t('amortissements.calcul.dateAcquisition')}</label>
                        <input 
                            type="date" 
                            value={formData.date_acquisition} 
                            onChange={(e) => setFormData({ ...formData, date_acquisition: e.target.value })} 
                            className={inputCls} 
                            required 
                        />
                    </div>
                    <div>
                        <label className={labelCls}>{t('amortissements.calcul.dateMiseEnService')}</label>
                        <input 
                            type="date" 
                            value={formData.date_mise_en_service} 
                            onChange={(e) => setFormData({ ...formData, date_mise_en_service: e.target.value })} 
                            className={inputCls} 
                            required 
                        />
                    </div>
                </div>
                
                {getDynamicFields()}
                
                <div className="flex gap-3 pt-4 border-t">
                    <button type="button" onClick={previewCalcul} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                        {t('amortissements.calcul.previewBtn')}
                    </button>
                    <button type="submit" disabled={submitting || (formData.methode === 'COMPOSANTS' && composants.length === 0)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                        {submitting ? t('amortissements.calcul.submitting') : t('amortissements.calcul.submit')}
                    </button>
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg">
                            {t('common.cancel')}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CalculAmortissement;