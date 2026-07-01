// frontend/src/components/caisse/RapprochementForm.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { caisseService } from '../../services/caisse';
import Button from '../ui/Button';

export const RapprochementForm = ({ onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [soldePhysique, setSoldePhysique] = useState('');
    const [caisseId, setCaisseId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCaisse = async () => {
            try {
                const caisse = await caisseService.getPrincipale();
                if (caisse) {
                    setCaisseId(caisse.id_caisse);
                }
            } catch (err) {
                console.error(err);
                setError('Caisse principale introuvable.');
            }
        };
        fetchCaisse();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!soldePhysique || !caisseId) return;

        try {
            setLoading(true);
            setError(null);
            await caisseService.effectuerRapprochement(caisseId, parseFloat(soldePhysique));
            onSuccess();
        } catch (err) {
            console.error('Erreur rapprochement:', err);
            setError(err.response?.data?.detail || 'Une erreur est survenue lors du rapprochement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2 mb-4">Rapprochement de Caisse</h3>
            
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Solde Réel Physiquement Compté (USD)
                </label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={soldePhysique}
                    onChange={(e) => setSoldePhysique(e.target.value)}
                    className="form-input w-full dark:bg-slate-800 dark:border-slate-700"
                    placeholder="0.00"
                    required
                    disabled={loading || !caisseId}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Indiquez le montant total en espèces physiquement présent dans le coffre. Un écart de caisse sera automatiquement calculé et journalisé.
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                    Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={loading || !caisseId}>
                    {loading ? 'Validation...' : 'Valider Rapprochement'}
                </Button>
            </div>
        </form>
    );
};

export default RapprochementForm;
