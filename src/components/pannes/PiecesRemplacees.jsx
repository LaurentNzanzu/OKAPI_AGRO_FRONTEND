import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { piecesService } from '../../services/pieces';
import { formatPrice } from '../../utils/formatters';
import { AppIcon, WrenchScrewdriverIcon, TrashIcon, PlusIcon } from '../ui/icons';

const PiecesRemplacees = ({ panneId, readOnly = false, onPiecesChange }) => {
  const { t } = useTranslation();
    const [pieces, setPieces] = useState([]);
    const [selectedPieces, setSelectedPieces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPiece, setNewPiece] = useState({ id_piece: '', quantite: 1 });
    const [catalogue, setCatalogue] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPiecesRemplacees();
        fetchCatalogue();
    }, [panneId]);

    const fetchPiecesRemplacees = async () => {
        try {
            setLoading(true);
            // Récupérer depuis l'API (si endpoint existe)
            if (piecesService.getByPanneId) {
                const response = await piecesService.getByPanneId(panneId);
                if (response) setSelectedPieces(response);
            }
        } catch (err) {
            console.error('Erreur chargement pièces remplacées:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalogue = async () => {
        try {
            const data = await piecesService.getAll({ est_active: true });
            setCatalogue(data);
        } catch (err) {
            console.error('Erreur chargement catalogue:', err);
        }
    };

    const getPieceDetails = (idPiece) => {
        return catalogue.find(p => p.id_piece === Number(idPiece));
    };

    const handleAddPiece = () => {
        if (!newPiece.id_piece) {
            setError('Veuillez sélectionner une pièce');
            return;
        }
        const quantite = Number(newPiece.quantite);
        if (!quantite || quantite < 1) {
            setError('La quantité doit être au moins 1');
            return;
        }

        const pieceDetails = getPieceDetails(newPiece.id_piece);
        if (!pieceDetails) {
            setError('Pièce non trouvée');
            return;
        }

        const existingIndex = selectedPieces.findIndex(p => Number(p.id_piece) === Number(newPiece.id_piece));
        
        // Calcul de la nouvelle liste
        let updatedPieces;
        if (existingIndex >= 0) {
            updatedPieces = [...selectedPieces];
            updatedPieces[existingIndex].quantite += quantite;
            updatedPieces[existingIndex].prix_total = updatedPieces[existingIndex].quantite * pieceDetails.prix_achat;
        } else {
            updatedPieces = [...selectedPieces, {
                id_piece: Number(newPiece.id_piece),
                reference: pieceDetails.reference,
                designation: pieceDetails.designation,
                prix_unitaire: pieceDetails.prix_achat,
                quantite: quantite,
                prix_total: quantite * pieceDetails.prix_achat
            }];
        }

        // Mise à jour de l'état et notification au parent
        setSelectedPieces(updatedPieces);
        setShowAddForm(false);
        setNewPiece({ id_piece: '', quantite: 1 });
        setError(null);
        
        if (onPiecesChange) {
            onPiecesChange(updatedPieces);
        }
    };

    const handleRemovePiece = (index) => {
        const updated = [...selectedPieces];
        updated.splice(index, 1);
        setSelectedPieces(updated);
        if (onPiecesChange) onPiecesChange(updated);
    };

    const updateQuantite = (index, newQuantite) => {
        const quantite = Number(newQuantite);
        if (!quantite || quantite < 1) return;
        
        const updated = [...selectedPieces];
        updated[index].quantite = quantite;
        updated[index].prix_total = quantite * updated[index].prix_unitaire;
        setSelectedPieces(updated);
        if (onPiecesChange) onPiecesChange(updated);
    };

    const getTotalCost = () => {
        return selectedPieces.reduce((sum, p) => sum + (p.prix_total || 0), 0);
    };

    if (loading) {
        return <div className="text-center py-4 text-gray-500 dark:text-slate-400">Chargement...</div>;
    }

    return (
        <div className="app-page">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 dark:text-slate-300 inline-flex items-center gap-2">
                    <AppIcon icon={WrenchScrewdriverIcon} size="sm" />
                    Pièces remplacées
                </h3>
                {!readOnly && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-flex items-center gap-1.5"
                    >
                        <AppIcon icon={PlusIcon} size="xs" className="text-white" />
                        Ajouter une pièce
                    </button>
                )}
            </div>

            {selectedPieces.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed">
                    <p className="text-gray-400 dark:text-slate-500 text-sm">Aucune pièce enregistrée</p>
                    {!readOnly && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="mt-2 text-xs text-primary-500 hover:text-primary-600"
                        >
                            Ajouter des pièces
                        </button>
                    )}
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-2 text-left">Référence</th>
                                <th className="px-4 py-2 text-left">Désignation</th>
                                <th className="px-4 py-2 text-center">Quantité</th>
                                <th className="px-4 py-2 text-right">Prix unitaire</th>
                                <th className="px-4 py-2 text-right">Total</th>
                                {!readOnly && <th className="px-4 py-2 text-center">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {selectedPieces.map((piece, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 font-mono text-xs">{piece.reference}</td>
                                    <td className="px-4 py-2">{piece.designation}</td>
                                    <td className="px-4 py-2 text-center">
                                        {readOnly ? (
                                            <span>{piece.quantite}</span>
                                        ) : (
                                            <input
                                                type="number"
                                                min="1"
                                                value={piece.quantite}
                                                onChange={(e) => updateQuantite(idx, e.target.value)}
                                                className="w-16 px-2 py-1 text-center border rounded"
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-right">{formatPrice(piece.prix_unitaire)}</td>
                                    <td className="px-4 py-2 text-right font-medium">{formatPrice(piece.prix_total)}</td>
                                    {!readOnly && (
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleRemovePiece(idx)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                aria-label="Supprimer"
                                            >
                                                <AppIcon icon={TrashIcon} size="sm" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-slate-800/50 border-t">
                            <tr>
                                <td colSpan="4" className="px-4 py-2 text-right font-semibold">Total général:</td>
                                <td className="px-4 py-2 text-right font-bold text-primary-600">{formatPrice(getTotalCost())}</td>
                                {!readOnly && <td></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md">
                        <h4 className="text-lg font-semibold mb-4">Ajouter une pièce</h4>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-2 rounded-lg mb-4 text-sm">{error}</div>
                        )}
                        <div className="app-page">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Pièce *</label>
                                <select
                                    value={newPiece.id_piece}
                                    onChange={(e) => setNewPiece({ ...newPiece, id_piece: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                >
                                    <option value="">Sélectionner une pièce</option>
                                    {catalogue.map(p => (
                                        <option key={p.id_piece} value={p.id_piece}>
                                            {p.reference} - {p.designation} ({formatPrice(p.prix_achat)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Quantité *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newPiece.quantite}
                                    onChange={(e) => setNewPiece({ ...newPiece, quantite: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => { setShowAddForm(false); setError(null); }}
                                    className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAddPiece}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PiecesRemplacees;