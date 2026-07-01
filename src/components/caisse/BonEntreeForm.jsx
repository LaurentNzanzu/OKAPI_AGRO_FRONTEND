// frontend/src/components/caisse/BonEntreeForm.jsx
import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { caisseService } from '../../services/caisse';
import Button from '../ui/Button';

export const BonEntreeForm = ({ onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [montant, setMontant] = useState('');
    const [motif, setMotif] = useState('');
    const [modeReglement, setModeReglement] = useState('ESPECES');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!montant || parseFloat(montant) <= 0 || !motif.trim()) return;

        try {
            setLoading(true);
            setError(null);
            await caisseService.approvisionner({
                montant: parseFloat(montant),
                motif: motif.trim(),
                mode_reglement: modeReglement
            });
            onSuccess();
        } catch (err) {
            console.error('Erreur approvisionnement:', err);
            setError(err.response?.data?.detail || 'Une erreur est survenue lors de l\'approvisionnement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2 mb-4">{t('caisse.bonEntree')}</h3>
            
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('caisse.montant')} (USD)
                </label>
                <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    className="form-input w-full dark:bg-slate-800 dark:border-slate-700"
                    placeholder="0.00"
                    required
                    disabled={loading}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Mode de règlement
                </label>
                <select
                    value={modeReglement}
                    onChange={(e) => setModeReglement(e.target.value)}
                    className="form-input w-full dark:bg-slate-800 dark:border-slate-700"
                    disabled={loading}
                >
                    <option value="ESPECES">Espèces (Caisse)</option>
                    <option value="CHEQUE">Chèque</option>
                    <option value="VIREMENT">Virement Bancaire</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Motif / Origine des fonds (Justification oblig.)
                </label>
                <textarea
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    className="form-input w-full dark:bg-slate-800 dark:border-slate-700"
                    rows="3"
                    placeholder="Rapprovisionnement de caisse par la banque, encaissement de facture..."
                    required
                    disabled={loading}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                    Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Traitement en cours...' : 'Générer BEC'}
                </Button>
            </div>
        </form>
    );
};

export default BonEntreeForm;
